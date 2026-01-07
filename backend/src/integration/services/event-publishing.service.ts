import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventSigningService, XSuiteEvent } from './event-signing.service';

@Injectable()
export class EventPublishingService {
  private readonly logger = new Logger(EventPublishingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventSigning: EventSigningService,
  ) {}

  /**
   * Publish an event to all registered webhooks
   */
  async publishEvent(
    eventName: string,
    organizationId: string,
    payload: Record<string, any>,
    clientId?: string,
    targetProduct?: string,
  ): Promise<{ event_id: string; webhooks_triggered: number }> {
    // Generate event ID and timestamp
    const eventId = this.eventSigning.generateEventId();
    const timestamp = new Date().toISOString();

    // Find all registered webhooks for this organization and event
    const webhooks = await this.prisma.x_suite_webhook.findMany({
      where: {
        organization_id: organizationId,
        is_active: true,
        source_product: 'leadgenx',
        ...(targetProduct && { target_product: targetProduct }),
        events: {
          has: eventName,
        },
      },
    });

    if (webhooks.length === 0) {
      this.logger.debug(
        `No webhooks registered for event '${eventName}' in organization '${organizationId}'`,
      );
      return { event_id: eventId, webhooks_triggered: 0 };
    }

    // Deliver event to each webhook
    let successCount = 0;

    for (const webhook of webhooks) {
      try {
        // Create event object
        const event: Omit<XSuiteEvent, 'signature'> = {
          event_id: eventId,
          event_name: eventName,
          event_version: '1.0',
          source_product: 'leadgenx',
          target_product: webhook.target_product,
          organization_id: organizationId,
          client_id: clientId,
          payload,
          timestamp,
        };

        // Sign event
        const signature = this.eventSigning.signEvent(event, webhook.secret);
        const signedEvent: XSuiteEvent = { ...event, signature };

        // Log event in database
        await this.prisma.x_suite_event_log.create({
          data: {
            event_id: eventId,
            event_name: eventName,
            event_version: '1.0',
            source_product: 'leadgenx',
            target_product: webhook.target_product,
            organization_id: organizationId,
            client_id: clientId,
            payload: payload as any,
            signature,
            status: 'pending',
          },
        });

        // Deliver webhook (async, don't wait for response)
        this.deliverWebhook(webhook.id, webhook.url, signedEvent);
        successCount++;
      } catch (error) {
        this.logger.error(
          `Failed to prepare event for webhook ${webhook.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Published event '${eventName}' (${eventId}) to ${successCount}/${webhooks.length} webhooks`,
    );

    return { event_id: eventId, webhooks_triggered: successCount };
  }

  /**
   * Deliver webhook to external product (async)
   */
  private async deliverWebhook(
    webhookId: string,
    url: string,
    event: XSuiteEvent,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSuite-Event-Id': event.event_id,
          'X-XSuite-Signature': event.signature || '',
        },
        body: JSON.stringify(event),
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        // Success
        await this.prisma.x_suite_webhook.update({
          where: { id: webhookId },
          data: {
            last_triggered_at: new Date(),
            last_success_at: new Date(),
            failure_count: 0,
            last_error: null,
          },
        });

        await this.prisma.x_suite_event_log.updateMany({
          where: { event_id: event.event_id },
          data: {
            status: 'delivered',
            processed_at: new Date(),
            delivery_attempts: { increment: 1 },
            last_delivery_attempt: new Date(),
          },
        });

        this.logger.log(
          `Webhook delivered successfully to ${url} (${latency}ms)`,
        );
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      this.logger.error(
        `Webhook delivery failed to ${url} (${latency}ms): ${error.message}`,
      );

      // Update webhook failure count
      await this.prisma.x_suite_webhook.update({
        where: { id: webhookId },
        data: {
          last_triggered_at: new Date(),
          failure_count: { increment: 1 },
          last_error: error.message,
        },
      });

      // Update event log
      await this.prisma.x_suite_event_log.updateMany({
        where: { event_id: event.event_id },
        data: {
          status: 'failed',
          delivery_attempts: { increment: 1 },
          last_delivery_attempt: new Date(),
          error_message: error.message,
        },
      });
    }
  }
}
