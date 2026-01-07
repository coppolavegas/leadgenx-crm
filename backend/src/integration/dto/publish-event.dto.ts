import { IsString, IsObject, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublishEventDto {
  @ApiProperty({ example: 'lead.created', description: 'Event name' })
  @IsString()
  @IsNotEmpty()
  event_name: string;

  @ApiPropertyOptional({ example: 'autogenx', description: 'Target product slug (optional, if omitted, broadcasts to all registered webhooks)' })
  @IsOptional()
  @IsString()
  target_product?: string;

  @ApiPropertyOptional({ example: 'client-uuid', description: 'Client/workspace ID (if applicable)' })
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @ApiProperty({ example: { lead_id: 'lead-uuid', business_name: 'Acme Corp' }, description: 'Event payload' })
  @IsObject()
  payload: Record<string, any>;
}
