import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerService } from './crawler.service';
import { ExtractionService } from './extraction.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CrawlerService - Bot Detection', () => {
  let service: CrawlerService;
  let extractionService: ExtractionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrawlerService,
        ExtractionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                ENRICHMENT_MAX_DEPTH: 2,
                ENRICHMENT_MAX_PAGES: 15,
                ENRICHMENT_TIMEOUT_MS: 30000,
                ENRICHMENT_RESPECT_ROBOTS: true,
                ADVANCED_EXTRACTION_ENABLED: false,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CrawlerService>(CrawlerService);
    extractionService = module.get<ExtractionService>(ExtractionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Bot detection and fallback', () => {
    it('should detect 403 forbidden as bot blocking', async () => {
      mockedAxios.head.mockRejectedValue({
        response: { status: 403 },
      });

      mockedAxios.get.mockResolvedValue({
        data: '<html><body><p>Homepage content</p><a href="mailto:info@site.com">Contact</a></body></html>',
      });

      const result = await service.crawlWebsite('https://blocked-site.com', 'Test Business');

      expect(result.botDetected).toBe(true);
      expect(result.fallbackUsed).toBe(true);
      expect(result.pagesCrawled).toBe(1); // Only homepage
      expect(result.logs).toContain('Bot detection triggered - using fallback mode');
    });

    it('should detect 429 rate limit as bot blocking', async () => {
      mockedAxios.head.mockRejectedValue({
        response: { status: 429 },
      });

      mockedAxios.get.mockResolvedValue({
        data: '<html><body><p>Homepage</p></body></html>',
      });

      const result = await service.crawlWebsite('https://rate-limited.com', 'Test Business');

      expect(result.botDetected).toBe(true);
      expect(result.fallbackUsed).toBe(true);
      expect(result.pagesCrawled).toBe(1);
    });

    it('should extract data from homepage in fallback mode', async () => {
      mockedAxios.head.mockRejectedValue({
        response: { status: 403 },
      });

      const homepageHtml = `
        <html>
          <body>
            <p>Contact us at <a href="mailto:contact@business.com">contact@business.com</a></p>
            <p>Call: <a href="tel:+14155551234">415-555-1234</a></p>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({
        data: homepageHtml,
      });

      const result = await service.crawlWebsite('https://blocked.com', 'Test Business');

      expect(result.botDetected).toBe(true);
      expect(result.fallbackUsed).toBe(true);
      expect(result.results.size).toBe(1);

      const extraction = result.results.get('https://blocked.com');
      expect(extraction).toBeDefined();
      expect(extraction!.emails.length).toBeGreaterThan(0);
      expect(extraction!.phones.length).toBeGreaterThan(0);
    });

    it('should proceed with full crawl when no bot blocking detected', async () => {
      mockedAxios.head.mockResolvedValue({
        status: 200,
        data: '',
      });

      mockedAxios.get.mockResolvedValue({
        data: '<html><body><p>Homepage</p></body></html>',
      });

      const result = await service.crawlWebsite('https://accessible-site.com', 'Test Business');

      expect(result.botDetected).toBe(false);
      expect(result.fallbackUsed).toBe(false);
      expect(result.logs).toContain('Full crawl mode activated');
    });
  });

  describe('Circuit breaker', () => {
    it('should open circuit after 3 consecutive failures', async () => {
      mockedAxios.head.mockResolvedValue({
        status: 200,
        data: '',
      });

      // First 3 requests fail
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const result = await service.crawlWebsite('https://failing-site.com', 'Test Business');

      expect(result.logs).toContain('Circuit breaker triggered: 3 consecutive failures');
    });
  });
});
