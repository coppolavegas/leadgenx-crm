import { Injectable, Logger } from '@nestjs/common';
import { WebhookTestDto, WebhookTestResponseDto } from './dto/webhook-test.dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  /**
   * Test a webhook URL with a sample payload
   */
  async testWebhook(dto: WebhookTestDto): Promise<WebhookTestResponseDto> {
    this.logger.log(`Testing webhook: ${dto.url}`);

    const startTime = Date.now();
    const payload = dto.payload || this.getDefaultTestPayload();

    try {
      const response = await fetch(dto.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LeadGenX-Webhook/1.0',
          'X-Webhook-Test': 'true',
        },
        body: JSON.stringify(payload),
      });

      const responseTime = Date.now() - startTime;
      let responseBody: any;

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        try {
          responseBody = await response.json();
        } catch {
          responseBody = await response.text();
        }
      } else {
        responseBody = await response.text();
      }

      this.logger.log(`Webhook test completed: ${response.status} in ${responseTime}ms`);

      return {
        success: response.ok,
        status_code: response.status,
        response_body: responseBody,
        response_time_ms: responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      this.logger.error(`Webhook test failed: ${error.message}`);

      return {
        success: false,
        status_code: 0,
        response_body: null,
        response_time_ms: responseTime,
        error: error.message || 'Network error or timeout',
      };
    }
  }

  /**
   * Get default test payload
   */
  private getDefaultTestPayload(): Record<string, any> {
    return {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from LeadGenX',
        lead_sample: {
          id: 'test-123',
          name: 'Test Business',
          website: 'https://example.com',
          score: 85,
          status: 'new',
        },
      },
    };
  }
}
