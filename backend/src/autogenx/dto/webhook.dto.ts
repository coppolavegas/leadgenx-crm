import { IsString, IsOptional, IsDate, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Twilio SMS Inbound Webhook DTO
 * https://www.twilio.com/docs/sms/twiml#twilios-request-to-your-application
 */
export class TwilioSmsInboundDto {
  @ApiProperty({ description: 'Twilio message SID' })
  @IsString()
  MessageSid: string;

  @ApiProperty({ description: 'SMS status' })
  @IsString()
  SmsStatus: string;

  @ApiProperty({ description: 'Sender phone number' })
  @IsString()
  From: string;

  @ApiProperty({ description: 'Recipient phone number' })
  @IsString()
  To: string;

  @ApiProperty({ description: 'Message body' })
  @IsString()
  Body: string;

  @ApiPropertyOptional({ description: 'Number of media items' })
  @IsOptional()
  @IsString()
  NumMedia?: string;

  @ApiPropertyOptional({ description: 'Account SID' })
  @IsOptional()
  @IsString()
  AccountSid?: string;

  @ApiPropertyOptional({ description: 'From city' })
  @IsOptional()
  @IsString()
  FromCity?: string;

  @ApiPropertyOptional({ description: 'From state' })
  @IsOptional()
  @IsString()
  FromState?: string;

  @ApiPropertyOptional({ description: 'From country' })
  @IsOptional()
  @IsString()
  FromCountry?: string;
}

/**
 * Twilio SMS Status Callback DTO
 */
export class TwilioSmsStatusDto {
  @ApiProperty({ description: 'Twilio message SID' })
  @IsString()
  MessageSid: string;

  @ApiProperty({ description: 'Message status' })
  @IsString()
  MessageStatus: string; // delivered, sent, failed, undelivered

  @ApiPropertyOptional({ description: 'Error code if failed' })
  @IsOptional()
  @IsString()
  ErrorCode?: string;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  @IsOptional()
  @IsString()
  ErrorMessage?: string;

  @ApiProperty({ description: 'Recipient phone number' })
  @IsString()
  To: string;

  @ApiProperty({ description: 'Sender phone number' })
  @IsString()
  From: string;

  @ApiPropertyOptional({ description: 'Account SID' })
  @IsOptional()
  @IsString()
  AccountSid?: string;
}

/**
 * SendGrid Email Inbound Webhook DTO
 * https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook
 */
export class SendGridInboundDto {
  @ApiProperty({ description: 'Sender email address' })
  @IsString()
  from: string;

  @ApiProperty({ description: 'Recipient email address' })
  @IsString()
  to: string;

  @ApiPropertyOptional({ description: 'Email subject' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Plain text body' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: 'HTML body' })
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional({ description: 'SendGrid envelope JSON' })
  @IsOptional()
  @IsString()
  envelope?: string;

  @ApiPropertyOptional({ description: 'Number of attachments' })
  @IsOptional()
  @IsString()
  attachments?: string;

  @ApiPropertyOptional({ description: 'SPF check result' })
  @IsOptional()
  @IsString()
  SPF?: string;

  @ApiPropertyOptional({ description: 'DKIM check result' })
  @IsOptional()
  @IsString()
  DKIM?: string;
}

/**
 * SendGrid Email Event Webhook DTO
 * https://docs.sendgrid.com/for-developers/tracking-events/event
 */
export class SendGridEventDto {
  @ApiProperty({ description: 'Event type' })
  @IsString()
  event: string; // delivered, bounce, dropped, spam_report, unsubscribe

  @ApiProperty({ description: 'Email address' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Unix timestamp' })
  timestamp: number;

  @ApiPropertyOptional({ description: 'SendGrid message ID' })
  @IsOptional()
  @IsString()
  'sg_message_id'?: string;

  @ApiPropertyOptional({ description: 'Custom message ID from send' })
  @IsOptional()
  @IsString()
  'smtp-id'?: string;

  @ApiPropertyOptional({ description: 'Bounce reason' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Bounce status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Response from receiving server' })
  @IsOptional()
  @IsString()
  response?: string;

  @ApiPropertyOptional({ description: 'IP address' })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiPropertyOptional({ description: 'User agent (for clicks/opens)' })
  @IsOptional()
  @IsString()
  useragent?: string;
}

/**
 * Generic inbound message response
 */
export class InboundMessageResponseDto {
  @ApiProperty({ description: 'Whether webhook was processed successfully' })
  success: boolean;

  @ApiProperty({ description: 'Message ID created/updated' })
  messageId?: string;

  @ApiPropertyOptional({ description: 'Opt-out detected' })
  optOutDetected?: boolean;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;
}

/**
 * Status callback response
 */
export class StatusCallbackResponseDto {
  @ApiProperty({ description: 'Whether webhook was processed successfully' })
  success: boolean;

  @ApiProperty({ description: 'Message ID updated' })
  messageId?: string;

  @ApiPropertyOptional({ description: 'New status' })
  status?: string;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;
}
