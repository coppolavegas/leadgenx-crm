import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsEnum, IsDateString } from 'class-validator';

/**
 * Query messages for a workspace
 */
export class QueryMessagesDto {
  @ApiPropertyOptional({ description: 'Filter by lead ID' })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional({ description: 'Filter by channel', enum: ['sms', 'email'] })
  @IsOptional()
  @IsEnum(['sms', 'email'])
  channel?: 'sms' | 'email';

  @ApiPropertyOptional({ description: 'Filter by direction', enum: ['inbound', 'outbound'] })
  @IsOptional()
  @IsEnum(['inbound', 'outbound'])
  direction?: 'inbound' | 'outbound';

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO format)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', default: 50 })
  @IsOptional()
  @IsInt()
  limit?: number;
}

/**
 * Message response DTO
 */
export class MessageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  workspaceId: string;

  @ApiProperty()
  leadId: string;

  @ApiPropertyOptional()
  enrollmentId?: string;

  @ApiProperty({ enum: ['sms', 'email'] })
  channel: string;

  @ApiProperty({ enum: ['inbound', 'outbound'] })
  direction: string;

  @ApiPropertyOptional()
  toPhone?: string;

  @ApiPropertyOptional()
  toEmail?: string;

  @ApiPropertyOptional()
  fromPhone?: string;

  @ApiPropertyOptional()
  fromEmail?: string;

  @ApiPropertyOptional()
  subject?: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  externalId?: string;

  @ApiPropertyOptional()
  errorMessage?: string;

  @ApiPropertyOptional()
  sentAt?: Date;

  @ApiPropertyOptional()
  deliveredAt?: Date;

  @ApiPropertyOptional()
  receivedAt?: Date;

  @ApiPropertyOptional()
  metadataJson?: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Paginated messages response
 */
export class PaginatedMessagesDto {
  @ApiProperty({ type: [MessageDto] })
  messages: MessageDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

/**
 * Messaging usage stats
 */
export class MessagingUsageStatsDto {
  @ApiProperty()
  workspaceId: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  smsCount: number;

  @ApiProperty()
  emailCount: number;

  @ApiProperty()
  smsLimit: number;

  @ApiProperty()
  emailLimit: number;

  @ApiProperty()
  smsRemaining: number;

  @ApiProperty()
  emailRemaining: number;
}

/**
 * Messaging error log
 */
export class MessagingErrorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  workspaceId: string;

  @ApiProperty()
  leadId: string;

  @ApiProperty({ enum: ['sms', 'email'] })
  channel: string;

  @ApiProperty()
  errorMessage: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  externalId?: string;

  @ApiPropertyOptional()
  body?: string;
}

/**
 * Admin messaging errors query
 */
export class QueryMessagingErrorsDto {
  @ApiPropertyOptional({ description: 'Time range', enum: ['1h', '6h', '24h', '7d', '30d'] })
  @IsOptional()
  @IsEnum(['1h', '6h', '24h', '7d', '30d'])
  range?: string;

  @ApiPropertyOptional({ description: 'Filter by workspace ID' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Filter by channel', enum: ['sms', 'email'] })
  @IsOptional()
  @IsEnum(['sms', 'email'])
  channel?: 'sms' | 'email';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', default: 50 })
  @IsOptional()
  @IsInt()
  limit?: number;
}

/**
 * Admin messaging usage query
 */
export class QueryMessagingUsageDto {
  @ApiPropertyOptional({ description: 'Time range', enum: ['7d', '30d', '90d'] })
  @IsOptional()
  @IsEnum(['7d', '30d', '90d'])
  range?: string;

  @ApiPropertyOptional({ description: 'Filter by workspace ID' })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}

/**
 * Opt-out statistics
 */
export class OptOutStatsDto {
  @ApiProperty()
  workspaceId: string;

  @ApiProperty()
  smsOptOutCount: number;

  @ApiProperty()
  emailOptOutCount: number;

  @ApiProperty()
  totalLeads: number;

  @ApiProperty()
  smsOptOutRate: number; // Percentage

  @ApiProperty()
  emailOptOutRate: number; // Percentage
}
