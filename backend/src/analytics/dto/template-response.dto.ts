export interface TemplatePerformanceDto {
  template_id?: string;
  template_name: string;
  template_type: string;
  sends_count: number;
  opens_count: number;
  clicks_count: number;
  replies_count: number;
  bounces_count: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
  bounce_rate: number;
}

export interface TemplateResponseDto {
  templates: TemplatePerformanceDto[];
  period_start: string;
  period_end: string;
}
