import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import robotsParser from 'robots-parser';
import { ExtractionService } from './extraction.service';
import { ExtractionResult } from '../interfaces/extraction.interface';
import { ConfigService } from '@nestjs/config';

interface CrawlConfig {
  maxDepth: number;
  maxPages: number;
  timeoutMs: number;
  respectRobots: boolean;
  advancedMode: boolean;
}

interface CrawlResult {
  results: Map<string, ExtractionResult>;
  pagesCrawled: number;
  botDetected: boolean;
  fallbackUsed: boolean;
  logs: string[];
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly domainRateLimiters = new Map<string, number>();
  private readonly circuitBreakers = new Map<string, { failures: number; lastFailure: number }>();

  constructor(
    private readonly extractionService: ExtractionService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Crawl a website starting from the base URL
   */
  async crawlWebsite(
    baseUrl: string,
    leadName: string,
    config?: Partial<CrawlConfig>,
  ): Promise<CrawlResult> {
    const crawlConfig = this.getCrawlConfig(config);
    const logs: string[] = [];
    const startTime = Date.now();

    logs.push(`Starting crawl for ${baseUrl}`);

    // Check circuit breaker
    if (this.isCircuitOpen(baseUrl)) {
      logs.push('Circuit breaker open - aborting crawl');
      return {
        results: new Map(),
        pagesCrawled: 0,
        botDetected: false,
        fallbackUsed: false,
        logs,
      };
    }

    // Test reachability
    const { isAccessible, botBlocked } = await this.testReachability(baseUrl);

    if (botBlocked) {
      logs.push('Bot detection triggered - using fallback mode');
      return await this.fallbackCrawl(baseUrl, crawlConfig, logs);
    }

    if (!isAccessible) {
      logs.push('Website unreachable');
      this.recordFailure(baseUrl);
      return {
        results: new Map(),
        pagesCrawled: 0,
        botDetected: false,
        fallbackUsed: false,
        logs,
      };
    }

    // Check robots.txt
    if (crawlConfig.respectRobots) {
      const robotsAllowed = await this.checkRobotsTxt(baseUrl);
      if (!robotsAllowed) {
        logs.push('Crawling disallowed by robots.txt');
        return {
          results: new Map(),
          pagesCrawled: 0,
          botDetected: false,
          fallbackUsed: false,
          logs,
        };
      }
    }

    // Full crawl
    logs.push('Full crawl mode activated');
    const result = await this.fullCrawl(baseUrl, crawlConfig, logs, startTime);

    // Reset circuit breaker on success
    this.resetCircuitBreaker(baseUrl);

    return result;
  }

  /**
   * Full crawl with multiple pages
   */
  private async fullCrawl(
    baseUrl: string,
    config: CrawlConfig,
    logs: string[],
    startTime: number,
  ): Promise<CrawlResult> {
    const urlQueue = this.buildPriorityQueue(baseUrl);
    const visited = new Set<string>();
    const results = new Map<string, ExtractionResult>();
    let pagesCrawled = 0;
    let consecutiveFailures = 0;

    while (urlQueue.length > 0 && pagesCrawled < config.maxPages) {
      // Check timeout
      if (Date.now() - startTime > config.timeoutMs) {
        logs.push('Crawl timeout reached');
        break;
      }

      const { url, depth } = urlQueue.shift()!;

      if (visited.has(url) || depth > config.maxDepth) {
        continue;
      }

      visited.add(url);

      // Rate limit
      await this.rateLimit(baseUrl);

      // Fetch page
      try {
        const html = await this.fetchPage(url);
        pagesCrawled++;
        consecutiveFailures = 0;
        logs.push(`Crawled: ${url} (depth ${depth})`);

        // Extract data
        const extraction = this.extractionService.extractFromPage(html, url, config.advancedMode);
        results.set(url, extraction);

        // Early stop if we found sufficient contact info
        if (this.hasSufficientContactInfo(results)) {
          logs.push('Early stop: sufficient contact info found');
          break;
        }

        // Discover new links (only if depth < maxDepth)
        if (depth < config.maxDepth) {
          const newLinks = this.extractLinks(html, baseUrl, url, visited);
          const prioritized = this.prioritizeLinks(newLinks);

          for (const link of prioritized) {
            urlQueue.push({ url: link, depth: depth + 1 });
          }
        }
      } catch (error) {
        consecutiveFailures++;
        logs.push(`Failed to fetch ${url}: ${error.message}`);

        // Circuit breaker
        if (consecutiveFailures >= 3) {
          logs.push('Circuit breaker triggered: 3 consecutive failures');
          this.recordFailure(baseUrl);
          break;
        }
      }
    }

    return {
      results,
      pagesCrawled,
      botDetected: false,
      fallbackUsed: false,
      logs,
    };
  }

  /**
   * Fallback crawl (homepage only)
   */
  private async fallbackCrawl(
    baseUrl: string,
    config: CrawlConfig,
    logs: string[],
  ): Promise<CrawlResult> {
    const results = new Map<string, ExtractionResult>();

    try {
      const html = await this.fetchPage(baseUrl);
      logs.push('Fallback mode: extracted data from homepage only');

      const extraction = this.extractionService.extractFromPage(html, baseUrl, config.advancedMode);
      results.set(baseUrl, extraction);

      return {
        results,
        pagesCrawled: 1,
        botDetected: true,
        fallbackUsed: true,
        logs,
      };
    } catch (error) {
      logs.push(`Fallback crawl failed: ${error.message}`);
      return {
        results: new Map(),
        pagesCrawled: 0,
        botDetected: true,
        fallbackUsed: true,
        logs,
      };
    }
  }

  /**
   * Test if website is reachable
   */
  private async testReachability(url: string): Promise<{ isAccessible: boolean; botBlocked: boolean }> {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LeadGenBot/1.0)',
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
      });

      // Check for bot blocking
      if (response.status === 403 || response.status === 429) {
        return { isAccessible: false, botBlocked: true };
      }

      return { isAccessible: response.status === 200, botBlocked: false };
    } catch (error: any) {
      // Check if error indicates bot blocking
      if (error.response?.status === 403 || error.response?.status === 429) {
        return { isAccessible: false, botBlocked: true };
      }

      return { isAccessible: false, botBlocked: false };
    }
  }

  /**
   * Fetch page HTML
   */
  private async fetchPage(url: string): Promise<string> {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LeadGenBot/1.0)',
        Accept: 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      maxRedirects: 5,
      validateStatus: (status) => status === 200,
    });

    return response.data;
  }

  /**
   * Check robots.txt
   */
  private async checkRobotsTxt(baseUrl: string): Promise<boolean> {
    try {
      const robotsUrl = new URL('/robots.txt', baseUrl).href;
      const response = await axios.get(robotsUrl, {
        timeout: 3000,
        validateStatus: (status) => status === 200,
      });

      const robots = robotsParser(robotsUrl, response.data);
      return robots.isAllowed(baseUrl, 'LeadGenBot') ?? true;
    } catch (error) {
      // If robots.txt doesn't exist or fails to load, assume allowed
      return true;
    }
  }

  /**
   * Rate limiting: 500ms between requests to same domain
   */
  private async rateLimit(domain: string): Promise<void> {
    const lastRequest = this.domainRateLimiters.get(domain);
    if (lastRequest) {
      const elapsed = Date.now() - lastRequest;
      if (elapsed < 500) {
        await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
      }
    }
    this.domainRateLimiters.set(domain, Date.now());
  }

  /**
   * Build priority URL queue
   */
  private buildPriorityQueue(baseUrl: string): Array<{ url: string; depth: number }> {
    const priorityPaths = [
      '/contact',
      '/contact-us',
      '/contactus',
      '/contact.html',
      '/book',
      '/booking',
      '/schedule',
      '/appointment',
      '/about',
      '/about-us',
      '/aboutus',
      '/about.html',
      '/',
    ];

    return priorityPaths.map((path) => ({
      url: new URL(path, baseUrl).href,
      depth: 0,
    }));
  }

  /**
   * Extract links from HTML
   */
  private extractLinks(
    html: string,
    baseUrl: string,
    currentUrl: string,
    visited: Set<string>,
  ): string[] {
    const links: string[] = [];
    const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      try {
        const url = new URL(match[1], currentUrl);
        const baseHostname = new URL(baseUrl).hostname;

        // Only include same domain links
        if (url.hostname === baseHostname && !visited.has(url.href)) {
          links.push(url.href);
        }
      } catch {
        // Invalid URL, skip
      }
    }

    return links;
  }

  /**
   * Prioritize links (contact pages first)
   */
  private prioritizeLinks(links: string[]): string[] {
    const contactKeywords = ['contact', 'book', 'appointment', 'about'];

    return links.sort((a, b) => {
      const aScore = contactKeywords.some((kw) => a.toLowerCase().includes(kw)) ? 1 : 0;
      const bScore = contactKeywords.some((kw) => b.toLowerCase().includes(kw)) ? 1 : 0;
      return bScore - aScore;
    });
  }

  /**
   * Check if we have sufficient contact info (early stop)
   */
  private hasSufficientContactInfo(results: Map<string, ExtractionResult>): boolean {
    let totalEmails = 0;
    let totalPhones = 0;
    let hasContactPage = false;

    for (const result of results.values()) {
      totalEmails += result.emails.length;
      totalPhones += result.phones.length;
      if (result.isContactPage) {
        hasContactPage = true;
      }
    }

    // Early stop if we have at least 2 emails or 2 phones and found a contact page
    return (totalEmails >= 2 || totalPhones >= 2) && hasContactPage;
  }

  /**
   * Circuit breaker: check if circuit is open
   */
  private isCircuitOpen(domain: string): boolean {
    const breaker = this.circuitBreakers.get(domain);
    if (!breaker) return false;

    // Circuit opens after 3 failures, closes after 5 minutes
    const isOpen = breaker.failures >= 3 && Date.now() - breaker.lastFailure < 300000;
    return isOpen;
  }

  /**
   * Record failure for circuit breaker
   */
  private recordFailure(domain: string): void {
    const breaker = this.circuitBreakers.get(domain) || { failures: 0, lastFailure: 0 };
    breaker.failures++;
    breaker.lastFailure = Date.now();
    this.circuitBreakers.set(domain, breaker);
  }

  /**
   * Reset circuit breaker
   */
  private resetCircuitBreaker(domain: string): void {
    this.circuitBreakers.delete(domain);
  }

  /**
   * Get crawl config with defaults
   */
  private getCrawlConfig(config?: Partial<CrawlConfig>): CrawlConfig {
    return {
      maxDepth: config?.maxDepth ?? this.configService.get<number>('ENRICHMENT_MAX_DEPTH', 2),
      maxPages: config?.maxPages ?? this.configService.get<number>('ENRICHMENT_MAX_PAGES', 15),
      timeoutMs: config?.timeoutMs ?? this.configService.get<number>('ENRICHMENT_TIMEOUT_MS', 30000),
      respectRobots:
        config?.respectRobots ?? this.configService.get<boolean>('ENRICHMENT_RESPECT_ROBOTS', true),
      advancedMode:
        config?.advancedMode ?? this.configService.get<boolean>('ADVANCED_EXTRACTION_ENABLED', false),
    };
  }
}
