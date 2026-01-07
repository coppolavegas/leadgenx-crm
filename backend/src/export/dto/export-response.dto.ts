import { ApiProperty } from '@nestjs/swagger';

export class EvidenceDto {
  @ApiProperty({ description: 'The extracted value (email, phone, etc.)' })
  value: string;

  @ApiProperty({ description: 'URL where evidence was found' })
  source_url: string;

  @ApiProperty({ description: 'Context text surrounding the evidence' })
  context?: string;

  @ApiProperty({ description: 'Confidence score (0-1)' })
  confidence: number;
}

export class ExportLeadDto {
  // Core fields
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  address?: string;

  @ApiProperty({ nullable: true })
  phone?: string;

  @ApiProperty({ nullable: true })
  website?: string;

  @ApiProperty({ nullable: true })
  rating?: number;

  @ApiProperty({ nullable: true })
  review_count?: number;

  @ApiProperty({ type: [String] })
  categories: string[];

  @ApiProperty({ nullable: true })
  latitude?: number;

  @ApiProperty({ nullable: true })
  longitude?: number;

  // Quality metrics
  @ApiProperty({ description: 'Lead quality score (0-100)' })
  score: number;

  @ApiProperty({ description: 'Lead status' })
  status: string;

  @ApiProperty({ type: [String] })
  tags: string[];

  // Source information
  @ApiProperty()
  source: string;

  @ApiProperty({ nullable: true })
  source_url?: string;

  @ApiProperty({ nullable: true })
  website_url?: string;

  // Evidence with top entries
  @ApiProperty({ type: [EvidenceDto], nullable: true })
  email_evidence?: EvidenceDto[];

  @ApiProperty({ type: [EvidenceDto], nullable: true })
  phone_evidence?: EvidenceDto[];

  @ApiProperty({ type: [String], nullable: true })
  contact_form_urls?: string[];

  @ApiProperty({ type: [String], nullable: true })
  contact_page_urls?: string[];

  @ApiProperty({ nullable: true })
  social_links?: Record<string, string>;

  @ApiProperty({ nullable: true })
  intent_evidence?: Record<string, any>;

  // Enrichment metadata
  @ApiProperty({ nullable: true })
  enrichment_status?: string;

  @ApiProperty({ nullable: true })
  enriched_at?: string;

  // Timestamps
  @ApiProperty()
  discovered_at: string;

  @ApiProperty()
  last_seen_at: string;
}

export class ExportResponseDto {
  @ApiProperty({ type: [ExportLeadDto] })
  leads: ExportLeadDto[];

  @ApiProperty()
  total_count: number;

  @ApiProperty()
  exported_at: string;

  @ApiProperty({ type: [String] })
  warnings: string[];
}
