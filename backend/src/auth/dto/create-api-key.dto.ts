import { IsString, IsOptional, IsDateString, IsInt, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ApiKeyRole {
  ADMIN = 'admin',
  USER = 'user',
}

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Friendly name for the API key', example: 'Production Key' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Organization slug', example: 'acme-corp' })
  @IsString()
  organizationSlug: string;

  @ApiPropertyOptional({ description: 'Expiration date (ISO 8601)', example: '2026-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ 
    description: 'Rate limit: requests per minute', 
    example: 100, 
    minimum: 10, 
    maximum: 1000,
    default: 100 
  })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(1000)
  @Type(() => Number)
  rateLimitRpm?: number;

  @ApiPropertyOptional({ 
    description: 'Rate limit: daily enrichment job limit', 
    example: 1000, 
    minimum: 10, 
    maximum: 10000,
    default: 1000 
  })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(10000)
  @Type(() => Number)
  rateLimitDailyJobs?: number;

  @ApiPropertyOptional({ 
    enum: ApiKeyRole,
    description: 'Role for RBAC (admin has full access, user has limited access)', 
    example: 'user',
    default: 'user'
  })
  @IsOptional()
  @IsEnum(ApiKeyRole)
  role?: ApiKeyRole;
}
