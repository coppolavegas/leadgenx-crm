import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for Google Calendar connection status
 */
export class GoogleCalendarStatusDto {
  @ApiProperty({ description: 'Whether Google Calendar is connected' })
  connected: boolean;

  @ApiPropertyOptional({ description: 'Google account email' })
  googleUserEmail?: string;

  @ApiPropertyOptional({ description: 'Calendar ID (usually "primary")' })
  calendarId?: string;

  @ApiProperty({ description: 'Whether the connection is enabled' })
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Last sync timestamp' })
  lastSyncedAt?: Date;
}

/**
 * Response DTO for listing Google Calendars
 */
export class GoogleCalendarListItemDto {
  @ApiProperty({ description: 'Calendar ID' })
  id: string;

  @ApiProperty({ description: 'Calendar summary/name' })
  summary: string;

  @ApiProperty({ description: 'Is primary calendar' })
  primary: boolean;

  @ApiPropertyOptional({ description: 'Calendar description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Calendar timezone' })
  timeZone?: string;
}

export class GoogleCalendarListDto {
  @ApiProperty({ type: [GoogleCalendarListItemDto] })
  calendars: GoogleCalendarListItemDto[];
}

/**
 * DTO for updating Google Calendar settings
 */
export class UpdateGoogleCalendarSettingsDto {
  @ApiPropertyOptional({ description: 'Calendar ID to use (e.g., "primary")' })
  @IsOptional()
  @IsString()
  calendarId?: string;

  @ApiPropertyOptional({ description: 'Enable/disable the connection' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

/**
 * Response after successful OAuth connection
 */
export class GoogleCalendarConnectResponseDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ description: 'Google account email' })
  googleUserEmail: string;

  @ApiProperty({ description: 'Calendar ID' })
  calendarId: string;
}
