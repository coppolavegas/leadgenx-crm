import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagingSettingsService } from './messaging-settings.service';
import { QuietHoursService } from './quiet-hours.service';
import { RateLimitService } from './rate-limit.service';
import { OptOutService } from './opt-out.service';
import { Queue } from 'bullmq';

/**
 * MessagingService
 * Main service for queueing outbound messages (SMS/Email) with guardrails.
 * Phase 4.5: AutoGenX Messaging, Compliance & Inbound
 */
@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);
  private messageQueue: Queue;

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: MessagingSettingsService,
    private readonly quietHoursService: QuietHoursService,
    private readonly rateLimitService: RateLimitService,
    private readonly optOutService: OptOutService,
  ) {
    // Initialize BullMQ queue for async message sending
    this.messageQueue = new Queue('autogenx-messages', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },
    });
  }

  /**
   * Enqueue a message to be sent (called by workflow executor).
   * Performs all compliance checks before queueing.
   */
  async enqueueMessage(data: {
    workspaceId: string;
    enrollmentId?: string;
    leadId: string;
    channel: 'sms' | 'email';
    to: string; // phone or email
    subject?: string; // for emails
    body: string;
  }): Promise<{ success: boolean; message?: string; messageId?: string }> {
    this.logger.log(
      `Enqueuing ${data.channel} message for lead ${data.leadId} in workspace ${data.workspaceId}`,
    );

    try {
      // 1. Check if channel is enabled
      const isEnabled =
        data.channel === 'sms'
          ? await this.settingsService.isSmsEnabled(data.workspaceId)
          : await this.settingsService.isEmailEnabled(data.workspaceId);

      if (!isEnabled) {
        const error = `${data.channel.toUpperCase()} is not enabled for workspace ${data.workspaceId}`;
        this.logger.warn(error);
        return { success: false, message: error };
      }

      // 2. Check opt-out status
      const hasOptedOut =
        data.channel === 'sms'
          ? await this.optOutService.isSmsOptedOut(data.leadId)
          : await this.optOutService.isEmailOptedOut(data.leadId);

      if (hasOptedOut) {
        const error = `Lead ${data.leadId} has opted out of ${data.channel}`;
        this.logger.warn(error);
        
        // Create failed message for audit trail
        await this.createFailedMessage(data, error);
        
        return { success: false, message: error };
      }

      // 3. Check rate limits
      const rateLimitCheck = await this.rateLimitService.checkLimit(
        data.workspaceId,
        data.channel,
      );

      if (!rateLimitCheck.allowed) {
        const error =
          rateLimitCheck.reason ||
          `Daily ${data.channel} limit reached for workspace ${data.workspaceId}`;
        this.logger.warn(error);
        
        // Create failed message for audit trail
        await this.createFailedMessage(data, error);
        
        return { success: false, message: error };
      }

      // 4. Check quiet hours
      const quietHoursCheck = await this.quietHoursService.isQuietHours(
        data.workspaceId,
      );

      if (quietHoursCheck.isQuietHours && quietHoursCheck.nextAllowedTime) {
        this.logger.log(
          `In quiet hours, delaying message until ${quietHoursCheck.nextAllowedTime.toISOString()}`,
        );

        // Create message in 'pending' status with delayed send time
        const message = await this.createPendingMessage(
          data,
          quietHoursCheck.nextAllowedTime,
        );
        
        // Queue with delay
        const delayMs = quietHoursCheck.nextAllowedTime.getTime() - Date.now();
        await this.messageQueue.add(
          'send-message',
          { messageId: message.id },
          {
            jobId: message.id,
            delay: delayMs,
            removeOnComplete: true,
            removeOnFail: false,
          },
        );

        return {
          success: true,
          message: `Message scheduled for ${quietHoursCheck.nextAllowedTime.toISOString()} (after quiet hours)`,
          messageId: message.id,
        };
      }

      // 5. All checks passed, create message and queue immediately
      const message = await this.createPendingMessage(data);

      // Queue for background worker
      await this.messageQueue.add(
        'send-message',
        {
          messageId: message.id,
        },
        {
          jobId: message.id, // For idempotency
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.log(`Message ${message.id} queued successfully`);
      
      // Increment usage counter (non-blocking)
      this.rateLimitService
        .incrementUsage(data.workspaceId, data.channel)
        .catch((err) => {
          this.logger.warn('Failed to increment usage counter', err);
        });

      return {
        success: true,
        message: 'Message queued for sending',
        messageId: message.id,
      };
    } catch (error) {
      this.logger.error(
        `Failed to enqueue message: ${error.message}`,
        error.stack,
      );
      return { success: false, message: error.message };
    }
  }

  /**
   * Create a pending message record in the database.
   */
  private async createPendingMessage(
    data: {
      workspaceId: string;
      enrollmentId?: string;
      leadId: string;
      channel: 'sms' | 'email';
      to: string;
      subject?: string;
      body: string;
    },
    scheduledFor?: Date,
  ) {
    const messageData: any = {
      workspace_id: data.workspaceId,
      enrollment_id: data.enrollmentId,
      lead_id: data.leadId,
      channel: data.channel,
      body: data.body,
      status: 'pending',
    };

    if (data.channel === 'sms') {
      messageData.to_phone = data.to;
    } else if (data.channel === 'email') {
      messageData.to_email = data.to;
      messageData.subject = data.subject || 'Message from LeadGenX';
    }

    if (scheduledFor) {
      // Store scheduled send time in metadata (or add a new column)
      // For now, we'll use the created_at + delay logic in worker
    }

    return this.prisma.automation_message.create({
      data: messageData,
    });
  }

  /**
   * Create a failed message record for audit trail.
   */
  private async createFailedMessage(
    data: {
      workspaceId: string;
      enrollmentId?: string;
      leadId: string;
      channel: 'sms' | 'email';
      to: string;
      subject?: string;
      body: string;
    },
    errorMessage: string,
  ) {
    const messageData: any = {
      workspace_id: data.workspaceId,
      enrollment_id: data.enrollmentId,
      lead_id: data.leadId,
      channel: data.channel,
      body: data.body,
      status: 'failed',
      error_message: errorMessage,
    };

    if (data.channel === 'sms') {
      messageData.to_phone = data.to;
    } else if (data.channel === 'email') {
      messageData.to_email = data.to;
      messageData.subject = data.subject || 'Message from LeadGenX';
    }

    return this.prisma.automation_message.create({
      data: messageData,
    });
  }
}
