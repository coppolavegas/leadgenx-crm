import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateWorkspaceFeaturesDto {
  @ApiProperty({ required: false, description: 'Enable/disable Lead Discovery Module' })
  @IsBoolean()
  @IsOptional()
  feature_discovery?: boolean;

  @ApiProperty({ required: false, description: 'Enable/disable Data Enrichment Module' })
  @IsBoolean()
  @IsOptional()
  feature_enrichment?: boolean;

  @ApiProperty({ required: false, description: 'Enable/disable Verified Match Module' })
  @IsBoolean()
  @IsOptional()
  feature_verification?: boolean;

  @ApiProperty({ required: false, description: 'Enable/disable CRM Pipeline Module' })
  @IsBoolean()
  @IsOptional()
  feature_crm?: boolean;

  @ApiProperty({ required: false, description: 'Enable/disable Outreach & Sequences Module' })
  @IsBoolean()
  @IsOptional()
  feature_outreach?: boolean;

  @ApiProperty({ required: false, description: 'Enable/disable Unified Inbox Module' })
  @IsBoolean()
  @IsOptional()
  feature_inbox?: boolean;

  @ApiProperty({ required: false, description: 'Enable/disable Analytics Dashboard Module' })
  @IsBoolean()
  @IsOptional()
  feature_analytics?: boolean;

  @ApiProperty({ required: false, description: 'Enable/disable Genie AI Assistant Module' })
  @IsBoolean()
  @IsOptional()
  feature_genie_ai?: boolean;

  @ApiProperty({ required: false, description: 'Enable/disable X Suite Integration (Premium)' })
  @IsBoolean()
  @IsOptional()
  feature_x_suite?: boolean;

  @ApiProperty({ required: false, description: 'Enable/disable Website Intelligence Module' })
  @IsBoolean()
  @IsOptional()
  feature_website_intel?: boolean;
}
