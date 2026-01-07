// Type definitions for LeadGenX

// Auth Types
export interface User {
  id: string;
  organization_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  company_name?: string;
  title?: string;
  industry?: string;
  website?: string;
  phone?: string;
  role: 'owner' | 'admin' | 'member';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  token: string;
  user: User;
  expires_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  company_name: string;
  title?: string;
  phone?: string;
  industry?: string;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
}

// Campaign Brief Types
export interface TargetingProfile {
  must_have_features: string[];
  nice_to_have_features: string[];
  excluded_features: string[];
  suggested_keywords: string[];
  suggested_negative_keywords: string[];
  preferred_contact_methods: string[];
  priority_geo_notes: string[];
  suggested_scoring_overrides: Record<string, number>;
  extraction_method: string;
  confidence_score: number;
  generated_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  industry?: string;
  website?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  _count?: {
    campaigns: number;
  };
}

export interface Campaign {
  id: string;
  organization_id: string;
  client_id?: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  vertical: string;
  geo_country?: string;
  geo_state?: string;
  geo_city?: string;
  geo_radius_miles?: number;
  geo_lat?: number;
  geo_lng?: number;
  sources_google_places: boolean;
  sources_reddit_intent: boolean;
  discovery_config: {
    keywords?: string[];
    negative_keywords?: string[];
    categories?: string[];
    min_rating?: number;
    min_reviews?: number;
  };
  intent_config: {
    intent_phrases?: string[];
    urgency_keywords?: string[];
    timeframe_days?: number;
  };
  enrichment_config: {
    max_pages?: number;
    max_depth?: number;
    early_stop_rules?: any;
    respect_robots?: boolean;
  };
  scoring_weights: {
    phone_weight: number;
    email_weight: number;
    form_weight: number;
    rating_weight: number;
    review_weight: number;
    freshness_weight: number;
  };
  refresh_mode: 'manual' | 'daily' | 'weekly';
  refresh_day_of_week?: number;
  client_brief?: string;
  targeting_profile?: TargetingProfile;
  targeting_profile_updated_at?: string;
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  client?: Client;
  _count?: {
    campaign_runs: number;
    campaign_leads: number;
  };
}

export interface CampaignRun {
  id: string;
  campaign_id: string;
  run_type: 'manual' | 'scheduled';
  status: 'running' | 'success' | 'partial' | 'failed';
  started_at: string;
  finished_at?: string;
  stats: {
    intent_signals_found: number;
    leads_discovered: number;
    leads_upserted: number;
    leads_enriched: number;
    lead_ready_count: number;
    bot_block_rate: number;
    avg_enrich_ms: number;
  };
  logs: string[];
  error?: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  rating?: number;
  review_count?: number;
  categories: string[];
  google_place_id?: string;
  lat?: number;
  lng?: number;
  discovered_via: string;
  discovered_at: string;
  enriched_lead?: EnrichedLead;
}

export interface EnrichedLead {
  id: string;
  lead_id: string;
  emails_found: EmailFound[];
  phones_found: PhoneFound[];
  social_links: SocialLink[];
  contact_form_url?: string;
  about_text?: string;
  pages_crawled: number;
  enrichment_status: 'pending' | 'success' | 'partial' | 'failed';
  bot_blocked: boolean;
  enriched_at: string;
  // Phase 13: Verification fields
  feature_matches?: FeatureMatch[];
  verified_score?: number;
  preference_score?: number;
  final_score?: number;
  scoring_breakdown?: ScoringBreakdown;
}

// Phase 13: Verification Types
export interface FeatureMatch {
  feature: string;
  match_type: 'verified' | 'preference';
  evidence: FeatureEvidence | null;
  confidence: number;
}

export interface FeatureEvidence {
  page_url: string;
  snippet: string;
}

export interface ScoringBreakdown {
  verified: number;
  preference: number;
  intent: number;
  freshness: number;
  total: number;
}

