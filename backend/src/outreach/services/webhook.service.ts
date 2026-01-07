import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * WebhookService: Emits signed webhooks to AutoGenX
 * 
 * Phase 14: Email-first outreach engine
 * Events:
 * - sequence.enrolled: Lead enrolled in sequence
 * - step.executed: Email step executed
 * - message.delivered: Email delivered
 * - message.replied: Email reply detected
 * - message.failed: Email failed to send
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly webhookSecret: string;
  private readonly webhookUrl: string;

  constructor() {
    // In production, these should come from environment variables
    this.webhookSecret = process.env.AUTOGENX_WEBHOOK_SECRET || 'dev-secret-key';
    this.webhookUrl = process.env.AUTOGENX_WEBHOOK_URL || 'https://api.autogenx.com/webhooks/leadgenx';
  }

  /**
   * Emit a signed webhook to AutoGenX
   */
  async emitWebhook(event: string, data: any): Promise<void> {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const signature = this.signPayload(payload);

    try {
      this.logger.log(`Emitting webhook: ${event}`);
      this.logger.debug(`Webhook payload: ${JSON.stringify(payload)}`);

      // In production, use fetch/axios to send to AutoGenX
      // For now, we'll log it
      if (process.env.NODE_ENV === 'production' && this.webhookUrl) {
        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-LeadGenX-Signature': signature,
            'X-LeadGenX-Event': event,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          this.logger.error(
            `Webhook delivery failed: ${response.status} ${response.statusText}`,
          );
        } else {
          this.logger.log(`Webhook delivered successfully: ${event}`);
        }
      } else {
        this.logger.log('Dev mode: Webhook not sent to external service');
        this.logger.debug(`Signature: ${signature}`);
      }
    } catch (error) {
      this.logger.error(`Failed to emit webhook: ${error.message}`, error.stack);
    }
  }

  /**
   * Sign webhook payload with HMAC-SHA256
   */
  private signPayload(payload: any): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Verify webhook signature (for incoming webhooks from AutoGenX)
   */
  verifySignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  // ========================================================================
  // WEBHOOK EVENT EMITTERS
  // ========================================================================

  async emitSequenceEnrolled(data: {
    enrollmentId: string;
    leadId: string;
    sequenceId: string;
    sequenceName: string;
    leadEmail: string;
  }): Promise<void> {
    await this.emitWebhook('sequence.enrolled', data);
  }

  async emitStepExecuted(data: {
    messageLogId: string;
    enrollmentId: string;
    leadId: string;
    sequenceId: string;
    stepId: string;
    stepOrder: number;
    subject: string;
    recipientEmail: string;
  }): Promise<void> {
    await this.emitWebhook('step.executed', data);
  }

  async emitMessageDelivered(data: {
    messageLogId: string;
    leadId: string;
    providerId: string;
    deliveredAt: string;
  }): Promise<void> {
    await this.emitWebhook('message.delivered', data);
  }

  async emitMessageReplied(data: {
    messageLogId: string;
    leadId: string;
    providerId: string;
    repliedAt: string;
  }): Promise<void> {
    await this.emitWebhook('message.replied', data);
  }

  async emitMessageFailed(data: {
    messageLogId: string;
    leadId: string;
    errorCode: string;
    errorMessage: string;
    failedAt: string;
  }): Promise<void> {
    await this.emitWebhook('message.failed', data);
  }
}
