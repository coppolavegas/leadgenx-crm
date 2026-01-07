import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * TwilioValidatorService
 * Validates Twilio webhook signatures to prevent spoofing.
 * Phase 4.5: AutoGenX Messaging, Compliance & Inbound
 */
@Injectable()
export class TwilioValidatorService {
  private readonly logger = new Logger(TwilioValidatorService.name);

  /**
   * Validate Twilio webhook signature.
   * @see https://www.twilio.com/docs/usage/webhooks/webhooks-security
   */
  validateSignature(params: {
    url: string;
    signature: string;
    authToken: string;
    body: Record<string, any>;
  }): boolean {
    try {
      const { url, signature, authToken, body } = params;

      // Build data string from URL + sorted body params
      let data = url;
      const sortedKeys = Object.keys(body).sort();
      for (const key of sortedKeys) {
        data += key + body[key];
      }

      // Compute HMAC-SHA1
      const expectedSignature = crypto
        .createHmac('sha1', authToken)
        .update(Buffer.from(data, 'utf-8'))
        .digest('base64');

      // Constant-time comparison
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      this.logger.error(`Twilio signature validation error: ${error.message}`, error.stack);
      return false;
    }
  }
}
