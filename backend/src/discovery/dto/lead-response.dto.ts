import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeadResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Business name' })
  name: string;

  @ApiPropertyOptional({ description: 'Business address' })
  address?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  website?: string;

  @ApiPropertyOptional({ description: 'Contact page URL' })
  contact_page_url?: string;

  @ApiPropertyOptional({ description: 'Business rating' })
  rating?: number;

  @ApiPropertyOptional({ description: 'Number of reviews' })
  review_count?: number;

  @ApiProperty({ description: 'Data source', enum: ['google', 'yelp'] })
  source: string;

  @ApiPropertyOptional({ description: 'Source URL' })
  source_url?: string;

  @ApiPropertyOptional({ description: 'Google Place ID' })
  place_id?: string;

  @ApiPropertyOptional({ description: 'Yelp Business ID' })
  yelp_id?: string;

  @ApiPropertyOptional({ description: 'Business categories', type: [String] })
  categories?: string[];

  @ApiPropertyOptional({ description: 'Latitude' })
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  longitude?: number;

  @ApiProperty({ description: 'Whether this is a valid lead with contact info' })
  is_lead: boolean;

  @ApiProperty({ description: 'When this business was first discovered' })
  discovered_at: Date;

  @ApiProperty({ description: 'When this business was last seen' })
  last_seen_at: Date;
}

export class DiscoveryResultDto {
  @ApiProperty({ description: 'Newly discovered leads', type: [LeadResponseDto] })
  new_leads: LeadResponseDto[];

  @ApiProperty({ description: 'Previously discovered leads that were found again', type: [LeadResponseDto] })
  existing_leads: LeadResponseDto[];

  @ApiProperty({ description: 'Total number of new leads discovered' })
  new_count: number;

  @ApiProperty({ description: 'Total number of existing leads updated' })
  existing_count: number;

  @ApiProperty({ description: 'Total leads processed' })
  total_processed: number;
}
