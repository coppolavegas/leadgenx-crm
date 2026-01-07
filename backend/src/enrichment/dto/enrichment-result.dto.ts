import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface EmailEvidence {
  email: string;
  pageUrl: string;
  evidenceSnippet: string;
  confidence: 'high' | 'medium' | 'low';
  extractionMethod: 'mailto' | 'regex' | 'jsonld';
}

export interface PhoneEvidence {
  phone: string;
  formattedPhone: string;
  pageUrl: string;
  evidenceSnippet: string;
  confidence: 'high' | 'medium' | 'low';
  extractionMethod: 'tel' | 'regex' | 'jsonld';
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
}

export interface AddressEvidence {
  fullAddress: string;
  pageUrl: string;
  evidenceSnippet: string;
  parsed: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

export interface CrawlMetadata {
  pagesCrawled: number;
  crawlDepth: number;
  crawlDurationMs: number;
  botDetected: boolean;
  fallbackUsed: boolean;
  enrichedAt: string;
}

export class EnrichmentResultDto {
  @ApiProperty()
  leadId: string;

  @ApiProperty({ type: [String] })
  contactPageUrls: string[];

  @ApiPropertyOptional()
  contactFormUrl?: string;

  @ApiProperty({ type: 'array' })
  emailsFound: EmailEvidence[];

  @ApiProperty({ type: 'array' })
  phonesFound: PhoneEvidence[];

  @ApiProperty({ type: Object })
  socialLinks: SocialLinks;

  @ApiPropertyOptional({ type: Object })
  addressFound?: AddressEvidence;

  @ApiProperty({ enum: ['success', 'partial', 'failed'] })
  enrichmentStatus: 'success' | 'partial' | 'failed';

  @ApiProperty({ type: [String] })
  enrichmentLog: string[];

  @ApiProperty({ type: Object })
  crawlMetadata: CrawlMetadata;
}

export class EnrichmentJobDto {
  @ApiProperty()
  jobId: string;

  @ApiProperty()
  leadId: string;

  @ApiProperty({ enum: ['queued', 'processing', 'completed', 'failed'] })
  status: 'queued' | 'processing' | 'completed' | 'failed';

  @ApiPropertyOptional()
  result?: EnrichmentResultDto;

  @ApiPropertyOptional()
  error?: string;
}

export class EnrichmentStatsDto {
  @ApiProperty()
  totalEnriched: number;

  @ApiProperty()
  successRate: number;

  @ApiProperty()
  avgCrawlTimeMs: number;

  @ApiProperty()
  botDetectionRate: number;

  @ApiProperty()
  enrichmentsByStatus: {
    success: number;
    partial: number;
    failed: number;
  };
}
