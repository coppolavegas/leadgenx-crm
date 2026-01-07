import { IsEmail, IsString, MinLength, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john@acmecorp.com', description: 'Business email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Password (min 8 characters)', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  @MinLength(2)
  full_name: string;

  @ApiProperty({ example: 'Acme Corp', description: 'Company name' })
  @IsString()
  @MinLength(2)
  company_name: string;

  @ApiPropertyOptional({ example: 'Sales Director', description: 'Job title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: '+1-555-123-4567', description: 'Business phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Technology', description: 'Industry/vertical' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: 'https://acmecorp.com', description: 'Company website' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: 'San Francisco', description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'CA', description: 'State/province' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'US', description: 'Country code (ISO 3166-1 alpha-2)', default: 'US' })
  @IsOptional()
  @IsString()
  country?: string;
}
