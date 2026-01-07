import { IsOptional, IsInt, IsString, IsEnum, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  CONVERTED = 'converted',
  DISQUALIFIED = 'disqualified',
}

export class ExportFilterDto {
  @ApiPropertyOptional({ description: 'Minimum lead quality score (0-100)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  min_score?: number;

  @ApiPropertyOptional({ description: 'Maximum lead quality score (0-100)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  max_score?: number;

  @ApiPropertyOptional({ enum: LeadStatus, description: 'Filter by lead status' })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ type: [String], description: 'Filter by tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Filter by source (google, yelp)' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Center latitude for location radius filter' })
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Center longitude for location radius filter' })
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Radius in kilometers for location filter' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  radius_km?: number;

  @ApiPropertyOptional({ description: 'Search query for business name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Only include enriched leads' })
  @IsOptional()
  @Type(() => Boolean)
  enriched_only?: boolean;

  @ApiPropertyOptional({ description: 'Start date for discovery filter (ISO 8601)' })
  @IsOptional()
  @IsString()
  discovered_after?: string;

  @ApiPropertyOptional({ description: 'End date for discovery filter (ISO 8601)' })
  @IsOptional()
  @IsString()
  discovered_before?: string;
}
