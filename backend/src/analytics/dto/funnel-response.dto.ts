export interface FunnelStageDto {
  stage_name: string;
  stage_order: number;
  count: number;
  percentage: number; // % of total that entered funnel
  drop_off_rate?: number; // % that didn't progress to next stage
  avg_time_in_stage_hours?: number;
}

export interface FunnelResponseDto {
  stages: FunnelStageDto[];
  total_entered: number;
  total_converted: number;
  overall_conversion_rate: number;
  period_start: string;
  period_end: string;
}
