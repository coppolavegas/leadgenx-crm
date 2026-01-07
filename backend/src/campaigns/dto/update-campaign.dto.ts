import { PartialType } from '@nestjs/swagger';
import { CreateCampaignDto } from './create-campaign.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {
  @ApiPropertyOptional({
    description: 'Campaign status',
    enum: ['draft', 'active', 'paused', 'archived'],
  })
  @IsEnum(['draft', 'active', 'paused', 'archived'])
  @IsOptional()
  status?: string;
}
