import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OptOutService } from './opt-out.service';

/**
 * InboundMessageService
 * Processes inbound SMS and email messages from webhooks
 */
@Injectable()
export class InboundMessageService {
  private readonly logger = new Logger(InboundMessageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly optOutService: OptOutService,
  ) {}

  /**
   * Process inbound SMS message
   * Returns messageId if processed, null if duplicate (idempotent)
   */
  async processInboundSms(params: {
    from: string; // E.164 format phone number
    to: string; // Our Twilio number
    body: string;
    externalId: string; // Twilio MessageSid
    receivedAt: Date;
    metadata?: any;
  }): Promise<{ messageId: string | null; optOutDetected: boolean }> {
    const { from, to, body, externalId, receivedAt, metadata } = params;

    try {
      // Check for duplicate (idempotency)
      const existing = await this.prisma.automation_message.findFirst({
        where: { external_id: externalId },
        select: { id: true },
      });

      if (existing) {
        this.logger.debug(
          `Duplicate SMS webhook ignored: ${externalId}`,
        );
        return { messageId: null, optOutDetected: false };
      }

      // Resolve workspace from "to" number
      const workspace = await this.prisma.messaging_settings.findFirst({
        where: { twilio_from_phone: to },
        select: { workspace_id: true },
      });

      if (!workspace) {
        this.logger.warn(
          `No workspace found for Twilio number ${to}`,
        );
        // Still create message but with null workspace for debugging
        return { messageId: null, optOutDetected: false };
      }

      const workspaceId = workspace.workspace_id;

      // Find lead by phone number
      const lead = await this.findLeadByPhone(from, workspaceId);

      if (!lead) {
        this.logger.warn(
          `No lead found for phone ${from} in workspace ${workspaceId}`,
        );
        // Create message anyway for audit trail
      }

      const leadId = lead?.id;

      // Check for opt-out keywords
      const isOptOut = this.optOutService.isSmsOptOutKeyword(body);

      // Create inbound message record
      // Note: lead_id can be null if lead not found
      const messageData: any = {
        workspace_id: workspaceId,
        channel: 'sms',
        direction: 'inbound',
        from_phone: from,
        to_phone: to,
        body,
        status: 'received',
        external_id: externalId,
        received_at: receivedAt,
        metadata_json: metadata,
      };
      
      if (leadId) {
        messageData.lead_id = leadId;
      }
      
      const message = await this.prisma.automation_message.create({
        data: messageData,
      });

      // Update lead's last inbound tracking
      if (leadId) {
        await this.prisma.lead.update({
          where: { id: leadId },
          data: {
            last_inbound_message_at: receivedAt,
            last_inbound_message_text: body,
          },
        });
      }

      // Handle opt-out
      if (isOptOut && leadId) {
        await this.optOutService.markSmsOptOut(
          leadId,
          workspaceId,
          `Inbound STOP keyword: "${body}"`,
        );

        this.logger.log(
          `Lead ${leadId} opted out via SMS: "${body}"`,
        );
      }

      // Emit automation event
      try {
        await this.prisma.automation_event.create({
          data: {
            workspace_id: workspaceId,
            lead_id: leadId,
            event_type: 'inbound_message_received',
            payload: {
              channel: 'sms',
              from,
              to,
              body,
              messageId: message.id,
              optOut: isOptOut,
              timestamp: receivedAt.toISOString(),
            },
          },
        });
      } catch (error) {
        this.logger.warn('Failed to create automation event', error);
      }

      return {
        messageId: message.id,
        optOutDetected: isOptOut,
      };
    } catch (error) {
      this.logger.error('Failed to process inbound SMS', error);
      throw error;
    }
  }

