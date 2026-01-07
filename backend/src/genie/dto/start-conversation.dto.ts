import { IsOptional, IsString, IsObject } from 'class-validator';

export class StartConversationDto {
  @IsOptional()
  @IsString()
  visitor_email?: string;

  @IsOptional()
  @IsString()
  visitor_name?: string;

  @IsOptional()
  @IsString()
  visitor_company?: string;

  @IsOptional()
  @IsString()
  visitor_role?: string;

  @IsOptional()
  @IsObject()
  session_metadata?: Record<string, any>;
}
