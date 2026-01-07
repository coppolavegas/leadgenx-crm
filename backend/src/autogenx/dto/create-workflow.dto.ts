import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateWorkflowDto {
  @IsString()
  name: string;

  @IsString()
  triggerEventType: string; // 'lead_created' | 'lead_status_changed' | etc.

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean = true;
}
