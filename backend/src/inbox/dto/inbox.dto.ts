import { IsBoolean, IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetInboxQueryDto {
  @ApiPropertyOptional({ description: 'Filter by inbox item type' })
  @IsOptional()
  @IsString()
  type?: string; // 'reply' | 'note' | 'system_event' | 'task_completed' | 'stage_change' | 'email_sent'

  @ApiPropertyOptional({ description: 'Filter by lead ID' })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional({ description: 'Filter by read status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  read?: boolean;

  @ApiPropertyOptional({ description: 'Filter by starred status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  starred?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 50;
}

export class MarkInboxItemDto {
  @ApiProperty({ description: 'Mark as read or unread' })
  @IsBoolean()
  read: boolean;
}

export class StarInboxItemDto {
  @ApiProperty({ description: 'Star or unstar' })
  @IsBoolean()
  starred: boolean;
}

export class CreateInboxItemDto {
  @ApiProperty()
  @IsString()
  leadId?: string;

  @ApiProperty()
  @IsString()
  userId?: string;

  @ApiProperty({ enum: ['reply', 'note', 'system_event', 'task_completed', 'stage_change', 'email_sent'] })
  @IsString()
  @IsIn(['reply', 'note', 'system_event', 'task_completed', 'stage_change', 'email_sent'])
  type: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taskId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messageId?: string;
}
