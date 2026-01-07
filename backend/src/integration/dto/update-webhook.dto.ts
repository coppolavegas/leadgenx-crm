import { IsString, IsArray, IsUrl, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWebhookDto {
  @ApiPropertyOptional({ example: 'https://autogenx.app/api/webhooks/leadgenx/v2', description: 'Webhook URL' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ example: ['lead.created', 'lead.updated', 'client.created', 'lead.status_changed'], description: 'Array of event names' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[];

  @ApiPropertyOptional({ example: 'xsuite_secret_xyz789', description: 'HMAC secret for signature verification' })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiPropertyOptional({ example: false, description: 'Enable/disable webhook' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
