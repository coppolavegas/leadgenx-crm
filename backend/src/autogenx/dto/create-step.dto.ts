import { IsString, IsInt, IsObject, Min } from 'class-validator';

export class CreateStepDto {
  @IsInt()
  @Min(1)
  stepOrder: number;

  @IsString()
  actionType: string; // Phase 2: 'update_lead_status' | 'add_lead_tag' | 'create_task' | 'notify_user' | Phase 2.5: 'wait_hours' | 'condition_contains_text' | 'branch'

  @IsObject()
  actionConfig: Record<string, any>;
}
