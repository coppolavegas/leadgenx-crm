import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * SendGridValidatorService
 * Validates SendGrid webhook signatures to prevent spoofing.
 * Phase 4.5: AutoGenX Messaging, Compliance & Inbound
 */
@Injectable()
export class SendGridValidatorService {
  private readonly logger = new Logger(SendGridValidatorService.name);

  /**
   * Validate SendGrid webhook signature.
   * @see https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security
   */
  validateSignature(params: {
    publicKey: string;
    signature: string;
    timestamp: string;
    body: string;
  }): boolean {
    try {
      const { publicKey, signature, timestamp, body } = params;

      // Verify timestamp is recent (within 10 minutes)
      const now = Math.floor(Date.now() / 1000);
      const requestTimestamp = parseInt(timestamp, 10);
      if (Math.abs(now - requestTimestamp) > 600) {
        this.logger.warn('SendGrid webhook timestamp too old or in future');
        return false;
      }

      // Construct payload
      const payload = timestamp + body;

      // Verify ECDSA signature
      const verify = crypto.createVerify('sha256');
      verify.update(payload);
      verify.end();

      const decodedSignature = Buffer.from(signature, 'base64');
      const isValid = verify.verify(publicKey, decodedSignature);

      return isValid;
    } catch (error) {
      this.logger.error(`SendGrid signature validation error: ${error.message}`, error.stack);
      return false;
    }
  }
}
