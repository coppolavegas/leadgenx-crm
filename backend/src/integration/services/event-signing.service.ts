import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface XSuiteEvent {
  event_id: string;
  event_name: string;
  event_version: string;
  source_product: string;
  target_product?: string;
  organization_id: string;
  client_id?: string;
  payload: Record<string, any>;
  timestamp: string;
  signature?: string;
}

@Injectable()
export class EventSigningService {
  /**
   * Generate HMAC-SHA256 signature for an event
   */
  signEvent(event: Omit<XSuiteEvent, 'signature'>, secret: string): string {
    // Canonical string: event_id + event_name + timestamp + JSON(payload)
    const canonicalString = [
      event.event_id,
      event.event_name,
      event.timestamp,
      JSON.stringify(event.payload),
    ].join('|');

    // Generate HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(canonicalString);
    return hmac.digest('hex');
  }

  /**
   * Verify event signature
   */
  verifyEvent(event: XSuiteEvent, secret: string): boolean {
    if (!event.signature) {
      return false;
    }

    const expectedSignature = this.signEvent(event, secret);

    // Timing-safe comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(event.signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      // Signatures have different lengths
      return false;
    }
  }

  /**
   * Check if event is not too old (replay attack prevention)
   */
  isEventFresh(timestamp: string, maxAgeMinutes = 5): boolean {
    const eventTime = new Date(timestamp).getTime();
    const now = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    return now - eventTime <= maxAgeMs;
  }

  /**
   * Generate a unique event ID
   */
  generateEventId(): string {
    return `evt_${crypto.randomBytes(16).toString('hex')}`;
  }
}
