import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO: iCal feed details
 */
export class IcalFeedResponseDto {
  @ApiProperty({ description: 'Feed ID' })
  id: string;

  @ApiProperty({ description: 'Workspace ID' })
  workspaceId: string;

  @ApiProperty({ description: 'Whether feed is enabled' })
  isEnabled: boolean;

  @ApiPropertyOptional({ description: 'Human-readable feed name' })
  name?: string;

  @ApiProperty({ description: 'Public .ics subscription URL' })
  feedUrl: string;

  @ApiProperty({ description: 'Feed creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Feed update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Last token rotation timestamp' })
  lastRotatedAt?: Date;
}

/**
 * Request DTO: Update feed settings
 */
export class UpdateIcalFeedDto {
  @ApiPropertyOptional({ description: 'Enable or disable feed' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Human-readable feed name' })
  @IsOptional()
  @IsString()
  name?: string;
}
