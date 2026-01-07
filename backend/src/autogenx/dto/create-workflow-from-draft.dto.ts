import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { WorkflowDraftDto } from './workflow-draft.dto';

export class CreateWorkflowFromDraftDto {
  @ApiProperty({
    description: 'Workflow draft to publish',
    type: WorkflowDraftDto,
  })
  @ValidateNested()
  @Type(() => WorkflowDraftDto)
  @IsNotEmpty()
  workflowDraft: WorkflowDraftDto;

  @ApiProperty({
    description: 'Optional prompt log ID to link published workflow',
    required: false,
  })
  @IsOptional()
  @IsString()
  promptLogId?: string;

  @ApiProperty({
    description: 'Optional user ID for audit trail',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
