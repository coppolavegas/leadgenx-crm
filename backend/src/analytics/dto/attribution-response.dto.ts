export interface SourceAttributionDto {
  source: string; // "google_maps", "yelp", etc.
  leads_discovered: number;
  leads_contacted: number;
  replies_received: number;
  meetings_booked: number;
  conversions: number;
  reply_rate: number;
  meeting_rate: number;
  conversion_rate: number;
  avg_reply_time_hours: number;
}

export interface CampaignAttributionDto {
  campaign_id: string;
  campaign_name: string;
  leads_discovered: number;
  leads_contacted: number;
  replies_received: number;
  meetings_booked: number;
  conversions: number;
  reply_rate: number;
  meeting_rate: number;
  conversion_rate: number;
  total_cost?: number; // If tracking campaign costs
  cost_per_lead?: number;
  cost_per_meeting?: number;
}

export interface AttributionResponseDto {
  sources: SourceAttributionDto[];
  campaigns: CampaignAttributionDto[];
  period_start: string;
  period_end: string;
}
