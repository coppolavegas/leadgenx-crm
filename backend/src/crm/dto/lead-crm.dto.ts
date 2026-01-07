import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class UpdateLeadStageDto {
  @ApiProperty({ description: 'New stage ID' })
  @IsUUID()
  crm_stage_id: string;
}

export class UpdateLeadOwnerDto {
  @ApiProperty({ description: 'New owner user ID' })
  @IsUUID()
  owner_user_id: string;
}

export class UpdateLeadCrmFieldsDto {
  @ApiProperty({ description: 'Stage ID', required: false })
  @IsOptional()
  @IsUUID()
  crm_stage_id?: string;

  @ApiProperty({ description: 'Owner user ID', required: false })
  @IsOptional()
  @IsUUID()
  owner_user_id?: string;

  @ApiProperty({ description: 'Last contacted timestamp', required: false })
  @IsOptional()
  @IsDateString()
  last_contacted_at?: string;

  @ApiProperty({ description: 'Next task due timestamp', required: false })
  @IsOptional()
  @IsDateString()
  next_task_due_at?: string;
}