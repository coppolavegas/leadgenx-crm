import { IsOptional, IsEnum, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CampaignLeadsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by stage',
    enum: ['new', 'reviewed', 'exported', 'contacted', 'won', 'lost', 'do_not_contact'],
  })
  @IsEnum(['new', 'reviewed', 'exported', 'contacted', 'won', 'lost', 'do_not_contact'])
  @IsOptional()
  stage?: string;

  @ApiPropertyOptional({
    description: 'Minimum campaign score (0-100)',
    example: 70,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  min_score?: number;

  @ApiPropertyOptional({
    description: 'Filter for lead-ready only (has contact info)',
    example: true,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  lead_ready?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by intent strength',
    enum: ['low', 'medium', 'high'],
  })
  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  intent_strength?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 50,
    default: 50,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(500)
  limit?: number = 50;
}
