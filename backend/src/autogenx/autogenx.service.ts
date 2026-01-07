import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * AutoGenX Phase 1: Event Emission Service
 * 
 * This service provides fire-and-forget event emission.
 * Events are stored in automation_events table for background processing.
 */
@Injectable()
export class AutoGenxService {
  private readonly logger = new Logger(AutoGenxService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Emit an automation event (fire-and-forget)
   * This is non-blocking and safe to call from any service
   */
  async emitEvent(params: {
    workspaceId?: string;
    leadId?: string;
    eventType: string;
    payload: Record<string, any>;
  }): Promise<void> {
    try {
      await this.prisma.automation_event.create({
        data: {
          workspace_id: params.workspaceId || null,
          lead_id: params.leadId || null,
          event_type: params.eventType,
          payload: params.payload,
          status: 'pending',
          attempts: 0,
        },
      });

      this.logger.log(
        `Event emitted: ${params.eventType} (leadId: ${params.leadId || 'none'}, workspaceId: ${params.workspaceId || 'none'})`,
      );
    } catch (error) {
      // Log but don't throw - fire-and-forget
      this.logger.error(`Failed to emit event: ${params.eventType}`, error);
    }
  }

  /**
   * Get pending events for background processing
   */
  async getPendingEvents(limit: number = 50) {
    return this.prisma.automation_event.findMany({
      where: {
        status: 'pending',
        attempts: { lt: 5 }, // Max 5 attempts
      },
      orderBy: {
        created_at: 'asc', // FIFO
      },
      take: limit,
    });
  }

  /**
   * Mark event as processed
   */
  async markEventProcessed(eventId: string): Promise<void> {
    await this.prisma.automation_event.update({
      where: { id: eventId },
      data: {
        status: 'processed',
        processed_at: new Date(),
      },
    });
  }

  /**
   * Mark event as failed and increment attempts
   */
  async markEventFailed(eventId: string, error: string): Promise<void> {
    const event = await this.prisma.automation_event.findUnique({
      where: { id: eventId },
    });

    if (!event) return;

    const newAttempts = event.attempts + 1;
    const shouldMarkFailed = newAttempts >= 5;

    await this.prisma.automation_event.update({
      where: { id: eventId },
      data: {
        attempts: newAttempts,
        last_error: error,
        status: shouldMarkFailed ? 'failed' : 'pending',
        processed_at: shouldMarkFailed ? new Date() : null,
      },
    });

    if (shouldMarkFailed) {
      this.logger.warn(`Event ${eventId} permanently failed after 5 attempts`);
    }
  }

  /**
   * Get event statistics
   */
  async getStats() {
    const [pending, processed, failed] = await Promise.all([
      this.prisma.automation_event.count({ where: { status: 'pending' } }),
      this.prisma.automation_event.count({ where: { status: 'processed' } }),
      this.prisma.automation_event.count({ where: { status: 'failed' } }),
    ]);

    return { pending, processed, failed, total: pending + processed + failed };
  }
}
