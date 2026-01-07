/**
 * Targeting profile generated from client brief
 * Represents structured targeting rules extracted from natural language
 */
export interface TargetingProfile {
  // Features that MUST be present (verified from crawl data)
  must_have_features: string[];
  
  // Features that are nice to have but not required
  nice_to_have_features: string[];
  
  // Features that should be excluded
  excluded_features: string[];
  
  // Keywords to use in discovery searches
  suggested_keywords: string[];
  
  // Negative keywords to filter out
  suggested_negative_keywords: string[];
  
  // Preferred contact methods
  preferred_contact_methods: ('phone' | 'email' | 'form')[];
  
  // Geographic targeting notes
  priority_geo_notes: string[];
  
  // Suggested scoring weight overrides
  suggested_scoring_overrides: {
    phone_weight?: number;
    email_weight?: number;
    form_weight?: number;
    intent_weight?: number;
    freshness_weight?: number;
  };
  
  // Metadata
  extraction_method: 'rule_based' | 'llm_assisted';
  confidence_score: number; // 0-1
  generated_at: string; // ISO timestamp
}

/**
 * Feature match result
 * Distinguishes between verified matches and preferences
 */
export interface FeatureMatch {
  feature: string;
  match_type: 'verified' | 'preference';
  evidence_source?: 'website_text' | 'json_ld' | 'google_places' | 'categories';
  evidence_snippet?: string;
  confidence: number; // 0-1
}
