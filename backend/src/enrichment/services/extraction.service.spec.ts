import { Test, TestingModule } from '@nestjs/testing';
import { ExtractionService } from './extraction.service';

describe('ExtractionService', () => {
  let service: ExtractionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExtractionService],
    }).compile();

    service = module.get<ExtractionService>(ExtractionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mailto: link extraction', () => {
    it('should extract emails from mailto: links', () => {
      const html = `
        <html>
          <body>
            <p>Contact us at <a href="mailto:info@business.com">info@business.com</a></p>
            <p>Sales: <a href="mailto:sales@business.com">Contact Sales</a></p>
          </body>
        </html>
      `;

      const result = service.extractFromPage(html, 'https://business.com/contact', false);

      expect(result.emails).toHaveLength(2);
      expect(result.emails[0].email).toBe('info@business.com');
      expect(result.emails[0].method).toBe('mailto');
      expect(result.emails[0].confidence).toBe('high');
      expect(result.emails[1].email).toBe('sales@business.com');
      expect(result.emails[1].method).toBe('mailto');
    });

    it('should filter out generic emails from mailto: links', () => {
      const html = `
        <html>
          <body>
            <a href="mailto:noreply@business.com">No Reply</a>
            <a href="mailto:info@example.com">Example</a>
            <a href="mailto:real@business.com">Real Contact</a>
          </body>
        </html>
      `;

      const result = service.extractFromPage(html, 'https://business.com', false);

      expect(result.emails).toHaveLength(1);
      expect(result.emails[0].email).toBe('real@business.com');
    });
  });

  describe('tel: link extraction', () => {
    it('should extract phones from tel: links', () => {
      const html = `
        <html>
          <body>
            <p>Call us: <a href="tel:+14155551234">Call Now</a></p>
            <p>Support: <a href="tel:415-555-5678">415-555-5678</a></p>
          </body>
        </html>
      `;

      const result = service.extractFromPage(html, 'https://business.com/contact', false);

      expect(result.phones).toHaveLength(2);
      expect(result.phones[0].normalizedPhone).toBe('+14155551234');
      expect(result.phones[0].method).toBe('tel');
      expect(result.phones[0].confidence).toBe('high');
      expect(result.phones[1].normalizedPhone).toBe('+14155555678');
    });

    it('should normalize various phone formats', () => {
      const html = `
        <html>
          <body>
            <a href="tel:(555) 123-4567">Call 1</a>
            <a href="tel:555.123.4567">Call 2</a>
            <a href="tel:5551234567">Call 3</a>
          </body>
        </html>
      `;

      const result = service.extractFromPage(html, 'https://business.com', false);

      expect(result.phones.length).toBeGreaterThan(0);
      // All should be normalized to E.164 format
      result.phones.forEach((phone) => {
        expect(phone.normalizedPhone).toMatch(/^\+1\d{10}$/);
      });
    });
  });

  describe('JSON-LD extraction', () => {
    it('should extract contact info from JSON-LD Organization schema', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Business Inc",
                "email": "contact@business.com",
                "telephone": "+1-415-555-1234",
                "sameAs": [
                  "https://facebook.com/business",
                  "https://twitter.com/business"
                ]
              }
            </script>
          </head>
          <body></body>
        </html>
      `;

      const result = service.extractFromPage(html, 'https://business.com', true);

      // Should find email from JSON-LD
      const jsonldEmail = result.emails.find((e) => e.method === 'jsonld');
      expect(jsonldEmail).toBeDefined();
      expect(jsonldEmail?.email).toBe('contact@business.com');
      expect(jsonldEmail?.confidence).toBe('high');

      // Should find phone from JSON-LD
      const jsonldPhone = result.phones.find((p) => p.method === 'jsonld');
      expect(jsonldPhone).toBeDefined();
      expect(jsonldPhone?.normalizedPhone).toBe('+14155551234');

      // Should extract social links
      expect(result.socialLinks.facebook).toBe('https://facebook.com/business');
      expect(result.socialLinks.twitter).toBe('https://twitter.com/business');
    });

    it('should extract from LocalBusiness schema', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                "name": "Pizza Place",
                "email": "orders@pizza.com",
                "telephone": "555-123-4567"
              }
            </script>
          </head>
          <body></body>
        </html>
      `;

      const result = service.extractFromPage(html, 'https://pizza.com', true);

      const jsonldEmail = result.emails.find((e) => e.method === 'jsonld');
      expect(jsonldEmail?.email).toBe('orders@pizza.com');
    });

    it('should not extract JSON-LD when advanced mode is disabled', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "email": "contact@business.com"
              }
            </script>
          </head>
          <body></body>
        </html>
      `;

      const result = service.extractFromPage(html, 'https://business.com', false);

      const jsonldEmails = result.emails.filter((e) => e.method === 'jsonld');
      expect(jsonldEmails).toHaveLength(0);
    });
  });

  describe('Email deduplication', () => {
    it('should deduplicate emails and keep highest confidence', () => {
      const emails = [
        {
          email: 'contact@business.com',
          pageUrl: 'https://business.com',
          snippet: 'Email us',
          confidence: 'medium' as const,
          method: 'regex' as const,
        },
        {
          email: 'contact@business.com',
          pageUrl: 'https://business.com/contact',
          snippet: 'Contact form',
          confidence: 'high' as const,
          method: 'mailto' as const,
        },
        {
          email: 'sales@business.com',
          pageUrl: 'https://business.com',
          snippet: 'Sales team',
          confidence: 'low' as const,
          method: 'regex' as const,
        },
      ];

      const deduplicated = service.deduplicateEmails(emails);

      expect(deduplicated).toHaveLength(2);
      const contactEmail = deduplicated.find((e) => e.email === 'contact@business.com');
      expect(contactEmail?.confidence).toBe('high');
      expect(contactEmail?.method).toBe('mailto');
    });

    it('should remove duplicate emails completely', () => {
      const emails = [
        {
          email: 'test@business.com',
          pageUrl: 'https://business.com/page1',
          snippet: 'Test 1',
          confidence: 'medium' as const,
          method: 'regex' as const,
        },
        {
          email: 'test@business.com',
          pageUrl: 'https://business.com/page2',
          snippet: 'Test 2',
          confidence: 'medium' as const,
          method: 'regex' as const,
        },
        {
          email: 'test@business.com',
          pageUrl: 'https://business.com/page3',
          snippet: 'Test 3',
          confidence: 'low' as const,
          method: 'regex' as const,
        },
      ];

      const deduplicated = service.deduplicateEmails(emails);

      expect(deduplicated).toHaveLength(1);
      expect(deduplicated[0].email).toBe('test@business.com');
    });
  });

  describe('Phone deduplication', () => {
    it('should deduplicate phones by normalized format', () => {
      const phones = [
        {
          rawPhone: '(415) 555-1234',
          normalizedPhone: '+14155551234',
          pageUrl: 'https://business.com',
          snippet: 'Call us',
          confidence: 'medium' as const,
          method: 'regex' as const,
        },
        {
          rawPhone: '415-555-1234',
          normalizedPhone: '+14155551234',
          pageUrl: 'https://business.com/contact',
          snippet: 'Contact',
          confidence: 'high' as const,
          method: 'tel' as const,
        },
        {
          rawPhone: '+1-415-555-5678',
          normalizedPhone: '+14155555678',
          pageUrl: 'https://business.com',
          snippet: 'Support',
          confidence: 'medium' as const,
          method: 'regex' as const,
        },
      ];

      const deduplicated = service.deduplicatePhones(phones);

      expect(deduplicated).toHaveLength(2);
      const firstPhone = deduplicated.find((p) => p.normalizedPhone === '+14155551234');
      expect(firstPhone?.confidence).toBe('high');
      expect(firstPhone?.method).toBe('tel');
    });
  });

  describe('Regex extraction', () => {
    it('should extract emails from text content', () => {
      const html = `
        <html>
          <body>
            <p>For inquiries, email us at contact@business.com or call.</p>
            <p>Sales: sales@business.com</p>
          </body>
        </html>
      `;

      const result = service.extractFromPage(html, 'https://business.com', false);

      expect(result.emails.length).toBeGreaterThanOrEqual(2);
      const emails = result.emails.map((e) => e.email);
      expect(emails).toContain('contact@business.com');
      expect(emails).toContain('sales@business.com');
    });

    it('should score email confidence based on context', () => {
      const html = `
        <html>
          <body>
            <p>Contact us at contact@business.com for any inquiries.</p>
            <p>Random text with random@somewhere.com mentioned.</p>
          </body>
        </html>
      `;

      const result = service.extractFromPage(html, 'https://business.com', false);

      const contactEmail = result.emails.find((e) => e.email === 'contact@business.com');
      const randomEmail = result.emails.find((e) => e.email === 'random@somewhere.com');

      expect(contactEmail?.confidence).toBe('high'); // Has "contact" and "inquiries" keywords
      expect(randomEmail?.confidence).toBe('low'); // No context keywords
    });
  });

  describe('Social link extraction', () => {
    it('should extract all social media links', () => {
      const html = `
        <html>
          <body>
            <footer>
              <a href="https://facebook.com/businesspage">Facebook</a>
              <a href="https://instagram.com/businessinsta">Instagram</a>
              <a href="https://twitter.com/businesstweet">Twitter</a>
              <a href="https://linkedin.com/company/business">LinkedIn</a>
              <a href="https://youtube.com/businesschannel">YouTube</a>
              <a href="https://tiktok.com/@business">TikTok</a>
            </footer>
          </body>
        </html>
      `;

      const result = service.extractFromPage(html, 'https://business.com', false);

      expect(result.socialLinks.facebook).toBeDefined();
      expect(result.socialLinks.instagram).toBeDefined();
      expect(result.socialLinks.twitter).toBeDefined();
      expect(result.socialLinks.linkedin).toBeDefined();
      expect(result.socialLinks.youtube).toBeDefined();
      expect(result.socialLinks.tiktok).toBeDefined();
    });
  });

  describe('Contact page detection', () => {
    it('should detect contact pages by URL', () => {
      const html = '<html><body><p>Some content</p></body></html>';

      const result1 = service.extractFromPage(html, 'https://business.com/contact', false);
      expect(result1.isContactPage).toBe(true);

      const result2 = service.extractFromPage(html, 'https://business.com/contact-us', false);
      expect(result2.isContactPage).toBe(true);

      const result3 = service.extractFromPage(html, 'https://business.com/book', false);
      expect(result3.isContactPage).toBe(true);

      const result4 = service.extractFromPage(html, 'https://business.com/about', false);
      expect(result4.isContactPage).toBe(false);
    });

    it('should detect contact pages by content', () => {
      const html = `
        <html>
          <body>
            <h1>Get in Touch</h1>
            <p>Fill out our contact form below.</p>
          </body>
        </html>
      `;

      const result = service.extractFromPage(html, 'https://business.com/page', false);
      expect(result.isContactPage).toBe(true);
    });
  });
});
