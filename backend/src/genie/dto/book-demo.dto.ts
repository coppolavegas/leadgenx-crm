import { IsString, IsEmail, IsNotEmpty, IsOptional, IsISO8601 } from 'class-validator';

export class BookDemoDto {
  @IsEmail()
  @IsNotEmpty()
  contact_email: string;

  @IsString()
  @IsNotEmpty()
  contact_name: string;

  @IsOptional()
  @IsString()
  contact_phone?: string;

  @IsString()
  @IsNotEmpty()
  company_name: string;

  @IsOptional()
  @IsString()
  company_size?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsISO8601()
  preferred_date?: string;

  @IsOptional()
  @IsString()
  preferred_time_slot?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  use_case_description?: string;

  @IsOptional()
  @IsString()
  additional_notes?: string;
}
