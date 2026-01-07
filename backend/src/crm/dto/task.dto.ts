import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsDateString, IsEnum } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ description: 'Lead ID (optional)', required: false })
  @IsOptional()
  @IsUUID()
  lead_id?: string;

  @ApiProperty({ description: 'User ID to assign task to' })
  @IsUUID()
  assigned_to_user_id: string;

  @ApiProperty({ description: 'Task title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Task description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Due date', required: false })
  @IsOptional()
  @IsDateString()
  due_at?: string;

  @ApiProperty({ description: 'Task type', required: false, enum: ['call', 'email', 'meeting', 'follow_up', 'general'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Task priority', required: false, enum: ['low', 'medium', 'high', 'urgent'] })
  @IsOptional()
  @IsString()
  priority?: string;
}

export class UpdateTaskDto {
  @ApiProperty({ description: 'Task title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Task description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Due date', required: false })
  @IsOptional()
  @IsDateString()
  due_at?: string;

  @ApiProperty({ description: 'Task status', required: false, enum: ['pending', 'in_progress', 'completed', 'cancelled'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Task type', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Task priority', required: false })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiProperty({ description: 'Assigned user ID', required: false })
  @IsOptional()
  @IsUUID()
  assigned_to_user_id?: string;
}

export class ListTasksQueryDto {
  @ApiProperty({ description: 'Lead ID to filter by', required: false })
  @IsOptional()
  @IsUUID()
  lead_id?: string;

  @ApiProperty({ description: 'Task status to filter by', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Assigned user ID to filter by', required: false })
  @IsOptional()
  @IsUUID()
  assigned_to_user_id?: string;

  @ApiProperty({ description: 'Page number', required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false })
  @IsOptional()
  limit?: number;
}