import { Controller, Post, Body, Logger, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { WebhookTestDto, WebhookTestResponseDto } from './dto/webhook-test.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@ApiTags('Webhooks')
@Controller('webhooks')
@UseGuards(ApiKeyGuard)
@ApiSecurity('X-API-Key')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post('test')
  @ApiOperation({ 
    summary: 'Test a webhook endpoint',
    description: 'Send a test payload to a webhook URL to verify connectivity and response handling'
  })
  @ApiResponse({ status: 200, description: 'Webhook test completed', type: WebhookTestResponseDto })
  async testWebhook(@Body() dto: WebhookTestDto): Promise<WebhookTestResponseDto> {
    this.logger.log(`Testing webhook URL: ${dto.url}`);
    return this.webhookService.testWebhook(dto);
  }
}
