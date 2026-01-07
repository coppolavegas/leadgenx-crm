import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
  IsEnum,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCampaignDto {
  @ApiProperty({
    description: 'Campaign name',
    example: 'NYC Recording Studios Q1 2025',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Client ID (nullable for internal campaigns)',
    example: 'client-uuid-here',
  })
  @IsString()
  @IsOptional()
  client_id?: string;

  @ApiProperty({
    description: 'Target vertical/industry',
    example: 'Recording Studio',
  })
  @IsString()
  @IsNotEmpty()
  vertical: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'USA',
  })
  @IsString()
  @IsOptional()
  geo_country?: string;

  @ApiPropertyOptional({
    description: 'State',
    example: 'NY',
  })
  @IsString()
  @IsOptional()
  geo_state?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'New York',
  })
  @IsString()
  @IsOptional()
  geo_city?: string;

  @ApiPropertyOptional({
    description: 'Search radius in miles',
    example: 25,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  geo_radius_miles?: number;

  @ApiPropertyOptional({
    description: 'Latitude',
    example: 40.7128,
  })
  @IsNumber()
  @IsOptional()
  geo_lat?: number;

  @ApiPropertyOptional({
    description: 'Longitude',
    example: -74.006,
  })
  @IsNumber()
  @IsOptional()
  geo_lng?: number;

  @ApiPropertyOptional({
    description: 'Enable Google Places as discovery source',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  sources_google_places?: boolean;

  @ApiPropertyOptional({
    description: 'Enable Reddit intent discovery',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  sources_reddit_intent?: boolean;

  @ApiPropertyOptional({
    description: 'Discovery configuration',
    example: {
      keywords: ['recording studio', 'music production'],
      negative_keywords: ['closed', 'permanently closed'],
      categories: ['music_studio'],
      min_rating: 4.0,
      min_reviews: 5,
    },
  })
  @IsObject()
  @IsOptional()
  discovery_config?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Intent detection configuration',
    example: {
      intent_phrases: ['looking for', 'need', 'want to record'],
      urgency_keywords: ['urgent', 'ASAP', 'this week'],
      timeframe_days: 90,
    },
  })
  @IsObject()
  @IsOptional()
  intent_config?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Enrichment configuration',
    example: {
      max_pages: 10,
      max_depth: 3,
      early_stop_rules: { min_contacts: 2 },
      respect_robots: true,
    },
  })
  @IsObject()
  @IsOptional()
  enrichment_config?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Scoring weights for campaign-specific lead scoring',
    example: {
      phone_weight: 20,
      email_weight: 25,
      form_weight: 15,
      intent_weight: 30,
      freshness_weight: 10,
    },
  })
  @IsObject()
  @IsOptional()
  scoring_weights?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Website URL for automated analysis (Phase 11.7)',
    example: 'https://example.com',
  })
  @IsString()
  @IsOptional()
  website_url?: string;

  @ApiPropertyOptional({
    description: 'Refresh schedule mode',
    example: 'manual',
    enum: ['manual', 'daily', 'weekly'],
    default: 'manual',
  })
  @IsEnum(['manual', 'daily', 'weekly'])
  @IsOptional()
  refresh_mode?: string;

  @ApiPropertyOptional({
    description: 'Day of week for weekly refresh (0=Sunday, 6=Saturday)',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(6)
  refresh_day_of_week?: number;
}
