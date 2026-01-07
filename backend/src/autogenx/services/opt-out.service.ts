import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * OptOutService
 * Handles opt-out keyword detection and lead opt-out management
 */
@Injectable()
export class OptOutService {
  private readonly logger = new Logger(OptOutService.name);

  // Standard opt-out keywords (case-insensitive)
  private readonly SMS_OPT_OUT_KEYWORDS = [
    'stop',
    'stopall',
    'unsubscribe',
    'cancel',
    'end',
    'quit',
    'arret', // French
    'stopp', // German
  ];

  private readonly EMAIL_OPT_OUT_KEYWORDS = [
    'unsubscribe',
    'opt-out',
    'opt out',
    'remove',
    'remove me',
    'do not contact',
    'stop sending',
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if message body contains SMS opt-out keyword
   */
  isSmsOptOutKeyword(body: string): boolean {
    const normalized = body.trim().toLowerCase();

    // Check exact match or if message starts with keyword
    return this.SMS_OPT_OUT_KEYWORDS.some(
      (keyword) =>
        normalized === keyword ||
        normalized.startsWith(keyword + ' ') ||
        normalized.startsWith(keyword + '\n'),
    );
  }

  /**
   * Check if email body/subject contains opt-out keyword
   */
  isEmailOptOutKeyword(subject: string, body: string): boolean {
    const combinedText = `${subject || ''} ${body || ''}`.trim().toLowerCase();

    return this.EMAIL_OPT_OUT_KEYWORDS.some((keyword) =>
      combinedText.includes(keyword),
    );
  }

  /**
   * Mark lead as opted out of SMS
   */
  async markSmsOptOut(
    leadId: string,
    workspaceId: string,
    reason: string,
  ): Promise<void> {
    try {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { sms_opt_out: true },
      });

      this.logger.log(
        `Lead ${leadId} opted out of SMS in workspace ${workspaceId}: ${reason}`,
      );

      // Create audit event (if audit system exists)
      try {
        await this.prisma.automation_event.create({
          data: {
            workspace_id: workspaceId,
            lead_id: leadId,
            event_type: 'lead_sms_opt_out',
            payload: {
              reason,
              timestamp: new Date().toISOString(),
            },
          },
        });
      } catch (error) {
        this.logger.warn('Failed to create opt-out audit event', error);
      }
    } catch (error) {
      this.logger.error(`Failed to mark lead ${leadId} as SMS opt-out`, error);
      throw error;
    }
  }

  /**
   * Mark lead as opted out of email
   */
  async markEmailOptOut(
    leadId: string,
    workspaceId: string,
    reason: string,
  ): Promise<void> {
    try {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { email_opt_out: true },
      });

      this.logger.log(
        `Lead ${leadId} opted out of email in workspace ${workspaceId}: ${reason}`,
      );

      // Create audit event
      try {
        await this.prisma.automation_event.create({
          data: {
            workspace_id: workspaceId,
            lead_id: leadId,
            event_type: 'lead_email_opt_out',
            payload: {
              reason,
              timestamp: new Date().toISOString(),
            },
          },
        });
      } catch (error) {
        this.logger.warn('Failed to create opt-out audit event', error);
      }
    } catch (error) {
      this.logger.error(
        `Failed to mark lead ${leadId} as email opt-out`,
        error,
      );
      throw error;
    }
  }

  /**
   * Check if lead has opted out of SMS
   */
  async isSmsOptedOut(leadId: string): Promise<boolean> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { sms_opt_out: true },
    });

    return lead?.sms_opt_out ?? false;
  }

  /**
   * Check if lead has opted out of email
   */
  async isEmailOptedOut(leadId: string): Promise<boolean> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { email_opt_out: true },
    });

    return lead?.email_opt_out ?? false;
  }

  /**
   * Get opt-out status for a lead
   */
  async getOptOutStatus(leadId: string): Promise<{
    smsOptOut: boolean;
    emailOptOut: boolean;
  }> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        sms_opt_out: true,
        email_opt_out: true,
      },
    });

    return {
      smsOptOut: lead?.sms_opt_out ?? false,
      emailOptOut: lead?.email_opt_out ?? false,
    };
  }

  /**
   * Get opt-out statistics for a workspace
   */
  async getOptOutStats(workspaceId: string): Promise<{
    smsOptOutCount: number;
    emailOptOutCount: number;
    totalLeads: number;
  }> {
    const [smsOptOutCount, emailOptOutCount, totalLeads] = await Promise.all([
      this.prisma.lead.count({
        where: {
          campaign_leads: {
            some: {
              campaign: { organization_id: workspaceId },
            },
          },
          sms_opt_out: true,
        },
      }),
      this.prisma.lead.count({
        where: {
          campaign_leads: {
            some: {
              campaign: { organization_id: workspaceId },
            },
          },
          email_opt_out: true,
        },
      }),
      this.prisma.lead.count({
        where: {
          campaign_leads: {
            some: {
              campaign: { organization_id: workspaceId },
            },
          },
        },
      }),
    ]);

    return {
      smsOptOutCount,
      emailOptOutCount,
      totalLeads,
    };
  }
}
