import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagingSettingsService } from './messaging-settings.service';
import { RateLimitService } from './rate-limit.service';
import { Worker } from 'bullmq';

/**
 * MessagingWorkerService
 * Background worker that processes queued messages and sends them via Twilio/SendGrid.
 * Phase 4.5: AutoGenX Messaging, Compliance & Inbound
 */
@Injectable()
export class MessagingWorkerService implements OnModuleInit {
  private readonly logger = new Logger(MessagingWorkerService.name);
  private worker: Worker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: MessagingSettingsService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  onModuleInit() {
    // Initialize BullMQ worker
    this.worker = new Worker(
      'autogenx-messages',
      async (job) => {
        await this.processMessage(job.data.messageId);
      },
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD,
        },
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job?.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id || 'unknown'} failed: ${err.message}`, err.stack);
    });

    this.logger.log('Messaging worker initialized');
  }

  /**
   * Process a message: fetch from DB, send via provider, update status.
   */
  async processMessage(messageId: string): Promise<void> {
    this.logger.log(`Processing message ${messageId}`);

    const message = await this.prisma.automation_message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    if (message.status !== 'pending') {
      this.logger.warn(`Message ${messageId} is not pending (status: ${message.status}), skipping`);
      return;
    }

    try {
      // Update status to 'queued'
      await this.prisma.automation_message.update({
        where: { id: messageId },
        data: { status: 'queued' },
      });

      // Send via appropriate provider
      if (message.channel === 'sms') {
        await this.sendSms(message);
      } else if (message.channel === 'email') {
        await this.sendEmail(message);
      } else {
        throw new Error(`Unknown channel: ${message.channel}`);
      }

      // Increment usage counter
      await this.rateLimitService.incrementUsage(message.workspace_id, message.channel as 'sms' | 'email');

      this.logger.log(`Message ${messageId} sent successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to send message ${messageId}: ${error.message}`,
        error.stack,
      );

      // Update message status to 'failed'
      await this.prisma.automation_message.update({
        where: { id: messageId },
        data: {
          status: 'failed',
          error_message: error.message,
        },
      });

      throw error; // Re-throw to mark job as failed
    }
  }

  /**
   * Send SMS via Twilio.
   */
  private async sendSms(message: any): Promise<void> {
    const credentials = await this.settingsService.getTwilioCredentials(message.workspace_id);

    // TODO: Install @twilio/sdk if not already installed
    // For now, use HTTP API directly
    const accountSid = credentials.accountSid;
    const authToken = credentials.authToken;
    const fromPhone = credentials.fromPhone;
    const toPhone = message.to_phone;
    const body = message.body;

    this.logger.log(`Sending SMS to ${toPhone} via Twilio`);

    // Make HTTP request to Twilio API
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        },
        body: new URLSearchParams({
          To: toPhone,
          From: fromPhone,
          Body: body,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twilio API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const messageSid = result.sid;

    // Update message with external ID and status
    await this.prisma.automation_message.update({
      where: { id: message.id },
      data: {
        status: 'sent',
        external_id: messageSid,
        from_phone: fromPhone,
        sent_at: new Date(),
      },
    });

    this.logger.log(`SMS sent successfully (Twilio SID: ${messageSid})`);
  }

  /**
   * Send Email via SendGrid.
   */
  private async sendEmail(message: any): Promise<void> {
    const credentials = await this.settingsService.getSendGridCredentials(message.workspace_id);

    const apiKey = credentials.apiKey;
    const fromEmail = credentials.fromEmail;
    const fromName = credentials.fromName;
    const toEmail = message.to_email;
    const subject = message.subject || 'Message from LeadGenX';
    const body = message.body;

    this.logger.log(`Sending email to ${toEmail} via SendGrid`);

    // Make HTTP request to SendGrid API
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: toEmail }],
          },
        ],
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject: subject,
        content: [
          {
            type: 'text/plain',
            value: body,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SendGrid API error: ${response.status} ${errorText}`);
    }

    // SendGrid returns 202 with no body on success
    const messageId = response.headers.get('x-message-id') || message.id;

    // Update message with external ID and status
    await this.prisma.automation_message.update({
      where: { id: message.id },
      data: {
        status: 'sent',
        external_id: messageId,
        from_email: fromEmail,
        sent_at: new Date(),
      },
    });

    this.logger.log(`Email sent successfully (Message ID: ${messageId})`);
  }
}
