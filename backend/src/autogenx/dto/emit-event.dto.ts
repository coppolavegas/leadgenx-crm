import { IsString, IsOptional, IsObject, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmitEventDto {
  @ApiProperty({ required: false, description: 'Workspace/Organization ID' })
  @IsUUID()
  @IsOptional()
  workspaceId?: string;

  @ApiProperty({ required: false, description: 'Lead ID' })
  @IsUUID()
  @IsOptional()
  leadId?: string;

  @ApiProperty({ description: 'Event type (e.g., lead_created, lead_status_changed)' })
  @IsString()
  eventType: string;

  @ApiProperty({ description: 'Event payload data' })
  @IsObject()
  payload: Record<string, any>;
}