export interface LeadExplanation {
  lead_id: string;
  lead_name: string;
  verified_features: {
    feature: string;
    evidence_snippet: string;
    page_url: string;
  }[];
  preference_features: string[];
  exclusions_triggered: string[];
  scoring_breakdown: ScoringBreakdown;
}

export interface CampaignVerificationSummary {
  campaign_id: string;
  campaign_name: string;
  total_leads: number;
  verified_leads: number;
  avg_verified_score: number;
  avg_preference_score: number;
  avg_final_score: number;
  top_verified_features: {
    feature: string;
    count: number;
  }[];
  exclusion_stats: {
    feature: string;
    count: number;
  }[];
}

export interface EmailFound {
  email: string;
  confidence: 'high' | 'medium' | 'low';
  source_url: string;
  context?: string;
}

export interface PhoneFound {
  phone: string;
  type?: string;
  source_url: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface CampaignLead {
  id: string;
  campaign_id: string;
  lead_id: string;
  campaign_score: number;
  stage: string;
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  lead: Lead;
}

// Phase 12: Campaign Templates
export interface CampaignTemplate {
  id: string;
  name: string;
  vertical: string;
  description: string;
  default_categories: string[];
  default_keywords: string[];
  default_negative_keywords: string[];
  default_min_rating: number;
  default_min_reviews: number;
  default_scoring_weights: {
    phone_weight: number;
    email_weight: number;
    form_weight: number;
    intent_weight: number;
    freshness_weight: number;
  };
  example_brief: string;
}

// ============ CRM TYPES ============

export interface CRMPipeline {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  stages?: CRMStage[];
}

export interface CRMStage {
  id: string;
  pipeline_id: string;
  name: string;
  position: number;
  color?: string;
  created_at: string;
  updated_at: string;
  leads?: any[];
  leads_count?: number;
}

export interface KanbanBoard {
  pipeline: CRMPipeline;
  stages: Array<CRMStage & { leads: any[]; leads_count: number }>;
}

export interface CRMActivity {
  id: string;
  client_id: string;
  lead_id?: string;
  user_id: string;
  type: 'note' | 'call' | 'email' | 'meeting' | 'task_completed' | 'stage_changed' | 'owner_changed';
  title: string;
  content?: string;
  meta?: Record<string, any>;
  created_at: string;
  lead?: any;
  user?: any;
}

export interface CRMTask {
  id: string;
  client_id: string;
  lead_id?: string;
  assigned_to_user_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'cancelled';
  completed_at?: string;
  created_at: string;
  updated_at: string;
  lead?: any;
  assigned_to?: any;
}

export interface CRMMember {
  id: string;
  client_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  created_at: string;
  user?: any;
}

// ==========================================
// PHASE 15: INBOX & WORKFLOW TYPES
// ==========================================

export interface InboxItem {
  id: string;
  client_id: string;
  lead_id: string | null;
  task_id: string | null;
  type: 'reply' | 'task_due' | 'task_overdue' | 'lead_update' | 'sla_warning';
  title: string;
  body: string | null;
  metadata: any;
  is_read: boolean;
  is_starred: boolean;
  created_at: string;
  read_at: string | null;
  lead?: {
    id: string;
    name: string;
    company?: string;
  };
  task?: Task;
}

export interface Task {
  id: string;
  client_id: string;
  lead_id: string | null;
  assigned_to_user_id: string | null;
  title: string;
  description: string | null;
  type: 'follow_up' | 'call' | 'email' | 'meeting' | 'research' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'snoozed' | 'cancelled';
  due_date: string | null;
  completed_at: string | null;
  snoozed_until: string | null;
  outcome: string | null;
  notes: string | null;
  auto_created: boolean;
  auto_rule_config: any;
  created_at: string;
  updated_at: string;
  lead?: {
    id: string;
    name: string;
    company?: string;
  };
  assigned_to?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface SLAMetrics {
  total_leads: number;
  leads_with_sla: number;
  overdue_count: number;
  overdue_percentage: number;
  avg_response_time_hours: number | null;
  median_response_time_hours: number | null;
}