  /**
   * Process inbound email message
   */
  async processInboundEmail(params: {
    from: string; // Email address
    to: string; // Our email
    subject: string;
    body: string;
    externalId?: string;
    receivedAt: Date;
    metadata?: any;
  }): Promise<{ messageId: string | null; optOutDetected: boolean }> {
    const { from, to, subject, body, externalId, receivedAt, metadata } =
      params;

    try {
      // Check for duplicate (idempotency)
      if (externalId) {
        const existing = await this.prisma.automation_message.findFirst({
          where: { external_id: externalId },
          select: { id: true },
        });

        if (existing) {
          this.logger.debug(
            `Duplicate email webhook ignored: ${externalId}`,
          );
          return { messageId: null, optOutDetected: false };
        }
      }

      // Resolve workspace from "to" email
      const workspace = await this.prisma.messaging_settings.findFirst({
        where: { sendgrid_from_email: to },
        select: { workspace_id: true },
      });

      if (!workspace) {
        this.logger.warn(
          `No workspace found for email address ${to}`,
        );
        return { messageId: null, optOutDetected: false };
      }

      const workspaceId = workspace.workspace_id;

      // Find lead by email
      const lead = await this.findLeadByEmail(from, workspaceId);

      if (!lead) {
        this.logger.warn(
          `No lead found for email ${from} in workspace ${workspaceId}`,
        );
      }

      const leadId = lead?.id;

      // Check for opt-out keywords
      const isOptOut = this.optOutService.isEmailOptOutKeyword(
        subject,
        body,
      );

      // Create inbound message record
      // Note: lead_id can be null if lead not found
      const messageData: any = {
        workspace_id: workspaceId,
        channel: 'email',
        direction: 'inbound',
        from_email: from,
        to_email: to,
        subject,
        body,
        status: 'received',
        external_id: externalId,
        received_at: receivedAt,
        metadata_json: metadata,
      };
      
      if (leadId) {
        messageData.lead_id = leadId;
      }
      
      const message = await this.prisma.automation_message.create({
        data: messageData,
      });

      // Update lead's last inbound tracking
      if (leadId) {
        await this.prisma.lead.update({
          where: { id: leadId },
          data: {
            last_inbound_message_at: receivedAt,
            last_inbound_message_text: body,
          },
        });
      }

      // Handle opt-out
      if (isOptOut && leadId) {
        await this.optOutService.markEmailOptOut(
          leadId,
          workspaceId,
          `Inbound unsubscribe: "${subject}"`,
        );

        this.logger.log(
          `Lead ${leadId} opted out via email: "${subject}"`,
        );
      }

      // Emit automation event
      try {
        await this.prisma.automation_event.create({
          data: {
            workspace_id: workspaceId,
            lead_id: leadId,
            event_type: 'inbound_message_received',
            payload: {
              channel: 'email',
              from,
              to,
              subject,
              body: body.substring(0, 500), // Truncate for event storage
              messageId: message.id,
              optOut: isOptOut,
              timestamp: receivedAt.toISOString(),
            },
          },
        });
      } catch (error) {
        this.logger.warn('Failed to create automation event', error);
      }

      return {
        messageId: message.id,
        optOutDetected: isOptOut,
      };
    } catch (error) {
      this.logger.error('Failed to process inbound email', error);
      throw error;
    }
  }

  /**
   * Update message status from delivery webhook
   */
  async updateMessageStatus(params: {
    externalId: string;
    status: string; // delivered, failed, bounced, complained
    deliveredAt?: Date;
    errorMessage?: string;
    metadata?: any;
  }): Promise<{ messageId: string | null; updated: boolean }> {
    const { externalId, status, deliveredAt, errorMessage, metadata } =
      params;

    try {
      // Find message by external ID
      const message = await this.prisma.automation_message.findFirst({
        where: { external_id: externalId },
        select: { id: true, status: true },
      });

      if (!message) {
        this.logger.warn(
          `Message not found for external ID ${externalId}`,
        );
        return { messageId: null, updated: false };
      }

      // Idempotent: Skip if already in final state
      if (
        ['delivered', 'failed', 'bounced', 'complained'].includes(
          message.status,
        )
      ) {
        this.logger.debug(
          `Message ${message.id} already in final state: ${message.status}`,
        );
        return { messageId: message.id, updated: false };
      }

      // Update message
      await this.prisma.automation_message.update({
        where: { id: message.id },
        data: {
          status,
          delivered_at: deliveredAt,
          error_message: errorMessage,
          metadata_json: metadata,
        },
      });

      this.logger.log(
        `Updated message ${message.id} status to ${status}`,
      );

      return { messageId: message.id, updated: true };
    } catch (error) {
      this.logger.error(
        `Failed to update message status for ${externalId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find lead by phone number (E.164 format)
   */
  private async findLeadByPhone(
    phone: string,
    workspaceId: string,
  ): Promise<{ id: string } | null> {
    // Normalize phone number (remove +1, spaces, dashes)
    const normalized = phone.replace(/[^0-9]/g, '');

    const lead = await this.prisma.lead.findFirst({
      where: {
        phone: {
          contains: normalized.slice(-10), // Last 10 digits
        },
        campaign_leads: {
          some: {
            campaign: {
              organization_id: workspaceId,
            },
          },
        },
      },
      select: { id: true },
    });

    return lead;
  }

  /**
   * Find lead by email address
   * Note: emails_found is a JSON array in enriched_lead, making this query complex.
   * For now, we use a workaround. In production, consider adding an indexed email field.
   */
  private async findLeadByEmail(
    email: string,
    workspaceId: string,
  ): Promise<{ id: string } | null> {
    // TODO: Implement proper JSON array querying for emails_found
    // For now, return null (inbound emails won't be linked to leads automatically)
    this.logger.warn(
      `Email lookup not fully implemented for ${email}. Inbound email will be stored without lead association.`,
    );
    return null;
    
    /* Future implementation:
    const enrichedLead = await this.prisma.$queryRaw`
      SELECT el.lead_id
      FROM enriched_lead el
      INNER JOIN lead l ON l.id = el.lead_id
      INNER JOIN campaign_lead cl ON cl.lead_id = l.id
      INNER JOIN campaign c ON c.id = cl.campaign_id
      WHERE c.organization_id = ${workspaceId}
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(el.emails_found) AS email_obj
        WHERE email_obj->>'email' = ${email.toLowerCase()}
      )
      LIMIT 1
    `;
    return enrichedLead[0] || null;
    */
  }
}
