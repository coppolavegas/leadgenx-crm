import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';

export class TimeRangeDto {
  @IsOptional()
  @IsIn(['7d', '30d', '90d', 'custom'])
  range?: '7d' | '30d' | '90d' | 'custom' = '30d';

  @IsOptional()
  @IsDateString()
  start_date?: string; // ISO date string for custom range

  @IsOptional()
  @IsDateString()
  end_date?: string; // ISO date string for custom range

  @IsOptional()
  @IsString()
  client_id?: string; // Filter by specific client

  @IsOptional()
  @IsString()
  campaign_id?: string; // Filter by specific campaign
}
