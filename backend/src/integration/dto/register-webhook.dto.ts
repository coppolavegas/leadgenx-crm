import { IsString, IsArray, IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterWebhookDto {
  @ApiProperty({ example: 'autogenx', description: 'Target product slug' })
  @IsString()
  @IsNotEmpty()
  target_product: string;

  @ApiProperty({ example: 'https://autogenx.app/api/webhooks/leadgenx', description: 'Webhook URL' })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ example: ['lead.created', 'lead.updated', 'client.created'], description: 'Array of event names to subscribe to' })
  @IsArray()
  @IsString({ each: true })
  events: string[];

  @ApiProperty({ example: 'xsuite_secret_abc123', description: 'HMAC secret for signature verification' })
  @IsString()
  @IsNotEmpty()
  secret: string;
}
