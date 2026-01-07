import { IsString, IsNotEmpty, IsArray, IsObject, IsOptional, ValidateNested, IsNumber, IsBoolean, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Allowed event types from Phase 1
const ALLOWED_EVENT_TYPES = [
  'lead_created',
  'lead_status_changed',
  'lead_tagged',
  'inbound_message_received',
  'task_completed',
  'form_submitted',
] as const;

// Allowed action types from Phase 2 and 2.5
const ALLOWED_ACTION_TYPES = [
  'update_lead_status',
  'add_lead_tag',
  'remove_lead_tag',
  'create_task',
  'update_lead_field',
  'wait_hours',
  'condition_contains_text',
  'branch',
] as const;

export class WorkflowTriggerDto {
  @ApiProperty({
    description: 'Event type that triggers the workflow',
    enum: ALLOWED_EVENT_TYPES,
  })
  @IsString()
  @IsIn(ALLOWED_EVENT_TYPES)
  eventType: typeof ALLOWED_EVENT_TYPES[number];

  @ApiProperty({
    description: 'Optional filters for the trigger event',
    required: false,
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}

export class WorkflowStepDto {
  @ApiProperty({
    description: 'Step execution order',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  order: number;

  @ApiProperty({
    description: 'Action type to execute',
    enum: ALLOWED_ACTION_TYPES,
  })
  @IsString()
  @IsIn(ALLOWED_ACTION_TYPES)
  actionType: typeof ALLOWED_ACTION_TYPES[number];

  @ApiProperty({
    description: 'Configuration for the action',
  })
  @IsObject()
  actionConfig: Record<string, any>;
}

export class WorkflowConstraintsDto {
  @ApiProperty({
    description: 'Maximum number of steps allowed in workflow',
    minimum: 1,
    maximum: 20,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxSteps?: number;

  @ApiProperty({
    description: 'Quiet hours configuration',
    required: false,
  })
  @IsOptional()
  @IsObject()
  quietHours?: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };

  @ApiProperty({
    description: 'Maximum messages per day per lead',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxMessagesPerDay?: number;
}

export class WorkflowDraftDto {
  @ApiProperty({
    description: 'Workflow name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Workflow description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Trigger configuration',
    type: WorkflowTriggerDto,
  })
  @ValidateNested()
  @Type(() => WorkflowTriggerDto)
  trigger: WorkflowTriggerDto;

  @ApiProperty({
    description: 'Workflow steps',
    type: [WorkflowStepDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[];

  @ApiProperty({
    description: 'Workflow constraints',
    required: false,
    type: WorkflowConstraintsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkflowConstraintsDto)
  constraints?: WorkflowConstraintsDto;

  @ApiProperty({
    description: 'List of assumptions made by AI when generating the workflow',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assumptions?: string[];
}

export class WorkflowDraftResponseDto {
  @ApiProperty({
    description: 'Generated workflow draft',
    type: WorkflowDraftDto,
  })
  draft: WorkflowDraftDto;

  @ApiProperty({
    description: 'Validation result',
  })
  valid: boolean;

  @ApiProperty({
    description: 'Validation errors if any',
    required: false,
  })
  errors?: string[];

  @ApiProperty({
    description: 'Validation warnings',
    required: false,
  })
  warnings?: string[];

  @ApiProperty({
    description: 'Prompt log ID for audit trail',
  })
  logId: string;
}
