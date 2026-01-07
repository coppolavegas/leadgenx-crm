import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * MessagingSettingsService
 * Manages per-workspace messaging configuration and limits.
 * Phase 4.5: AutoGenX Messaging, Compliance & Inbound
 */
@Injectable()
export class MessagingSettingsService {
  private readonly logger = new Logger(MessagingSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create messaging settings for a workspace.
   */
  async getOrCreateSettings(workspaceId: string) {
    let settings = await this.prisma.messaging_settings.findUnique({
      where: { workspace_id: workspaceId },
    });

    if (!settings) {
      this.logger.log(`Creating default messaging settings for workspace ${workspaceId}`);
      settings = await this.prisma.messaging_settings.create({
        data: {
          workspace_id: workspaceId,
        },
      });
    }

    return settings;
  }

  /**
   * Update messaging settings for a workspace.
   */
  async updateSettings(workspaceId: string, data: any) {
    return this.prisma.messaging_settings.upsert({
      where: { workspace_id: workspaceId },
      create: {
        workspace_id: workspaceId,
        ...data,
      },
      update: data,
    });
  }

  /**
   * Check if SMS is enabled for a workspace.
   */
  async isSmsEnabled(workspaceId: string): Promise<boolean> {
    const settings = await this.getOrCreateSettings(workspaceId);
    return settings.sms_enabled && !!settings.twilio_account_sid && !!settings.twilio_from_phone;
  }

  /**
   * Check if Email is enabled for a workspace.
   */
  async isEmailEnabled(workspaceId: string): Promise<boolean> {
    const settings = await this.getOrCreateSettings(workspaceId);
    return settings.email_enabled && !!settings.sendgrid_api_key && !!settings.sendgrid_from_email;
  }

  /**
   * Get Twilio credentials for a workspace.
   */
  async getTwilioCredentials(workspaceId: string) {
    const settings = await this.getOrCreateSettings(workspaceId);
    if (!settings.twilio_account_sid || !settings.twilio_auth_token || !settings.twilio_from_phone) {
      throw new Error('Twilio is not configured for this workspace');
    }
    return {
      accountSid: settings.twilio_account_sid,
      authToken: settings.twilio_auth_token,
      fromPhone: settings.twilio_from_phone,
    };
  }

  /**
   * Get SendGrid credentials for a workspace.
   */
  async getSendGridCredentials(workspaceId: string) {
    const settings = await this.getOrCreateSettings(workspaceId);
    if (!settings.sendgrid_api_key || !settings.sendgrid_from_email) {
      throw new Error('SendGrid is not configured for this workspace');
    }
    return {
      apiKey: settings.sendgrid_api_key,
      fromEmail: settings.sendgrid_from_email,
      fromName: settings.sendgrid_from_name || 'LeadGenX',
    };
  }
}
