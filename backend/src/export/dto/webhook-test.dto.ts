import { IsUrl, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookTestDto {
  @ApiProperty({ description: 'Webhook URL to test' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ 
    description: 'Optional test payload', 
    type: 'object',
    additionalProperties: true 
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}

export class WebhookTestResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  status_code: number;

  @ApiProperty({ 
    type: 'object', 
    additionalProperties: true 
  })
  response_body: any;

  @ApiProperty()
  response_time_ms: number;

  @ApiProperty({ nullable: true })
  error?: string;
}
