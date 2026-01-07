import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createObjectCsvStringifier } from 'csv-writer';
import { ExportFilterDto } from './dto/export-filter.dto';
import { ExportLeadDto, ExportResponseDto, EvidenceDto } from './dto/export-response.dto';

interface Evidence {
  value: string;
  source_url: string;
  context?: string;
  confidence: number;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Export leads with enrichment data as structured JSON
   */
  async exportJson(filterDto: ExportFilterDto): Promise<ExportResponseDto> {
    this.logger.log('Exporting leads as JSON');
    const { leads, warnings } = await this.getFilteredLeadsWithEnrichment(filterDto);
    
    return {
      leads,
      total_count: leads.length,
      exported_at: new Date().toISOString(),
      warnings,
    };
  }

  /**
   * Export leads with enrichment data as CSV
   */
  async exportCsv(filterDto: ExportFilterDto): Promise<string> {
    this.logger.log('Exporting leads as CSV');
    const { leads } = await this.getFilteredLeadsWithEnrichment(filterDto);

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'Lead ID' },
        { id: 'name', title: 'Business Name' },
        { id: 'address', title: 'Address' },
        { id: 'phone', title: 'Phone (Primary)' },
        { id: 'website', title: 'Website' },
        { id: 'rating', title: 'Rating' },
        { id: 'review_count', title: 'Reviews' },
        { id: 'categories', title: 'Categories' },
        { id: 'score', title: 'Quality Score' },
        { id: 'status', title: 'Status' },
        { id: 'tags', title: 'Tags' },
        { id: 'source', title: 'Source' },
        { id: 'source_url', title: 'Source URL' },
        { id: 'website_url', title: 'Website URL' },
        { id: 'top_email', title: 'Top Email' },
        { id: 'top_email_source', title: 'Email Source' },
        { id: 'all_emails', title: 'All Emails' },
        { id: 'top_phone', title: 'Top Phone' },
        { id: 'top_phone_source', title: 'Phone Source' },
        { id: 'all_phones', title: 'All Phones' },
        { id: 'contact_form_url', title: 'Contact Form URL' },
        { id: 'contact_page_urls', title: 'Contact Pages' },
        { id: 'linkedin', title: 'LinkedIn' },
        { id: 'twitter', title: 'Twitter' },
        { id: 'facebook', title: 'Facebook' },
        { id: 'instagram', title: 'Instagram' },
        { id: 'enrichment_status', title: 'Enrichment Status' },
        { id: 'enriched_at', title: 'Enriched At' },
        { id: 'discovered_at', title: 'Discovered At' },
        { id: 'latitude', title: 'Latitude' },
        { id: 'longitude', title: 'Longitude' },
      ],
    });

    const records = leads.map(lead => this.flattenForCsv(lead));

    const header = csvStringifier.getHeaderString();
    const body = csvStringifier.stringifyRecords(records);

    return header + body;
  }

  /**
   * Fetch and format leads with enrichment data
   */
  private async getFilteredLeadsWithEnrichment(
    filterDto: ExportFilterDto,
  ): Promise<{ leads: ExportLeadDto[]; warnings: string[] }> {
    const where: any = { is_lead: true }; // Only export validated leads
    const warnings: string[] = [];

    // Score filter
    if (filterDto.min_score !== undefined || filterDto.max_score !== undefined) {
      where.score = {};
      if (filterDto.min_score !== undefined) {
        where.score.gte = filterDto.min_score;
      }
      if (filterDto.max_score !== undefined) {
        where.score.lte = filterDto.max_score;
      }
    }

    // Status filter
    if (filterDto.status) {
      where.status = filterDto.status;
    }

    // Tags filter
    if (filterDto.tags && filterDto.tags.length > 0) {
      where.tags = {
        hasSome: filterDto.tags,
      };
    }

    // Source filter
    if (filterDto.source) {
      where.source = filterDto.source;
    }

    // Search filter
    if (filterDto.search) {
      where.name = {
        contains: filterDto.search,
        mode: 'insensitive',
      };
    }

    // Discovery date range
    if (filterDto.discovered_after || filterDto.discovered_before) {
      where.discovered_at = {};
      if (filterDto.discovered_after) {
        where.discovered_at.gte = new Date(filterDto.discovered_after);
      }
      if (filterDto.discovered_before) {
        where.discovered_at.lte = new Date(filterDto.discovered_before);
      }
    }

    // Location radius filter
    if (filterDto.latitude && filterDto.longitude && filterDto.radius_km) {
      where.latitude = { not: null };
      where.longitude = { not: null };
      warnings.push('Location radius filtering applied in post-processing');
    }

    // Fetch leads with enrichment data
    const dbLeads = await this.prisma.lead.findMany({
      where,
      include: {
        enriched_lead: filterDto.enriched_only ? true : undefined,
      },
      orderBy: { score: 'desc' },
    });

    let leads = dbLeads;

    // Post-filter by location radius (Haversine formula)
    if (filterDto.latitude && filterDto.longitude && filterDto.radius_km) {
      leads = leads.filter(lead => {
        if (!lead.latitude || !lead.longitude) return false;
        const distance = this.calculateDistance(
          filterDto.latitude!,
          filterDto.longitude!,
          lead.latitude,
          lead.longitude,
        );
        return distance <= filterDto.radius_km!;
      });
    }

    // Filter enriched only
    if (filterDto.enriched_only) {
      leads = leads.filter(lead => lead.enriched_lead !== null);
    }

    // Deduplicate based on website or name+address
    const uniqueLeads = this.deduplicateLeads(leads);
    if (uniqueLeads.length < leads.length) {
      warnings.push(`Removed ${leads.length - uniqueLeads.length} duplicate leads`);
    }

    // Transform to export format
    const exportLeads = uniqueLeads.map(lead => this.transformToExportFormat(lead));

    return { leads: exportLeads, warnings };
  }

  /**
   * Deduplicate leads based on website or name+address
   */
  private deduplicateLeads(leads: any[]): any[] {
    const seen = new Set<string>();
    const unique: any[] = [];

    for (const lead of leads) {
      let key: string;
      
      if (lead.website) {
        // Primary: dedupe by website
        key = lead.website.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
      } else {
        // Fallback: dedupe by name + address
        key = `${lead.name.toLowerCase()}|${(lead.address || '').toLowerCase()}`;
      }

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(lead);
      }
    }

    return unique;
  }

  /**
   * Transform DB lead to export format with evidence
   */
  private transformToExportFormat(lead: any): ExportLeadDto {
    const enriched = lead.enriched_lead;

    // Extract top evidence
    const emailEvidence = enriched?.emails_found 
      ? this.extractTopEvidence(enriched.emails_found as any[], 3)
      : undefined;
    
    const phoneEvidence = enriched?.phones_found
      ? this.extractTopEvidence(enriched.phones_found as any[], 3)
      : undefined;

    return {
      id: lead.id,
      name: lead.name,
      address: lead.address,
      phone: lead.phone,
      website: lead.website,
      rating: lead.rating,
      review_count: lead.review_count,
      categories: lead.categories,
      latitude: lead.latitude,
      longitude: lead.longitude,
      score: lead.score,
      status: lead.status,
      tags: lead.tags,
      source: lead.source,
      source_url: lead.source_url,
      website_url: lead.website,
      email_evidence: emailEvidence,
      phone_evidence: phoneEvidence,
      contact_form_urls: enriched?.contact_form_url ? [enriched.contact_form_url] : undefined,
      contact_page_urls: enriched?.contact_page_urls,
      social_links: enriched?.social_links ? (enriched.social_links as any) : undefined,
      intent_evidence: lead.intent_evidence ? (lead.intent_evidence as any) : undefined,
      enrichment_status: enriched?.enrichment_status,
      enriched_at: enriched?.enriched_at?.toISOString(),
      discovered_at: lead.discovered_at.toISOString(),
      last_seen_at: lead.last_seen_at.toISOString(),
    };
  }

  /**
   * Extract top N evidence items sorted by confidence
   */
  private extractTopEvidence(evidence: Evidence[], limit: number): EvidenceDto[] {
    return evidence
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit)
      .map(e => ({
        value: e.value,
        source_url: e.source_url,
        context: e.context,
        confidence: e.confidence,
      }));
  }

  /**
   * Flatten lead data for CSV export
   */
  private flattenForCsv(lead: ExportLeadDto): Record<string, any> {
    const topEmail = lead.email_evidence?.[0];
    const topPhone = lead.phone_evidence?.[0];

    return {
      id: lead.id,
      name: lead.name,
      address: lead.address || '',
      phone: lead.phone || '',
      website: lead.website || '',
      rating: lead.rating || '',
      review_count: lead.review_count || '',
      categories: lead.categories.join('; '),
      score: lead.score,
      status: lead.status,
      tags: lead.tags.join(', '),
      source: lead.source,
      source_url: lead.source_url || '',
      website_url: lead.website_url || '',
      top_email: topEmail?.value || '',
      top_email_source: topEmail?.source_url || '',
      all_emails: lead.email_evidence?.map(e => e.value).join('; ') || '',
      top_phone: topPhone?.value || '',
      top_phone_source: topPhone?.source_url || '',
      all_phones: lead.phone_evidence?.map(e => e.value).join('; ') || '',
      contact_form_url: lead.contact_form_urls?.[0] || '',
      contact_page_urls: lead.contact_page_urls?.join('; ') || '',
      linkedin: lead.social_links?.linkedin || '',
      twitter: lead.social_links?.twitter || '',
      facebook: lead.social_links?.facebook || '',
      instagram: lead.social_links?.instagram || '',
      enrichment_status: lead.enrichment_status || '',
      enriched_at: lead.enriched_at || '',
      discovered_at: lead.discovered_at,
      latitude: lead.latitude || '',
      longitude: lead.longitude || '',
    };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
