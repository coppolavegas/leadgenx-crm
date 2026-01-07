import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RunCampaignDto {
  @ApiPropertyOptional({
    description: 'Run type',
    enum: ['manual', 'scheduled'],
    default: 'manual',
  })
  @IsEnum(['manual', 'scheduled'])
  @IsOptional()
  run_type?: string;
}
