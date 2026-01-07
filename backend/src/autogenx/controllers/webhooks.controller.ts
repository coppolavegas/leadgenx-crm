import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  Logger,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { WebhookValidatorService } from '../services/webhook-validator.service';
import { InboundMessageService } from '../services/inbound-message.service';
import {
  TwilioSmsInboundDto,
  TwilioSmsStatusDto,
  SendGridInboundDto,
  SendGridEventDto,
  InboundMessageResponseDto,
  StatusCallbackResponseDto,
} from '../dto/webhook.dto';

/**
 * WebhooksController
 * Handles inbound webhooks from Twilio and SendGrid
 * NO AUTHENTICATION - webhooks come from external services
 */
@ApiTags('AutoGenX - Webhooks (Public)')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhookValidator: WebhookValidatorService,
    private readonly inboundMessageService: InboundMessageService,
  ) {}

  /**
   * Twilio SMS Inbound Webhook
   * Receives incoming SMS messages
   * https://www.twilio.com/docs/sms/twiml#twilios-request-to-your-application
   */
  @Post('sms/inbound')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Twilio SMS inbound webhook (public)' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed',
    type: InboundMessageResponseDto,
  })
  async twilioSmsInbound(
    @Body() body: TwilioSmsInboundDto,
    @Headers('x-twilio-signature') signature: string,
    @Req() req: Request,
  ): Promise<InboundMessageResponseDto> {
    try {
      // Validate Twilio signature
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const isValid = this.webhookValidator.validateTwilioSignature(
        signature,
        url,
        body,
      );

      if (!isValid) {
        this.logger.warn('Invalid Twilio signature', {
          from: body.From,
          to: body.To,
        });
        throw new UnauthorizedException('Invalid webhook signature');
      }

      // Process inbound SMS
      const result = await this.inboundMessageService.processInboundSms({
        from: body.From,
        to: body.To,
        body: body.Body,
        externalId: body.MessageSid,
        receivedAt: new Date(),
        metadata: {
          status: body.SmsStatus,
          accountSid: body.AccountSid,
          numMedia: body.NumMedia,
          fromCity: body.FromCity,
          fromState: body.FromState,
          fromCountry: body.FromCountry,
        },
      });

      return {
        success: true,
        messageId: result.messageId ?? undefined,
        optOutDetected: result.optOutDetected,
      };
    } catch (error) {
      this.logger.error('Failed to process Twilio SMS webhook', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Twilio SMS Status Callback
   * Receives delivery status updates
   */
  @Post('sms/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Twilio SMS status callback (public)' })
  @ApiResponse({
    status: 200,
    description: 'Status updated',
    type: StatusCallbackResponseDto,
  })
  async twilioSmsStatus(
    @Body() body: TwilioSmsStatusDto,
    @Headers('x-twilio-signature') signature: string,
    @Req() req: Request,
  ): Promise<StatusCallbackResponseDto> {
    try {
      // Validate signature
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const isValid = this.webhookValidator.validateTwilioSignature(
        signature,
        url,
        body,
      );

      if (!isValid) {
        this.logger.warn('Invalid Twilio signature for status callback');
        throw new UnauthorizedException('Invalid webhook signature');
      }

      // Map Twilio status to our status
      const statusMap: Record<string, string> = {
        delivered: 'delivered',
        sent: 'sent',
        failed: 'failed',
        undelivered: 'failed',
      };

      const status = statusMap[body.MessageStatus] || body.MessageStatus;

      // Update message
      const result = await this.inboundMessageService.updateMessageStatus({
        externalId: body.MessageSid,
        status,
        deliveredAt:
          body.MessageStatus === 'delivered' ? new Date() : undefined,
        errorMessage: body.ErrorMessage,
        metadata: {
          errorCode: body.ErrorCode,
          twilioStatus: body.MessageStatus,
        },
      });

      return {
        success: true,
        messageId: result.messageId ?? undefined,
        status,
      };
    } catch (error) {
      this.logger.error('Failed to process Twilio status webhook', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * SendGrid Inbound Parse Webhook
   * Receives incoming emails
   * https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook
   */
  @Post('email/inbound')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SendGrid email inbound webhook (public)' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed',
    type: InboundMessageResponseDto,
  })
  async sendGridInbound(
    @Body() body: SendGridInboundDto,
    @Headers('authorization') authHeader: string,
  ): Promise<InboundMessageResponseDto> {
    try {
      // Validate basic auth
      const isValid =
        this.webhookValidator.validateSendGridInbound(authHeader);

      if (!isValid) {
        this.logger.warn('Invalid SendGrid inbound auth');
        throw new UnauthorizedException('Invalid webhook authentication');
      }

      // Extract plain text body (prefer text over html)
      const emailBody = body.text || this.stripHtml(body.html || '');

      // Process inbound email
      const result = await this.inboundMessageService.processInboundEmail({
        from: body.from,
        to: body.to,
        subject: body.subject || '(no subject)',
        body: emailBody,
        receivedAt: new Date(),
        metadata: {
          envelope: body.envelope,
          attachments: body.attachments,
          spf: body.SPF,
          dkim: body.DKIM,
        },
      });

      return {
        success: true,
        messageId: result.messageId ?? undefined,
        optOutDetected: result.optOutDetected,
      };
    } catch (error) {
      this.logger.error('Failed to process SendGrid inbound webhook', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * SendGrid Event Webhook
   * Receives delivery/bounce/spam events
   * https://docs.sendgrid.com/for-developers/tracking-events/event
   */
  @Post('email/events')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SendGrid email events webhook (public)' })
  @ApiResponse({
    status: 200,
    description: 'Events processed',
  })
  async sendGridEvents(
    @Body() events: SendGridEventDto[],
    @Headers('x-twilio-email-event-webhook-signature') signature: string,
    @Headers('x-twilio-email-event-webhook-timestamp') timestamp: string,
    @Req() req: Request,
  ): Promise<{ success: boolean; processed: number }> {
    try {
      // Validate signature
      if (signature && timestamp) {
        const body = JSON.stringify(events);
        const isValid = this.webhookValidator.validateSendGridSignature(
          signature,
          timestamp,
          body,
        );

        if (!isValid) {
          this.logger.warn('Invalid SendGrid event webhook signature');
          throw new UnauthorizedException('Invalid webhook signature');
        }
      }

      let processed = 0;

      // Process each event
      for (const event of events) {
        try {
          // Map SendGrid event to our status
          const statusMap: Record<string, string> = {
            delivered: 'delivered',
            bounce: 'bounced',
            dropped: 'failed',
            deferred: 'pending',
            spam_report: 'complained',
            unsubscribe: 'complained',
          };

          const status = statusMap[event.event] || event.event;

          // Get external ID from sg_message_id or smtp-id
          const externalId =
            event['sg_message_id'] || event['smtp-id'];

          if (!externalId) {
            this.logger.warn('SendGrid event missing message ID', event);
            continue;
          }

          await this.inboundMessageService.updateMessageStatus({
            externalId,
            status,
            deliveredAt: event.event === 'delivered' ? new Date(event.timestamp * 1000) : undefined,
            errorMessage: event.reason || event.response,
            metadata: {
              event: event.event,
              ip: event.ip,
              useragent: event.useragent,
            },
          });

          processed++;
        } catch (error) {
          this.logger.error('Failed to process SendGrid event', {
            event,
            error,
          });
        }
      }

      return { success: true, processed };
    } catch (error) {
      this.logger.error('Failed to process SendGrid events webhook', error);
      return { success: false, processed: 0 };
    }
  }

  /**
   * Strip HTML tags from email body
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp;
      .replace(/&amp;/g, '&') // Replace &amp;
      .replace(/&lt;/g, '<') // Replace &lt;
      .replace(/&gt;/g, '>') // Replace &gt;
      .replace(/&quot;/g, '"') // Replace &quot;
      .trim();
  }
}
