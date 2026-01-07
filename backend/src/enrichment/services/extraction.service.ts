import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { parsePhoneNumber } from 'libphonenumber-js';
import {
  ExtractionResult,
  EmailExtraction,
  PhoneExtraction,
  SocialLinks,
  AddressExtraction,
  ContactFormExtraction,
  JsonLdOrganization,
} from '../interfaces/extraction.interface';

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  /**
   * Extract all information from a page
   */
  extractFromPage(html: string, pageUrl: string, advancedMode: boolean): ExtractionResult {
    const $ = cheerio.load(html);
    const text = $('body').text();

    // Extract using different methods
    const mailtoEmails = this.extractMailtoLinks($, pageUrl);
    const telPhones = this.extractTelLinks($, pageUrl);
    const regexEmails = this.extractEmailsFromText(text, pageUrl);
    const regexPhones = this.extractPhonesFromText(text, pageUrl);
    const socialLinks = this.extractSocialLinks($);
    const addresses = this.extractAddresses(text, pageUrl);
    const contactForms = advancedMode ? this.extractContactForms($, pageUrl) : [];

    // Extract from JSON-LD if advanced mode enabled
    let jsonLdEmails: EmailExtraction[] = [];
    let jsonLdPhones: PhoneExtraction[] = [];
    let jsonLdSocial: SocialLinks = {};

    if (advancedMode) {
      const jsonLdData = this.extractJsonLd($);
      if (jsonLdData) {
        if (jsonLdData.email) {
          jsonLdEmails.push({
            email: jsonLdData.email,
            pageUrl,
            snippet: `Found in JSON-LD schema: ${jsonLdData.email}`,
            confidence: 'high',
            method: 'jsonld',
          });
        }
        if (jsonLdData.telephone) {
          const normalized = this.normalizePhone(jsonLdData.telephone);
          if (normalized) {
            jsonLdPhones.push({
              rawPhone: jsonLdData.telephone,
              normalizedPhone: normalized,
              pageUrl,
              snippet: `Found in JSON-LD schema: ${jsonLdData.telephone}`,
              confidence: 'high',
              method: 'jsonld',
            });
          }
        }
        if (jsonLdData.sameAs) {
          jsonLdSocial = this.extractSocialFromUrls(jsonLdData.sameAs);
        }
      }
    }

    // Merge social links
    const mergedSocial = { ...socialLinks, ...jsonLdSocial };

    // Check if this is a contact page
    const isContactPage = this.isContactPage(pageUrl, text);

    return {
      emails: [...mailtoEmails, ...jsonLdEmails, ...regexEmails],
      phones: [...telPhones, ...jsonLdPhones, ...regexPhones],
      socialLinks: mergedSocial,
      addresses,
      contactForms,
      isContactPage,
    };
  }

  /**
   * Extract emails from mailto: links (HIGH confidence)
   */
  private extractMailtoLinks($: cheerio.CheerioAPI, pageUrl: string): EmailExtraction[] {
    const emails: EmailExtraction[] = [];
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const email = href.replace('mailto:', '').split('?')[0].toLowerCase().trim();
        if (this.isValidEmail(email) && !this.isGenericEmail(email)) {
          const context = $(el).parent().text().trim();
          const snippet = context.substring(0, 100);
          emails.push({
            email,
            pageUrl,
            snippet,
            confidence: 'high',
            method: 'mailto',
          });
        }
      }
    });
    return emails;
  }

  /**
   * Extract phones from tel: links (HIGH confidence)
   */
  private extractTelLinks($: cheerio.CheerioAPI, pageUrl: string): PhoneExtraction[] {
    const phones: PhoneExtraction[] = [];
    $('a[href^="tel:"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const rawPhone = href.replace('tel:', '').trim();
        const normalized = this.normalizePhone(rawPhone);
        if (normalized) {
          const context = $(el).parent().text().trim();
          const snippet = context.substring(0, 100);
          phones.push({
            rawPhone,
            normalizedPhone: normalized,
            pageUrl,
            snippet,
            confidence: 'high',
            method: 'tel',
          });
        }
      }
    });
    return phones;
  }

  /**
   * Extract emails from text using regex
   */
  private extractEmailsFromText(text: string, pageUrl: string): EmailExtraction[] {
    const emails: EmailExtraction[] = [];
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    let match;

    while ((match = emailPattern.exec(text)) !== null) {
      const email = match[0].toLowerCase();
      if (this.isValidEmail(email) && !this.isGenericEmail(email)) {
        const start = Math.max(0, match.index - 50);
        const end = Math.min(text.length, match.index + match[0].length + 50);
        const snippet = text.substring(start, end).trim();
        const confidence = this.scoreEmailConfidence(email, snippet);

        emails.push({
          email,
          pageUrl,
          snippet,
          confidence,
          method: 'regex',
        });
      }
    }

    return emails;
  }

  /**
   * Extract phones from text using regex
   */
  private extractPhonesFromText(text: string, pageUrl: string): PhoneExtraction[] {
    const phones: PhoneExtraction[] = [];
    const patterns = [
      /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // (555) 123-4567
      /\+1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, // +1-555-123-4567
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const rawPhone = match[0];
        const normalized = this.normalizePhone(rawPhone);

        if (normalized && this.isValidPhone(normalized)) {
          const start = Math.max(0, match.index - 50);
          const end = Math.min(text.length, match.index + match[0].length + 50);
          const snippet = text.substring(start, end).trim();
          const confidence = this.scorePhoneConfidence(snippet);

          phones.push({
            rawPhone,
            normalizedPhone: normalized,
            pageUrl,
            snippet,
            confidence,
            method: 'regex',
          });
        }
      }
    }

    return phones;
  }

  /**
   * Extract social media links
   */
  private extractSocialLinks($: cheerio.CheerioAPI): SocialLinks {
    const social: SocialLinks = {};

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')?.toLowerCase() || '';

      if (href.includes('facebook.com') && !social.facebook) {
        social.facebook = $(el).attr('href');
      } else if (href.includes('instagram.com') && !social.instagram) {
        social.instagram = $(el).attr('href');
      } else if ((href.includes('twitter.com') || href.includes('x.com')) && !social.twitter) {
        social.twitter = $(el).attr('href');
      } else if (href.includes('linkedin.com') && !social.linkedin) {
        social.linkedin = $(el).attr('href');
      } else if (href.includes('youtube.com') && !social.youtube) {
        social.youtube = $(el).attr('href');
      } else if (href.includes('tiktok.com') && !social.tiktok) {
        social.tiktok = $(el).attr('href');
      }
    });

    return social;
  }

  /**
   * Extract social links from URL array (JSON-LD)
   */
  private extractSocialFromUrls(urls: string[]): SocialLinks {
    const social: SocialLinks = {};

    for (const url of urls) {
      const lower = url.toLowerCase();
      if (lower.includes('facebook.com') && !social.facebook) {
        social.facebook = url;
      } else if (lower.includes('instagram.com') && !social.instagram) {
        social.instagram = url;
      } else if ((lower.includes('twitter.com') || lower.includes('x.com')) && !social.twitter) {
        social.twitter = url;
      } else if (lower.includes('linkedin.com') && !social.linkedin) {
        social.linkedin = url;
      } else if (lower.includes('youtube.com') && !social.youtube) {
        social.youtube = url;
      } else if (lower.includes('tiktok.com') && !social.tiktok) {
        social.tiktok = url;
      }
    }

    return social;
  }

  /**
   * Extract physical addresses
   */
  private extractAddresses(text: string, pageUrl: string): AddressExtraction[] {
    const addresses: AddressExtraction[] = [];
    const addressPattern =
      /\d+\s+[A-Za-z0-9\s,.-]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way)\s*,?\s*[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?/gi;

    let match;
    while ((match = addressPattern.exec(text)) !== null) {
      const fullAddress = match[0].trim();
      const start = Math.max(0, match.index - 30);
      const end = Math.min(text.length, match.index + match[0].length + 30);
      const snippet = text.substring(start, end).trim();

      addresses.push({
        fullAddress,
        pageUrl,
        snippet,
        parsed: this.parseAddress(fullAddress),
      });
    }

    return addresses;
  }

  /**
   * Extract contact forms
   */
  private extractContactForms($: cheerio.CheerioAPI, pageUrl: string): ContactFormExtraction[] {
    const forms: ContactFormExtraction[] = [];

    $('form').each((_, formEl) => {
      const form = $(formEl);
      const hasEmailField =
        form.find('input[type="email"]').length > 0 ||
        form.find('input[name*="email" i]').length > 0;
      const hasMessageField =
        form.find('textarea').length > 0 ||
        form.find('input[name*="message" i]').length > 0;

      if (hasEmailField || hasMessageField) {
        const action = form.attr('action') || pageUrl;
        const formUrl = this.resolveUrl(pageUrl, action);

        forms.push({
          formUrl,
          pageUrl,
          hasEmailField,
          hasMessageField,
        });
      }
    });

    return forms;
  }

  /**
   * Extract JSON-LD Organization schema
   */
  private extractJsonLd($: cheerio.CheerioAPI): JsonLdOrganization | null {
    try {
      const scripts = $('script[type="application/ld+json"]');
      for (let i = 0; i < scripts.length; i++) {
        const scriptContent = $(scripts[i]).html();
        if (scriptContent) {
          const jsonData = JSON.parse(scriptContent);
          const org = this.findOrganizationSchema(jsonData);
          if (org) return org;
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to parse JSON-LD: ${error.message}`);
    }
    return null;
  }

  /**
   * Recursively find Organization schema in JSON-LD
   */
  private findOrganizationSchema(data: any): JsonLdOrganization | null {
    if (!data) return null;

    if (data['@type'] === 'Organization' || data['@type'] === 'LocalBusiness') {
      return data;
    }

    if (Array.isArray(data)) {
      for (const item of data) {
        const result = this.findOrganizationSchema(item);
        if (result) return result;
      }
    }

    if (typeof data === 'object') {
      for (const key in data) {
        const result = this.findOrganizationSchema(data[key]);
        if (result) return result;
      }
    }

    return null;
  }

  /**
   * Normalize phone number to E.164 format
   */
  private normalizePhone(phone: string): string | null {
    try {
      const parsed = parsePhoneNumber(phone, 'US');
      if (parsed && parsed.isValid()) {
        return parsed.format('E.164');
      }
    } catch (error) {
      // Invalid phone, return null
    }
    return null;
  }

  /**
   * Validate phone number
   */
  private isValidPhone(phone: string): boolean {
    return /^\+1\d{10}$/.test(phone);
  }

  /**
   * Validate email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if email is generic/fake
   */
  private isGenericEmail(email: string): boolean {
    const genericPatterns = [
      'example.com',
      'test.com',
      'demo.com',
      'yourdomain.com',
      'yoursite.com',
      'noreply@',
      'no-reply@',
      'donotreply@',
    ];
    return genericPatterns.some((pattern) => email.includes(pattern));
  }

  /**
   * Score email confidence based on context
   */
  private scoreEmailConfidence(email: string, context: string): 'high' | 'medium' | 'low' {
    const contextLower = context.toLowerCase();
    const highKeywords = ['contact', 'email us', 'reach us', 'get in touch', 'inquiries', 'support'];

    if (highKeywords.some((kw) => contextLower.includes(kw))) {
      return 'high';
    }

    if (context.length < 200 && context.includes('@')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Score phone confidence based on context
   */
  private scorePhoneConfidence(context: string): 'high' | 'medium' | 'low' {
    const contextLower = context.toLowerCase();
    const highKeywords = ['call', 'phone', 'tel:', 'telephone', 'contact', 'reach us'];

    if (highKeywords.some((kw) => contextLower.includes(kw))) {
      return 'high';
    }

    return 'medium';
  }

  /**
   * Parse address into components
   */
  private parseAddress(address: string): { street?: string; city?: string; state?: string; zip?: string } {
    const parts = address.split(',').map((p) => p.trim());
    const stateZipMatch = parts[parts.length - 1]?.match(/([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);

    return {
      street: parts[0] || undefined,
      city: parts.length > 2 ? parts[parts.length - 2] : undefined,
      state: stateZipMatch?.[1] || undefined,
      zip: stateZipMatch?.[2] || undefined,
    };
  }

  /**
   * Check if page is a contact page
   */
  private isContactPage(url: string, text: string): boolean {
    const urlLower = url.toLowerCase();
    const contactKeywords = ['contact', 'book', 'booking', 'appointment', 'reach-us', 'get-in-touch'];

    if (contactKeywords.some((kw) => urlLower.includes(kw))) {
      return true;
    }

    const textLower = text.toLowerCase();
    const contentKeywords = ['contact form', 'send us a message', 'get in touch'];
    if (contentKeywords.some((kw) => textLower.includes(kw))) {
      return true;
    }

    return false;
  }

  /**
   * Resolve relative URL to absolute
   */
  private resolveUrl(baseUrl: string, relativeUrl: string): string {
    try {
      return new URL(relativeUrl, baseUrl).href;
    } catch {
      return relativeUrl;
    }
  }

  /**
   * Deduplicate emails
   */
  deduplicateEmails(emails: EmailExtraction[]): EmailExtraction[] {
    const seen = new Map<string, EmailExtraction>();

    for (const emailEvidence of emails) {
      const existing = seen.get(emailEvidence.email);
      if (!existing || emailEvidence.confidence === 'high') {
        seen.set(emailEvidence.email, emailEvidence);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Deduplicate phones
   */
  deduplicatePhones(phones: PhoneExtraction[]): PhoneExtraction[] {
    const seen = new Map<string, PhoneExtraction>();

    for (const phoneEvidence of phones) {
      const existing = seen.get(phoneEvidence.normalizedPhone);
      if (!existing || phoneEvidence.confidence === 'high') {
        seen.set(phoneEvidence.normalizedPhone, phoneEvidence);
      }
    }

    return Array.from(seen.values());
  }
}
