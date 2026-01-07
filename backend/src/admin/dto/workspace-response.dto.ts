import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  plan: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty()
  user_count: number;

  @ApiProperty()
  feature_discovery: boolean;

  @ApiProperty()
  feature_enrichment: boolean;

  @ApiProperty()
  feature_verification: boolean;

  @ApiProperty()
  feature_crm: boolean;

  @ApiProperty()
  feature_outreach: boolean;

  @ApiProperty()
  feature_inbox: boolean;

  @ApiProperty()
  feature_analytics: boolean;

  @ApiProperty()
  feature_genie_ai: boolean;

  @ApiProperty()
  feature_x_suite: boolean;

  @ApiProperty()
  feature_website_intel: boolean;
}
