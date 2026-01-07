/**
 * Phase 13: Verified Match Scoring Interfaces
 */

export type MatchType = 'verified' | 'preference';

export interface FeatureEvidence {
  page_url: string;
  snippet: string; // 200-char max text snippet showing the feature
}

export interface FeatureMatch {
  feature: string;
  match_type: MatchType;
  evidence: FeatureEvidence | null;
  confidence: number; // 0.0-1.0
}

export interface ScoringBreakdown {
  verified: number;     // Score from verified features
  preference: number;   // Score from preference features
  intent: number;       // Intent signal bonus
  freshness: number;    // Freshness bonus
  total: number;        // Final weighted score
}

export interface VerificationResult {
  feature_matches: FeatureMatch[];
  verified_score: number;
  preference_score: number;
  final_score: number;
  scoring_breakdown: ScoringBreakdown;
  exclusions_triggered: string[];
}

export interface LeadExplanation {
  lead_id: string;
  lead_name: string;
  verified_features: Array<{
    feature: string;
    evidence_snippet: string;
    page_url: string;
  }>;
  preference_features: string[];
  exclusions_triggered: string[];
  scoring_breakdown: ScoringBreakdown;
}

export interface CampaignVerificationSummary {
  campaign_id: string;
  campaign_name: string;
  total_leads: number;
  verified_leads: number; // Leads with at least 1 verified feature
  avg_verified_score: number;
  avg_preference_score: number;
  avg_final_score: number;
  top_verified_features: Array<{
    feature: string;
    count: number;
  }>;
  exclusion_stats: Array<{
    feature: string;
    count: number;
  }>;
}
