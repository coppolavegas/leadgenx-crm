import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookService } from './webhook.service';
import { InboxService } from '../../inbox/inbox.service';
import { SlaTrackingService } from '../../inbox/sla-tracking.service';
import { AutomationService } from '../../inbox/automation.service';
import { GetMessagesQueryDto, UpdateMessageStatusDto, MessageStatus } from '../dto/message.dto';

/**
 * MessageLogService: Tracks all outgoing messages and their status
 * 
 * Responsibilities:
 * - Log message sends
 * - Update message status (delivered, opened, replied, failed)
 * - Integration with CRM (create activities on replies)
 * - Auto-update lead stage on reply detection
 * - Phase 15: Create inbox items and update SLA tracking
 */
@Injectable()
export class MessageLogService {
  private readonly logger = new Logger(MessageLogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
    @Inject(forwardRef(() => InboxService))
    private readonly inboxService: InboxService,
    @Inject(forwardRef(() => SlaTrackingService))
    private readonly slaService: SlaTrackingService,
    @Inject(forwardRef(() => AutomationService))
    private readonly automationService: AutomationService,
  ) {}

  /**
   * Get message logs for a client
   */
  async getMessages(clientId: string, query: GetMessagesQueryDto) {
    const { status, leadId, sequenceId, page = 1, limit = 50 } = query;

    const where: any = {};

    // Filter by sequence (which is client-scoped)
    if (sequenceId) {
      where.sequence_id = sequenceId;
      
      // Verify sequence belongs to client
      const sequence = await this.prisma.outreach_sequence.findFirst({
        where: { id: sequenceId, client_id: clientId },
      });

      if (!sequence) {
        throw new NotFoundException('Sequence not found');
      }
    } else {
      // Get all sequences for this client
      const sequences = await this.prisma.outreach_sequence.findMany({
        where: { client_id: clientId },
        select: { id: true },
      });

      where.sequence_id = { in: sequences.map((s) => s.id) };
    }

    if (status) {
      where.status = status;
    }

    if (leadId) {
      where.lead_id = leadId;
    }

    const [messages, total] = await Promise.all([
      this.prisma.message_log.findMany({
        where,
        include: {
          lead: {
            include: {
              enriched_lead: true,
            },
          },
          sequence: true,
          step: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.message_log.count({ where }),
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single message log
   */
  async getMessage(clientId: string, messageId: string) {
    const message = await this.prisma.message_log.findUnique({
      where: { id: messageId },
      include: {
        lead: {
          include: {
            enriched_lead: true,
          },
        },
        sequence: true,
        step: true,
        enrollment: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify message belongs to client via sequence
    const sequence = await this.prisma.outreach_sequence.findFirst({
      where: {
        id: message.sequence_id,
        client_id: clientId,
      },
    });

    if (!sequence) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  /**
   * Update message status (usually called by AutoGenX webhook)
   */
  async updateMessageStatus(
    clientId: string,
    messageId: string,
    dto: UpdateMessageStatusDto,
  ) {
    const message = await this.getMessage(clientId, messageId);

    const updates: any = {
      status: dto.status,
    };

    if (dto.providerId) {
      updates.provider_id = dto.providerId;
    }

    // Set timestamp based on status
    const now = new Date();
    switch (dto.status) {
      case MessageStatus.SENT:
        updates.sent_at = now;
        break;
      case MessageStatus.DELIVERED:
        updates.delivered_at = now;
        break;
      case MessageStatus.OPENED:
        updates.opened_at = now;
        break;
      case MessageStatus.REPLIED:
        updates.replied_at = now;
        break;
      case MessageStatus.FAILED:
      case MessageStatus.BOUNCED:
        updates.failed_at = now;
        updates.error_code = dto.errorCode;
        updates.error_message = dto.errorMessage;
        break;
    }

    const updatedMessage = await this.prisma.message_log.update({
      where: { id: messageId },
      data: updates,
      include: {
        lead: {
          include: {
            enriched_lead: true,
            crm_stage: {
              include: {
                pipeline: true,
              },
            },
          },
        },
        sequence: {
          include: {
            client: true,
          },
        },
      },
    });

    // Emit webhooks
    if (dto.status === MessageStatus.DELIVERED) {
      await this.webhookService.emitMessageDelivered({
        messageLogId: messageId,
        leadId: message.lead_id,
        providerId: dto.providerId || '',
        deliveredAt: now.toISOString(),
      });
    } else if (dto.status === MessageStatus.REPLIED) {
      await this.webhookService.emitMessageReplied({
        messageLogId: messageId,
        leadId: message.lead_id,
        providerId: dto.providerId || '',
        repliedAt: now.toISOString(),
      });

      // CRM Integration: Auto-move lead to "Connected" stage
      await this.handleReply(updatedMessage);
    } else if (dto.status === MessageStatus.FAILED || dto.status === MessageStatus.BOUNCED) {
      await this.webhookService.emitMessageFailed({
        messageLogId: messageId,
        leadId: message.lead_id,
        errorCode: dto.errorCode || 'unknown',
        errorMessage: dto.errorMessage || 'Message failed',
        failedAt: now.toISOString(),
      });
    }

    return updatedMessage;
  }

  /**
   * Handle reply: Create activity + auto-move to "Connected" stage
   */
  private async handleReply(message: any) {
    this.logger.log(`Handling reply for lead ${message.lead_id}`);

    const lead = message.lead;
    const sequence = message.sequence;

    // Create activity in CRM
    const activity = await this.prisma.activity.create({
      data: {
        client_id: sequence.client_id,
        lead_id: lead.id,
        type: 'email',
        content: `Lead replied to outreach sequence "${sequence.name}"`,
        meta: {
          direction: 'inbound',
          sequence_id: sequence.id,
          message_id: message.id,
          subject: message.subject,
        },
        created_by_user_id: sequence.created_by_user_id,
      },
    });

    // Phase 15: Create inbox item for reply
    await this.inboxService.createInboxItem(sequence.client_id, {
      leadId: lead.id,
      userId: sequence.created_by_user_id,
      type: 'reply',
      title: `${lead.name || 'Lead'} replied to "${sequence.name}"`,
      body: message.body || message.subject,
      messageId: message.id,
      activityId: activity.id,
      metadata: {
        sequence_id: sequence.id,
        subject: message.subject,
      },
    });

    // Phase 15: Update SLA tracking
    await this.slaService.updateLastTouch(lead.id);

    // Phase 15: Auto-complete pending follow-up tasks
    await this.automationService.autoCompleteReplyTasks(
      sequence.client_id,
      lead.id,
    );

    // Auto-move to "Connected" stage if in CRM pipeline
    if (lead.crm_stage_id) {
      const pipeline = lead.crm_stage.pipeline;

      // Find "Connected" stage (or similar)
      const connectedStage = await this.prisma.client_pipeline_stage.findFirst({
        where: {
          pipeline_id: pipeline.id,
          name: { in: ['Connected', 'Responded', 'Engaged'] },
        },
      });

      if (connectedStage) {
        await this.prisma.lead.update({
          where: { id: lead.id },
          data: {
            crm_stage_id: connectedStage.id,
            last_contacted_at: new Date(),
          },
        });

        // Log stage change activity
        await this.prisma.activity.create({
          data: {
            client_id: sequence.client_id,
            lead_id: lead.id,
            type: 'stage_changed',
            content: `Lead automatically moved to "${connectedStage.name}" after replying`,
            meta: {
              from_stage_id: lead.crm_stage_id,
              to_stage_id: connectedStage.id,
              reason: 'auto_reply',
            },
            created_by_user_id: sequence.created_by_user_id,
          },
        });

        this.logger.log(
          `Lead ${lead.id} auto-moved to stage "${connectedStage.name}"`,
        );
      }
    }
  }

  /**
   * Create a message log (simulated send for testing)
   * In production, AutoGenX would trigger the actual email send
   */
  async createMessageLog(data: {
    leadId: string;
    sequenceId: string;
    stepId: string;
    enrollmentId: string;
    subject: string;
    body: string;
    recipientEmail: string;
  }) {
    const message = await this.prisma.message_log.create({
      data: {
        lead_id: data.leadId,
        sequence_id: data.sequenceId,
        step_id: data.stepId,
        enrollment_id: data.enrollmentId,
        type: 'email',
        provider: 'autogenx',
        status: 'pending',
        subject: data.subject,
        body: data.body,
        recipient_email: data.recipientEmail,
        scheduled_at: new Date(),
      },
      include: {
        lead: true,
        sequence: true,
        step: true,
      },
    });

    // Emit webhook to AutoGenX
    await this.webhookService.emitStepExecuted({
      messageLogId: message.id,
      enrollmentId: data.enrollmentId,
      leadId: data.leadId,
      sequenceId: data.sequenceId,
      stepId: data.stepId,
      stepOrder: message.step.step_order,
      subject: data.subject,
      recipientEmail: data.recipientEmail,
    });

    return message;
  }
}
