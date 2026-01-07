import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * WebhookValidatorService
 * Validates webhook signatures from Twilio and SendGrid
 */
@Injectable()
export class WebhookValidatorService {
  private readonly logger = new Logger(WebhookValidatorService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Validate Twilio webhook signature
   * https://www.twilio.com/docs/usage/security#validating-requests
   */
  validateTwilioSignature(
    signature: string,
    url: string,
    params: Record<string, any>,
  ): boolean {
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    // In development mode without configured auth token, allow webhooks
    if (!authToken) {
      this.logger.warn(
        'TWILIO_AUTH_TOKEN not configured. Skipping signature validation (DEV MODE ONLY).',
      );
      return true;
    }

    try {
      // Sort params and concatenate
      const data = Object.keys(params)
        .sort()
        .reduce((acc, key) => {
          return acc + key + params[key];
        }, url);

      // Compute HMAC-SHA1
      const expectedSignature = crypto
        .createHmac('sha1', authToken)
        .update(Buffer.from(data, 'utf-8'))
        .digest('base64');

      const isValid = signature === expectedSignature;

      if (!isValid) {
        this.logger.warn('Twilio signature validation failed', {
          expected: expectedSignature,
          received: signature,
        });
      }

      return isValid;
    } catch (error) {
      this.logger.error('Error validating Twilio signature', error);
      return false;
    }
  }

  /**
   * Validate SendGrid Event Webhook signature
   * https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security-features
   */
  validateSendGridSignature(
    signature: string,
    timestamp: string,
    body: string,
  ): boolean {
    const verificationKey = this.configService.get<string>(
      'SENDGRID_WEBHOOK_VERIFICATION_KEY',
    );

    // In development mode without configured key, allow webhooks
    if (!verificationKey) {
      this.logger.warn(
        'SENDGRID_WEBHOOK_VERIFICATION_KEY not configured. Skipping signature validation (DEV MODE ONLY).',
      );
      return true;
    }

    try {
      // Payload = timestamp + body
      const payload = timestamp + body;

      // Compute HMAC-SHA256
      const expectedSignature = crypto
        .createHmac('sha256', verificationKey)
        .update(payload)
        .digest('base64');

      const isValid = signature === expectedSignature;

      if (!isValid) {
        this.logger.warn('SendGrid signature validation failed', {
          expected: expectedSignature,
          received: signature,
        });
      }

      return isValid;
    } catch (error) {
      this.logger.error('Error validating SendGrid signature', error);
      return false;
    }
  }

  /**
   * Validate SendGrid Inbound Parse webhook
   * Uses basic authentication
   */
  validateSendGridInbound(authHeader: string): boolean {
    const expectedUser = this.configService.get<string>(
      'SENDGRID_INBOUND_USERNAME',
    );
    const expectedPass = this.configService.get<string>(
      'SENDGRID_INBOUND_PASSWORD',
    );

    // In development mode without configured auth, allow webhooks
    if (!expectedUser || !expectedPass) {
      this.logger.warn(
        'SendGrid Inbound Parse auth not configured. Skipping validation (DEV MODE ONLY).',
      );
      return true;
    }

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return false;
    }

    try {
      const credentials = Buffer.from(
        authHeader.substring(6),
        'base64',
      ).toString('utf-8');
      const [username, password] = credentials.split(':');

      return username === expectedUser && password === expectedPass;
    } catch (error) {
      this.logger.error('Error validating SendGrid Inbound auth', error);
      return false;
    }
  }
}
