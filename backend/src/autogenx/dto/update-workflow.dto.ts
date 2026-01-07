import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateWorkflowDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  triggerEventType?: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
