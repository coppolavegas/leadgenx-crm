import { IsOptional, IsString, IsIn } from 'class-validator';
import { TimeRangeDto } from './time-range.dto';

export class ExportQueryDto extends TimeRangeDto {
  @IsOptional()
  @IsIn(['overview', 'funnel', 'attribution', 'templates'])
  report_type?: 'overview' | 'funnel' | 'attribution' | 'templates' = 'overview';

  @IsOptional()
  @IsIn(['csv', 'json'])
  format?: 'csv' | 'json' = 'csv';
}
