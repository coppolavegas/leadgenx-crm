import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  FeatureMatch,
  FeatureEvidence,
  VerificationResult,
  LeadExplanation,
  CampaignVerificationSummary,
  ScoringBreakdown,
} from '../interfaces/verification.interface';
import {
  EmailEvidence,
  PhoneEvidence,
  EnrichmentResultDto,
} from '../dto/enrichment-result.dto';

/**
 * Phase 13: Verification Service
 * 
 * Core principle: No feature may be marked "verified" unless supported by crawl evidence.
 * All claims must link to evidence. No hallucinations.
 */
@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify features against enrichment data
   * 
   * @param leadId - Lead ID
   * @param enrichmentData - Enrichment result with crawled content
   * @param campaignId - Optional campaign ID for campaign-specific verification
   * @returns VerificationResult with feature matches and scores
   */
  async verifyLead(
    leadId: string,
    enrichmentData: EnrichmentResultDto,
    campaignId?: string,
  ): Promise<VerificationResult> {
    const startTime = Date.now();

    // Get lead data
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }

    // Get campaign context if provided
    let campaignContext: any = null;
    if (campaignId) {
      const campaignLead = await this.prisma.campaign_lead.findFirst({
        where: {
          lead_id: leadId,
          campaign_id: campaignId,
        },
        include: { campaign: true },
      });

      if (campaignLead) {
        campaignContext = campaignLead.campaign;
      }
    }

    // Extract all features to verify
    const featuresToVerify = this.extractFeaturesToVerify(campaignContext);

    // Build searchable content from enrichment data
    const searchableContent = this.buildSearchableContent(enrichmentData);

    // Verify each feature
    const featureMatches: FeatureMatch[] = [];
    const exclusionsTriggered: string[] = [];

    for (const feature of featuresToVerify.must_have) {
      const match = this.findFeatureMatch(feature, searchableContent);
      if (match) {
        featureMatches.push(match);
      }
    }

    for (const feature of featuresToVerify.preferences) {
      const match = this.findFeatureMatch(feature, searchableContent, true);
      if (match) {
        featureMatches.push(match);
      }
    }

    // Check for exclusions
    for (const exclusion of featuresToVerify.exclusions) {
      const match = this.findFeatureMatch(exclusion, searchableContent);
      if (match && match.match_type === 'verified') {
        exclusionsTriggered.push(exclusion);
      }
    }

    // Calculate scores
    const verifiedMatches = featureMatches.filter(
      (m) => m.match_type === 'verified',
    );
    const preferenceMatches = featureMatches.filter(
      (m) => m.match_type === 'preference',
    );

    const verified_score = this.calculateVerifiedScore(verifiedMatches);
    const preference_score = this.calculatePreferenceScore(preferenceMatches);

    // Calculate intent and freshness bonuses
    const intent_bonus = this.calculateIntentBonus(enrichmentData);
    const freshness_bonus = this.calculateFreshnessBonus(lead);

    // Final weighted score
    const final_score =
      verified_score * 0.7 +
      preference_score * 0.3 +
      intent_bonus +
      freshness_bonus;

    const scoring_breakdown: ScoringBreakdown = {
      verified: verified_score,
      preference: preference_score,
      intent: intent_bonus,
      freshness: freshness_bonus,
      total: Math.min(100, final_score),
    };

    const duration = Date.now() - startTime;
    this.logger.log(
      `Verification completed for lead ${leadId} in ${duration}ms: ` +
        `${verifiedMatches.length} verified, ${preferenceMatches.length} preference, ` +
        `${exclusionsTriggered.length} exclusions`,
    );

    return {
      feature_matches: featureMatches,
      verified_score,
      preference_score,
      final_score: Math.min(100, final_score),
      scoring_breakdown,
      exclusions_triggered: exclusionsTriggered,
    };
  }

  /**
   * Extract features to verify from campaign context
   */
  private extractFeaturesToVerify(campaignContext: any): {
    must_have: string[];
    preferences: string[];
    exclusions: string[];
  } {
    const must_have: string[] = [];
    const preferences: string[] = [];
    const exclusions: string[] = [];

    if (!campaignContext) {
      return { must_have, preferences, exclusions };
    }

    // From client brief
    if (campaignContext.client_brief) {
      const brief = campaignContext.client_brief;
      if (brief.must_have_features) {
        must_have.push(...brief.must_have_features);
      }
      if (brief.nice_to_have_features) {
        preferences.push(...brief.nice_to_have_features);
      }
    }

    // From targeting profile
    if (campaignContext.targeting_profile) {
      const profile = campaignContext.targeting_profile;
      if (profile.industries) {
        preferences.push(...profile.industries);
      }
      if (profile.services) {
        preferences.push(...profile.services);
      }
    }

    // From website intelligence
    if (campaignContext.website_analysis) {
      const analysis = campaignContext.website_analysis;
      if (analysis.core_services) {
        preferences.push(...analysis.core_services);
      }
      if (analysis.industries) {
        preferences.push(...analysis.industries);
      }
    }

    // From search keywords (preferences)
    if (
      campaignContext.search_keywords &&
      campaignContext.search_keywords.length > 0
    ) {
      preferences.push(...campaignContext.search_keywords);
    }

    // From negative keywords (exclusions)
    if (
      campaignContext.negative_keywords &&
      campaignContext.negative_keywords.length > 0
    ) {
      exclusions.push(...campaignContext.negative_keywords);
    }

    // Deduplicate
    return {
      must_have: [...new Set(must_have)],
      preferences: [...new Set(preferences)],
      exclusions: [...new Set(exclusions)],
    };
  }

  /**
   * Build searchable content from enrichment data
   */
  private buildSearchableContent(
    enrichmentData: EnrichmentResultDto,
  ): Array<{ page_url: string; content: string }> {
    const pages: Array<{ page_url: string; content: string }> = [];

    // Add email evidence pages
    if (enrichmentData.emailsFound) {
      for (const email of enrichmentData.emailsFound as any[]) {
        if (email.pageUrl && email.evidenceSnippet) {
          pages.push({
            page_url: email.pageUrl,
            content: email.evidenceSnippet,
          });
        }
      }
    }

    // Add phone evidence pages
    if (enrichmentData.phonesFound) {
      for (const phone of enrichmentData.phonesFound as any[]) {
        if (phone.pageUrl && phone.evidenceSnippet) {
          pages.push({
            page_url: phone.pageUrl,
            content: phone.evidenceSnippet,
          });
        }
      }
    }

    // Add contact form pages
    if (enrichmentData.contactFormUrl) {
      pages.push({
        page_url: enrichmentData.contactFormUrl,
        content: 'contact form available',
      });
    }

    // Deduplicate by URL
    const uniquePages = new Map<string, string>();
    for (const page of pages) {
      if (!uniquePages.has(page.page_url)) {
        uniquePages.set(page.page_url, page.content);
      } else {
        // Merge content
        uniquePages.set(
          page.page_url,
          uniquePages.get(page.page_url) + ' ' + page.content,
        );
      }
    }

    return Array.from(uniquePages.entries()).map(([page_url, content]) => ({
      page_url,
      content,
    }));
  }

  /**
   * Find feature match in searchable content
   */
  private findFeatureMatch(
    feature: string,
    searchableContent: Array<{ page_url: string; content: string }>,
    preferenceOnly = false,
  ): FeatureMatch | null {
    const featureLower = feature.toLowerCase();
    const featureWords = featureLower
      .split(/\s+/)
      .filter((w) => w.length > 2);

    // Try to find exact or partial matches
    for (const page of searchableContent) {
      const contentLower = page.content.toLowerCase();

      // Exact phrase match (verified)
      if (contentLower.includes(featureLower)) {
        const snippetStart = Math.max(
          0,
          contentLower.indexOf(featureLower) - 50,
        );
        const snippetEnd = Math.min(
          page.content.length,
          contentLower.indexOf(featureLower) + featureLower.length + 50,
        );
        const snippet = page.content.substring(snippetStart, snippetEnd).trim();

        return {
          feature,
          match_type: preferenceOnly ? 'preference' : 'verified',
          evidence: {
            page_url: page.page_url,
            snippet: this.truncateSnippet(snippet, 200),
          },
          confidence: 1.0,
        };
      }

      // Partial match: at least 70% of words found (verified)
      if (featureWords.length >= 2) {
        const matchedWords = featureWords.filter((word) =>
          contentLower.includes(word),
        );
        const matchRatio = matchedWords.length / featureWords.length;

        if (matchRatio >= 0.7) {
          // Find a snippet containing the most words
          let bestSnippet = '';
          let bestScore = 0;

          for (let i = 0; i < page.content.length - 100; i += 50) {
            const chunk = page.content.substring(i, i + 200).toLowerCase();
            const chunkScore = matchedWords.filter((w) =>
              chunk.includes(w),
            ).length;
            if (chunkScore > bestScore) {
              bestScore = chunkScore;
              bestSnippet = page.content.substring(i, i + 200).trim();
            }
          }

          return {
            feature,
            match_type: preferenceOnly ? 'preference' : 'verified',
            evidence: {
              page_url: page.page_url,
              snippet: this.truncateSnippet(bestSnippet, 200),
            },
            confidence: matchRatio,
          };
        }
      }
    }

    // No match found in crawl data - preference only
    if (preferenceOnly) {
      return {
        feature,
        match_type: 'preference',
        evidence: null,
        confidence: 0.0,
      };
    }

    return null;
  }

  /**
   * Calculate verified score based on verified matches
   */
  private calculateVerifiedScore(verifiedMatches: FeatureMatch[]): number {
    if (verifiedMatches.length === 0) {
      return 0;
    }

    // Base score: 20 points per verified feature (capped at 80)
    const baseScore = Math.min(80, verifiedMatches.length * 20);

    // Confidence bonus: average confidence * 20
    const avgConfidence =
      verifiedMatches.reduce((sum, m) => sum + m.confidence, 0) /
      verifiedMatches.length;
    const confidenceBonus = avgConfidence * 20;

    return Math.min(100, baseScore + confidenceBonus);
  }

  /**
   * Calculate preference score based on preference matches
   */
  private calculatePreferenceScore(preferenceMatches: FeatureMatch[]): number {
    if (preferenceMatches.length === 0) {
      return 0;
    }

    // Preference features are worth less than verified
    // 10 points per feature (capped at 60)
    const baseScore = Math.min(60, preferenceMatches.length * 10);

    // Confidence bonus (if any have evidence)
    const withEvidence = preferenceMatches.filter((m) => m.evidence !== null);
    const evidenceBonus =
      withEvidence.length > 0 ? (withEvidence.length / preferenceMatches.length) * 20 : 0;

    return Math.min(100, baseScore + evidenceBonus);
  }

  /**
   * Calculate intent bonus from enrichment data
   */
  private calculateIntentBonus(enrichmentData: EnrichmentResultDto): number {
    let bonus = 0;

    // Email found: +5 points
    if (
      enrichmentData.emailsFound &&
      (enrichmentData.emailsFound as any[]).length > 0
    ) {
      bonus += 5;
    }

    // Phone found: +3 points
    if (
      enrichmentData.phonesFound &&
      (enrichmentData.phonesFound as any[]).length > 0
    ) {
      bonus += 3;
    }

    // Contact form: +2 points
    if (enrichmentData.contactFormUrl) {
      bonus += 2;
    }

    return bonus;
  }

  /**
   * Calculate freshness bonus based on when lead was discovered
   */
  private calculateFreshnessBonus(lead: any): number {
    const now = new Date();
    const discoveredAt = new Date(lead.discovered_at);
    const ageInDays = (now.getTime() - discoveredAt.getTime()) / (1000 * 60 * 60 * 24);

    // Freshness bonus: 5 points if < 7 days, 3 points if < 30 days, 0 otherwise
    if (ageInDays < 7) {
      return 5;
    } else if (ageInDays < 30) {
      return 3;
    }
    return 0;
  }

  /**
   * Truncate snippet to max length
   */
  private truncateSnippet(snippet: string, maxLength: number): string {
    if (snippet.length <= maxLength) {
      return snippet;
    }
    return snippet.substring(0, maxLength - 3) + '...';
  }

  /**
   * Get lead explanation for UI
   */
  async getLeadExplanation(leadId: string): Promise<LeadExplanation> {
    const enrichedLead = await this.prisma.enriched_lead.findUnique({
      where: { lead_id: leadId },
      include: { lead: true },
    });

    if (!enrichedLead) {
      throw new Error(`Enriched lead ${leadId} not found`);
    }

    const featureMatches = enrichedLead.feature_matches as any[];
    const verifiedFeatures = featureMatches
      .filter((m) => m.match_type === 'verified' && m.evidence)
      .map((m) => ({
        feature: m.feature,
        evidence_snippet: m.evidence.snippet,
        page_url: m.evidence.page_url,
      }));

    const preferenceFeatures = featureMatches
      .filter((m) => m.match_type === 'preference')
      .map((m) => m.feature);

    return {
      lead_id: leadId,
      lead_name: enrichedLead.lead.name,
      verified_features: verifiedFeatures,
      preference_features: preferenceFeatures,
      exclusions_triggered: [], // TODO: Store this in DB
      scoring_breakdown: enrichedLead.scoring_breakdown as any as ScoringBreakdown,
    };
  }

  /**
   * Get campaign verification summary
   */
  async getCampaignVerificationSummary(
    campaignId: string,
  ): Promise<CampaignVerificationSummary> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        campaign_leads: {
          include: {
            lead: {
              include: { enriched_lead: true },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    const enrichedLeads = campaign.campaign_leads
      .map((cl) => cl.lead.enriched_lead)
      .filter((el) => el !== null);

    const totalLeads = enrichedLeads.length;
    const verifiedLeads = enrichedLeads.filter(
      (el) => (el.feature_matches as any[]).some((m) => m.match_type === 'verified'),
    ).length;

    const avgVerifiedScore =
      totalLeads > 0
        ? enrichedLeads.reduce((sum, el) => sum + el.verified_score, 0) / totalLeads
        : 0;

    const avgPreferenceScore =
      totalLeads > 0
        ? enrichedLeads.reduce((sum, el) => sum + el.preference_score, 0) / totalLeads
        : 0;

    const avgFinalScore =
      totalLeads > 0
        ? enrichedLeads.reduce((sum, el) => sum + el.final_score, 0) / totalLeads
        : 0;

    // Count top verified features
    const featureCounts = new Map<string, number>();
    for (const el of enrichedLeads) {
      const matches = el.feature_matches as any[];
      for (const match of matches) {
        if (match.match_type === 'verified') {
          featureCounts.set(
            match.feature,
            (featureCounts.get(match.feature) || 0) + 1,
          );
        }
      }
    }

    const topVerifiedFeatures = Array.from(featureCounts.entries())
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      campaign_id: campaignId,
      campaign_name: campaign.name,
      total_leads: totalLeads,
      verified_leads: verifiedLeads,
      avg_verified_score: Math.round(avgVerifiedScore * 10) / 10,
      avg_preference_score: Math.round(avgPreferenceScore * 10) / 10,
      avg_final_score: Math.round(avgFinalScore * 10) / 10,
      top_verified_features: topVerifiedFeatures,
      exclusion_stats: [], // TODO: Track exclusions
    };
  }
}
