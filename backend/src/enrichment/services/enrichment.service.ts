import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrawlerService } from './crawler.service';
import { ExtractionService } from './extraction.service';
import { VerificationService } from './verification.service';
import { ConfigService } from '@nestjs/config';
import {
  EnrichmentResultDto,
  EmailEvidence,
  PhoneEvidence,
  SocialLinks,
  AddressEvidence,
} from '../dto/enrichment-result.dto';

@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crawler: CrawlerService,
    private readonly extraction: ExtractionService,
    private readonly verification: VerificationService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Enrich a lead by ID
   */
  async enrichLead(leadId: string, dryRun = false): Promise<EnrichmentResultDto> {
    const startTime = Date.now();

    // Check if enrichment is enabled
    if (!this.configService.get<boolean>('ENRICHMENT_ENABLED', true)) {
      throw new Error('Enrichment is disabled');
    }

    // Get lead from database
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead ${leadId} not found`);
    }

    // Check if already enriched recently (cache)
    if (!dryRun) {
      const existing = await this.prisma.enriched_lead.findUnique({
        where: { lead_id: leadId },
      });

      if (existing) {
        const cacheTtl = 7 * 24 * 60 * 60 * 1000; // 7 days
        const cacheAge = Date.now() - existing.enriched_at.getTime();

        if (cacheAge < cacheTtl) {
          this.logger.log(`Using cached enrichment for lead ${leadId}`);
          return this.mapToDto(existing);
        }
      }
    }

    // Check if domain is blocklisted
    // Note: This checks global blocklist. For per-org blocks, pass organizationId
    if (lead.website) {
      const domain = this.extractDomain(lead.website);
      const blocked = await this.prisma.blocklist.findFirst({
        where: { domain },
      });

      if (blocked) {
        this.logger.warn(`Domain ${domain} is blocklisted - skipping enrichment`);
        return this.buildFailedResult(leadId, ['Domain is blocklisted'], 0);
      }
    }

    // If no website, return partial with contact page from discovery
    if (!lead.website) {
      return this.buildPartialResult(leadId, lead.contact_page_url ? [lead.contact_page_url] : [], 0);
    }

    // Crawl the website
    this.logger.log(`Starting enrichment for lead ${leadId} (${lead.website})`);
    const crawlResult = await this.crawler.crawlWebsite(lead.website, lead.name);

    // Aggregate all extracted data
    const allEmails: any[] = [];
    const allPhones: any[] = [];
    let socialLinks: SocialLinks = {};
    const allAddresses: any[] = [];
    const contactPageUrls: string[] = [];
    const contactFormUrls: string[] = [];

    for (const [pageUrl, extraction] of crawlResult.results.entries()) {
      allEmails.push(...extraction.emails);
      allPhones.push(...extraction.phones);
      socialLinks = { ...socialLinks, ...extraction.socialLinks };
      allAddresses.push(...extraction.addresses);

      if (extraction.isContactPage) {
        contactPageUrls.push(pageUrl);
      }

      if (extraction.contactForms.length > 0) {
        contactFormUrls.push(...extraction.contactForms.map((f) => f.formUrl));
      }
    }

    // Deduplicate
    const uniqueEmails = this.extraction.deduplicateEmails(allEmails);
    const uniquePhones = this.extraction.deduplicatePhones(allPhones);
    const uniqueContactPages = [...new Set(contactPageUrls)];
    const uniqueContactForms = [...new Set(contactFormUrls)];

    // Map to Evidence format
    const emailsFound: EmailEvidence[] = uniqueEmails.map((e) => ({
      email: e.email,
      pageUrl: e.pageUrl,
      evidenceSnippet: e.snippet,
      confidence: e.confidence,
      extractionMethod: e.method,
    }));

    const phonesFound: PhoneEvidence[] = uniquePhones.map((p) => ({
      phone: p.rawPhone,
      formattedPhone: p.normalizedPhone,
      pageUrl: p.pageUrl,
      evidenceSnippet: p.snippet,
      confidence: p.confidence,
      extractionMethod: p.method,
    }));

    const addressFound: AddressEvidence | undefined = allAddresses[0]
      ? {
          fullAddress: allAddresses[0].fullAddress,
          pageUrl: allAddresses[0].pageUrl,
          evidenceSnippet: allAddresses[0].snippet,
          parsed: allAddresses[0].parsed,
        }
      : undefined;

    // Determine enrichment status (quality gate)
    const enrichmentStatus = this.determineEnrichmentStatus(
      emailsFound,
      phonesFound,
      uniqueContactPages,
      lead.website,
    );

    const enrichmentLog = [
      ...crawlResult.logs,
      `Found: ${emailsFound.length} emails, ${phonesFound.length} phones, ${uniqueContactPages.length} contact pages`,
    ];

    const result: EnrichmentResultDto = {
      leadId,
      contactPageUrls: uniqueContactPages,
      contactFormUrl: uniqueContactForms[0] || undefined,
      emailsFound,
      phonesFound,
      socialLinks,
      addressFound,
      enrichmentStatus,
      enrichmentLog,
      crawlMetadata: {
        pagesCrawled: crawlResult.pagesCrawled,
        crawlDepth: this.configService.get<number>('ENRICHMENT_MAX_DEPTH', 2),
        crawlDurationMs: Date.now() - startTime,
        botDetected: crawlResult.botDetected,
        fallbackUsed: crawlResult.fallbackUsed,
        enrichedAt: new Date().toISOString(),
      },
    };

    // Save to database (unless dry run)
    if (!dryRun) {
      await this.saveEnrichment(result);
    }

    return result;
  }

  /**
   * Get enrichment by lead ID
   */
  async getEnrichment(leadId: string): Promise<EnrichmentResultDto | null> {
    const enriched = await this.prisma.enriched_lead.findUnique({
      where: { lead_id: leadId },
    });

    if (!enriched) {
      return null;
    }

    return this.mapToDto(enriched);
  }

  /**
   * Get enrichment statistics
   */
  async getStats() {
    const total = await this.prisma.enriched_lead.count();
    const success = await this.prisma.enriched_lead.count({
      where: { enrichment_status: 'success' },
    });
    const partial = await this.prisma.enriched_lead.count({
      where: { enrichment_status: 'partial' },
    });
    const failed = await this.prisma.enriched_lead.count({
      where: { enrichment_status: 'failed' },
    });
    const botDetected = await this.prisma.enriched_lead.count({
      where: { bot_detected: true },
    });

    const avgResult = await this.prisma.enriched_lead.aggregate({
      _avg: {
        crawl_duration_ms: true,
      },
    });

    return {
      totalEnriched: total,
      successRate: total > 0 ? (success / total) * 100 : 0,
      avgCrawlTimeMs: avgResult._avg.crawl_duration_ms || 0,
      botDetectionRate: total > 0 ? (botDetected / total) * 100 : 0,
      enrichmentsByStatus: {
        success,
        partial,
        failed,
      },
    };
  }

  /**
   * Add domain to blocklist
   * Note: This method is deprecated. Use BlocklistService instead.
   */
  async blockDomain(domain: string, reason?: string, organizationId?: string) {
    if (!organizationId) {
      this.logger.warn('blockDomain called without organizationId - skipping');
      return null;
    }
    
    return await this.prisma.blocklist.create({
      data: {
        organization_id: organizationId,
        domain,
        reason,
      },
    });
  }

  /**
   * Save enrichment to database
   */
  private async saveEnrichment(result: EnrichmentResultDto) {
    await this.prisma.enriched_lead.upsert({
      where: { lead_id: result.leadId },
      create: {
        lead_id: result.leadId,
        contact_page_urls: result.contactPageUrls,
        contact_form_url: result.contactFormUrl || null,
        emails_found: result.emailsFound as any,
        phones_found: result.phonesFound as any,
        social_links: result.socialLinks as any,
        address_found: result.addressFound as any,
        enrichment_status: result.enrichmentStatus,
        enrichment_log: result.enrichmentLog,
        pages_crawled: result.crawlMetadata.pagesCrawled,
        crawl_depth: result.crawlMetadata.crawlDepth,
        crawl_duration_ms: result.crawlMetadata.crawlDurationMs,
        bot_detected: result.crawlMetadata.botDetected,
        fallback_used: result.crawlMetadata.fallbackUsed,
      },
      update: {
        contact_page_urls: result.contactPageUrls,
        contact_form_url: result.contactFormUrl || null,
        emails_found: result.emailsFound as any,
        phones_found: result.phonesFound as any,
        social_links: result.socialLinks as any,
        address_found: result.addressFound as any,
        enrichment_status: result.enrichmentStatus,
        enrichment_log: result.enrichmentLog,
        pages_crawled: result.crawlMetadata.pagesCrawled,
        crawl_depth: result.crawlMetadata.crawlDepth,
        crawl_duration_ms: result.crawlMetadata.crawlDurationMs,
        bot_detected: result.crawlMetadata.botDetected,
        fallback_used: result.crawlMetadata.fallbackUsed,
      },
    });
  }

  /**
   * Determine enrichment status based on quality gate
   */
  private determineEnrichmentStatus(
    emails: EmailEvidence[],
    phones: PhoneEvidence[],
    contactPages: string[],
    website: string,
  ): 'success' | 'partial' | 'failed' {
    // Quality gate: must have at least one contact surface
    const hasContactSurface = emails.length > 0 || phones.length > 0 || contactPages.length > 0 || website;

    if (!hasContactSurface) {
      return 'failed';
    }

    // Success if we have email or phone
    if (emails.length > 0 || phones.length > 0) {
      return 'success';
    }

    // Partial if we only have contact pages or website
    return 'partial';
  }

  /**
   * Build failed result
   */
  private buildFailedResult(leadId: string, logs: string[], durationMs: number): EnrichmentResultDto {
    return {
      leadId,
      contactPageUrls: [],
      emailsFound: [],
      phonesFound: [],
      socialLinks: {},
      enrichmentStatus: 'failed',
      enrichmentLog: logs,
      crawlMetadata: {
        pagesCrawled: 0,
        crawlDepth: 0,
        crawlDurationMs: durationMs,
        botDetected: false,
        fallbackUsed: false,
        enrichedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Build partial result
   */
  private buildPartialResult(
    leadId: string,
    contactPages: string[],
    durationMs: number,
  ): EnrichmentResultDto {
    return {
      leadId,
      contactPageUrls: contactPages,
      emailsFound: [],
      phonesFound: [],
      socialLinks: {},
      enrichmentStatus: 'partial',
      enrichmentLog: ['No website URL available for crawling'],
      crawlMetadata: {
        pagesCrawled: 0,
        crawlDepth: 0,
        crawlDurationMs: durationMs,
        botDetected: false,
        fallbackUsed: false,
        enrichedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Map database model to DTO
   */
  private mapToDto(enriched: any): EnrichmentResultDto {
    return {
      leadId: enriched.lead_id,
      contactPageUrls: enriched.contact_page_urls,
      contactFormUrl: enriched.contact_form_url || undefined,
      emailsFound: enriched.emails_found as EmailEvidence[],
      phonesFound: enriched.phones_found as PhoneEvidence[],
      socialLinks: enriched.social_links as SocialLinks,
      addressFound: enriched.address_found as AddressEvidence | undefined,
      enrichmentStatus: enriched.enrichment_status,
      enrichmentLog: enriched.enrichment_log,
      crawlMetadata: {
        pagesCrawled: enriched.pages_crawled,
        crawlDepth: enriched.crawl_depth,
        crawlDurationMs: enriched.crawl_duration_ms,
        botDetected: enriched.bot_detected,
        fallbackUsed: enriched.fallback_used,
        enrichedAt: enriched.enriched_at.toISOString(),
      },
    };
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  /**
   * Phase 13: Run verification on an enriched lead
   * 
   * @param leadId - Lead ID
   * @param campaignId - Optional campaign ID for campaign-specific verification
   * @returns Verification result with scores and evidence
   */
  async verifyEnrichedLead(leadId: string, campaignId?: string) {
    this.logger.log(`Running verification for lead ${leadId}`);

    // Get enriched lead
    const enrichedLead = await this.prisma.enriched_lead.findUnique({
      where: { lead_id: leadId },
    });

    if (!enrichedLead) {
      throw new NotFoundException(`Enriched lead ${leadId} not found`);
    }

    // Build enrichment result DTO from database
    const enrichmentData = this.mapToDto(enrichedLead);

    // Run verification
    const verificationResult = await this.verification.verifyLead(
      leadId,
      enrichmentData,
      campaignId,
    );

    // Save verification results to database
    await this.prisma.enriched_lead.update({
      where: { lead_id: leadId },
      data: {
        feature_matches: verificationResult.feature_matches as any,
        verified_score: verificationResult.verified_score,
        preference_score: verificationResult.preference_score,
        final_score: verificationResult.final_score,
        scoring_breakdown: verificationResult.scoring_breakdown as any,
      },
    });

    this.logger.log(
      `Verification complete for lead ${leadId}: ` +
        `verified=${verificationResult.verified_score}, ` +
        `preference=${verificationResult.preference_score}, ` +
        `final=${verificationResult.final_score}`,
    );

    return verificationResult;
  }
}
