import { IsString, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteTaskDto {
  @ApiPropertyOptional({ description: 'Optional notes for task completion' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SnoozeTaskDto {
  @ApiProperty({ description: 'Date/time to snooze until' })
  @IsDateString()
  snoozedUntil: string;
}

export class ReassignTaskDto {
  @ApiProperty({ description: 'New assignee user ID' })
  @IsString()
  newAssigneeId: string;
}

export class GetTasksQueryDto {
  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

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
