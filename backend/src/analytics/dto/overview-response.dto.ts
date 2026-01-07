export interface OverviewMetricsDto {
  // Lead Flow Metrics
  leads_discovered: number;
  leads_verified: number;
  leads_contacted: number;
  leads_replied: number;
  meetings_booked: number;
  leads_converted: number;

  // Conversion Rates
  verification_rate: number; // verified / discovered
  contact_rate: number; // contacted / verified
  reply_rate: number; // replied / contacted
  meeting_rate: number; // meetings / replied
  conversion_rate: number; // converted / meetings

  // Response Metrics
  avg_reply_time_hours: number;
  avg_meeting_time_hours: number;

  // Outreach Performance
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  bounce_rate: number;

  // Time period
  period_start: string; // ISO date
  period_end: string; // ISO date
  days_in_period: number;
}

export interface OverviewComparisonDto {
  current: OverviewMetricsDto;
  previous?: OverviewMetricsDto; // Previous period for comparison
  growth_rates?: { [key: string]: number }; // % change from previous period
}
