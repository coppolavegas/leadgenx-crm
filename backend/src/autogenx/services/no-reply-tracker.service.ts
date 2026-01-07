import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AutoGenxService } from '../autogenx.service';

/**
 * NoReplyTrackerService
 * 
 * Tracks outbound messages and detects when leads don't reply.
 * Emits 'no_reply_after_hours' events when appropriate.
 */
@Injectable()
export class NoReplyTrackerService {
  private readonly logger = new Logger(NoReplyTrackerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly autogenxService: AutoGenxService,
  ) {}

  /**
   * Record an outbound message sent to a lead.
   * Updates lead.last_outbound_message_at for no-reply tracking.
   */
  async recordOutboundMessage(
    workspaceId: string,
    leadId: string,
    messageText?: string,
  ): Promise<void> {
    this.logger.log(`Recording outbound message to lead ${leadId}`);

    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        last_outbound_message_at: new Date(),
        last_contacted_at: new Date(),
      },
    });
  }

  /**
   * Record an inbound message received from a lead.
   * Updates lead.last_inbound_message_at and last_inbound_message_text.
   */
  async recordInboundMessage(
    workspaceId: string,
    leadId: string,
    messageText?: string,
  ): Promise<void> {
    this.logger.log(`Recording inbound message from lead ${leadId}`);

    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        last_inbound_message_at: new Date(),
        last_inbound_message_text: messageText || null,
      },
    });

    // Emit event for inbound message (workflows might listen to this)
    await this.autogenxService.emitEvent({
      workspaceId,
      leadId,
      eventType: 'inbound_message_received',
      payload: {
        messageText,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Schedule a no-reply check for a lead.
   * This will check after 'hours' if the lead has replied.
   * If not, emits a 'no_reply_after_hours' event.
   */
  async scheduleNoReplyCheck(
    workspaceId: string,
    leadId: string,
    hours: number,
  ): Promise<void> {
    this.logger.log(
      `Scheduling no-reply check for lead ${leadId} in ${hours} hours`,
    );

    // Get current outbound message timestamp
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      this.logger.warn(`Lead ${leadId} not found, cannot schedule no-reply check`);
      return;
    }

    const outboundMessageAt = lead.last_outbound_message_at || new Date();

    // Calculate check time
    const checkAt = new Date(outboundMessageAt.getTime() + hours * 60 * 60 * 1000);

    // Create a special event that will trigger the check
    // We'll process this event at the scheduled time
    await this.autogenxService.emitEvent({
      workspaceId,
      leadId,
      eventType: 'no_reply_check_scheduled',
      payload: {
        hours,
        outboundMessageAt: outboundMessageAt.toISOString(),
        checkAt: checkAt.toISOString(),
        leadId,
      },
    });

    this.logger.log(
      `No-reply check scheduled for lead ${leadId} at ${checkAt.toISOString()}`,
    );
  }

  /**
   * Execute a no-reply check for a lead.
   * Checks if lead has replied since the outbound message.
   * If not, emits 'no_reply_after_hours' event.
   */
  async executeNoReplyCheck(
    workspaceId: string,
    leadId: string,
    outboundMessageAt: Date,
    hours: number,
  ): Promise<void> {
    this.logger.log(`Executing no-reply check for lead ${leadId}`);

    // Fetch lead
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      this.logger.warn(`Lead ${leadId} not found, skipping no-reply check`);
      return;
    }

    // Check if lead has replied since outbound message
    const hasReplied =
      lead.last_inbound_message_at &&
      lead.last_inbound_message_at > outboundMessageAt;

    if (hasReplied) {
      this.logger.log(
        `Lead ${leadId} has replied since ${outboundMessageAt.toISOString()}, no action needed`,
      );
      return;
    }

    // Lead has not replied - emit event
    this.logger.log(
      `Lead ${leadId} has NOT replied after ${hours} hours, emitting event`,
    );

    await this.autogenxService.emitEvent({
      workspaceId,
      leadId,
      eventType: 'no_reply_after_hours',
      payload: {
        hours,
        outboundMessageAt: outboundMessageAt.toISOString(),
        lastInboundMessageAt: lead.last_inbound_message_at?.toISOString() || null,
      },
    });
  }

  /**
   * Check if a lead's last inbound message contains any of the given texts.
   * Used for condition_contains_text step.
   */
  async checkMessageContainsText(
    leadId: string,
    containsTexts: string[],
    caseInsensitive: boolean = true,
  ): Promise<boolean> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead || !lead.last_inbound_message_text) {
      return false;
    }

    const message = caseInsensitive
      ? lead.last_inbound_message_text.toLowerCase()
      : lead.last_inbound_message_text;

    for (const text of containsTexts) {
      const searchText = caseInsensitive ? text.toLowerCase() : text;
      if (message.includes(searchText)) {
        this.logger.log(
          `Lead ${leadId} message contains "${text}": ${lead.last_inbound_message_text}`,
        );
        return true;
      }
    }

    return false;
  }
}
