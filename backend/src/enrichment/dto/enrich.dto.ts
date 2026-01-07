import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnrichLeadDto {
  @ApiProperty({ description: 'Lead ID to enrich' })
  @IsString()
  leadId: string;

  @ApiPropertyOptional({ description: 'Dry run mode - test extraction without persisting', default: false })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}

export class EnrichBatchDto {
  @ApiProperty({ description: 'Array of lead IDs to enrich', type: [String] })
  @IsString({ each: true })
  leadIds: string[];
}
