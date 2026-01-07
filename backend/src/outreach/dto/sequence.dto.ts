import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsInt,
  IsObject,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  IsNotEmpty,
} from 'class-validator';

export enum SequenceStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export class SendingHoursDto {
  @ApiProperty({ description: 'Start hour (0-23)', example: 9 })
  @IsInt()
  @Min(0)
  start: number;

  @ApiProperty({ description: 'End hour (0-23)', example: 17 })
  @IsInt()
  @Min(0)
  end: number;

  @ApiProperty({ description: 'IANA timezone', example: 'America/New_York' })
  @IsString()
  timezone: string;
}

export class CreateSequenceDto {
  @ApiProperty({ description: 'Sequence name', example: 'Welcome Series' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Sequence description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Maximum daily emails to send',
    example: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDailyEmails?: number;

  @ApiPropertyOptional({
    description: 'Sending hours configuration',
    type: SendingHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SendingHoursDto)
  sendingHours?: SendingHoursDto;
}

export class UpdateSequenceDto {
  @ApiPropertyOptional({ description: 'Sequence name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Sequence description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Sequence status',
    enum: SequenceStatus,
  })
  @IsOptional()
  @IsEnum(SequenceStatus)
  status?: SequenceStatus;

  @ApiPropertyOptional({ description: 'Maximum daily emails to send' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDailyEmails?: number;

  @ApiPropertyOptional({
    description: 'Sending hours configuration',
    type: SendingHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SendingHoursDto)
  sendingHours?: SendingHoursDto;
}

export class CreateStepDto {
  @ApiProperty({ description: 'Step order in sequence', example: 1 })
  @IsInt()
  @Min(1)
  stepOrder: number;

  @ApiProperty({ description: 'Delay in days after previous step', example: 0 })
  @IsInt()
  @Min(0)
  delayDays: number;

  @ApiProperty({ description: 'Email subject', example: 'Welcome to our platform' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: 'Email body (supports template variables)', example: 'Hi {{name}}, welcome!' })
  @IsString()
  @IsNotEmpty()
  body: string;
}

export class UpdateStepDto {
  @ApiPropertyOptional({ description: 'Delay in days after previous step' })
  @IsOptional()
  @IsInt()
  @Min(0)
  delayDays?: number;

  @ApiPropertyOptional({ description: 'Email subject' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Email body' })
  @IsOptional()
  @IsString()
  body?: string;
}

export class EnrollLeadsDto {
  @ApiProperty({
    description: 'Array of lead IDs to enroll',
    example: ['lead-uuid-1', 'lead-uuid-2'],
  })
  @IsArray()
  @IsString({ each: true })
  leadIds: string[];
}

export class UpdateEnrollmentDto {
  @ApiProperty({
    description: 'Enrollment status',
    enum: ['active', 'paused', 'completed', 'unsubscribed', 'failed'],
  })
  @IsEnum(['active', 'paused', 'completed', 'unsubscribed', 'failed'])
  status: string;
}
