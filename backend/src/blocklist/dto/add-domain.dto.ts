import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddDomainDto {
  @ApiProperty({ description: 'Domain to blocklist', example: 'spam-domain.com' })
  @IsString()
  domain: string;

  @ApiPropertyOptional({ description: 'Reason for blocking', example: 'Spam/fraudulent business' })
  @IsOptional()
  @IsString()
  reason?: string;
}
