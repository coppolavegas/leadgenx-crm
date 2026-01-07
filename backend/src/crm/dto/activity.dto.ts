import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsUUID, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateActivityDto {
  @ApiProperty({ description: 'Lead ID (optional)', required: false })
  @IsOptional()
  @IsUUID()
  lead_id?: string;

  @ApiProperty({ description: 'Activity type', enum: ['note', 'call', 'email', 'meeting', 'task_completed', 'stage_changed', 'owner_changed'] })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Activity content/description' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}

export class ListActivitiesQueryDto {
  @ApiProperty({ description: 'Lead ID to filter by', required: false })
  @IsOptional()
  @IsUUID()
  lead_id?: string;

  @ApiProperty({ description: 'Activity type to filter by', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Page number', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}