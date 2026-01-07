import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { WebsiteAnalysis, PageAnalysis, TextSnippet } from '../interfaces/website-analysis.interface';

@Injectable()
export class WebsiteAnalyzerService {
  private readonly logger = new Logger(WebsiteAnalyzerService.name);
  private readonly USER_AGENT = 'LeadGenX-WebsiteAnalyzer/1.0 (Business Intelligence Bot)';
  private readonly TIMEOUT_MS = 10000;
  private readonly MAX_PAGES = 5;

  /**
   * Analyze a website and extract business intelligence
   */
  async analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
    this.logger.log(`Starting website analysis for: ${url}`);

    const normalizedUrl = this.normalizeUrl(url);
    const pagesToAnalyze = this.generatePageUrls(normalizedUrl);
    const analyzedPages: PageAnalysis[] = [];

    // Crawl and analyze each page
    for (const pageUrl of pagesToAnalyze) {
      try {
        const pageAnalysis = await this.analyzePage(pageUrl);
        if (pageAnalysis) {
          analyzedPages.push(pageAnalysis);
        }
      } catch (error) {
        this.logger.warn(`Failed to analyze page ${pageUrl}: ${error.message}`);
      }
    }

    if (analyzedPages.length === 0) {
      throw new Error('Failed to analyze any pages from the website');
    }

    // Aggregate insights from all pages
    const analysis = this.aggregateAnalysis(normalizedUrl, analyzedPages);

    this.logger.log(
      `Website analysis complete for ${url}: ${analyzedPages.length} pages analyzed, ` +
      `${analysis.services_offered.length} services, ${analysis.suggested_keywords.length} keywords`,
    );

    return analysis;
  }

  /**
   * Normalize URL to base domain
   */
  private normalizeUrl(url: string): string {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.hostname}`;
    } catch (error) {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  /**
   * Generate list of URLs to analyze
   */
  private generatePageUrls(baseUrl: string): string[] {
    const urls = [
      baseUrl, // Homepage
      `${baseUrl}/about`,
      `${baseUrl}/about-us`,
      `${baseUrl}/services`,
      `${baseUrl}/products`,
      `${baseUrl}/what-we-do`,
      `${baseUrl}/solutions`,
    ];

    return urls.slice(0, this.MAX_PAGES);
  }

  /**
   * Analyze a single page
   */
  private async analyzePage(url: string): Promise<PageAnalysis | null> {
    try {
      this.logger.debug(`Fetching page: ${url}`);

      const response = await axios.get(url, {
        timeout: this.TIMEOUT_MS,
        headers: {
          'User-Agent': this.USER_AGENT,
        },
        maxRedirects: 3,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract page metadata
      const title = $('title').text().trim() || $('h1').first().text().trim();
      const metaDescription = $('meta[name="description"]').attr('content') || '';

      // Extract headings
      const headings: string[] = [];
      $('h1, h2, h3').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length < 200) {
          headings.push(text);
        }
      });

      // Extract text content
      const textContent = this.extractTextContent($);

      // Determine page type
      const pageType = this.determinePageType(url, title, headings);

      // Extract services and keywords
      const extractedServices = this.extractServices($, textContent);
      const extractedKeywords = this.extractKeywords(textContent, headings);
      const textSnippets = this.extractTextSnippets($, pageType);

      // Extract key phrases from headings and content
      const keyPhrases = this.extractKeyPhrases(headings, textContent);

      return {
        url,
        page_type: pageType,
        title,
        meta_description: metaDescription,
        headings: headings.slice(0, 10),
        key_phrases: keyPhrases,
        extracted_services: extractedServices,
        extracted_keywords: extractedKeywords,
        text_snippets: textSnippets,
      };
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.debug(`Page not found: ${url}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Extract clean text content from page
   */
  private extractTextContent($: cheerio.CheerioAPI): string {
    // Remove script, style, and nav elements
    $('script, style, nav, footer, header').remove();

    // Get main content text
    const mainContent = $('main, article, .content, #content, .main').text();
    const bodyContent = $('body').text();

    const text = (mainContent || bodyContent)
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000); // Limit to first 10k chars

    return text;
  }

  /**
   * Determine page type from URL and content
   */
  private determinePageType(
    url: string,
    title: string,
    headings: string[],
  ): PageAnalysis['page_type'] {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    const headingsText = headings.join(' ').toLowerCase();

    if (urlLower.includes('/about')) return 'about';
    if (urlLower.includes('/services') || urlLower.includes('/what-we-do')) return 'services';
    if (urlLower.includes('/products') || urlLower.includes('/solutions')) return 'products';
    if (urlLower.includes('/contact')) return 'contact';

    // Check content
    if (titleLower.includes('about') || headingsText.includes('about us')) return 'about';
    if (titleLower.includes('services') || headingsText.includes('our services')) return 'services';
    if (titleLower.includes('products')) return 'products';

    // Default to homepage if it's the base URL
    const parsed = new URL(url);
    if (parsed.pathname === '/' || parsed.pathname === '') return 'homepage';

    return 'other';
  }

  /**
   * Extract services from page content
   */
  private extractServices($: cheerio.CheerioAPI, textContent: string): string[] {
    const services = new Set<string>();

    // Look for list items under service-related headings
    $('h2, h3').each((_, heading) => {
      const headingText = $(heading).text().toLowerCase();
      if (
        headingText.includes('service') ||
        headingText.includes('what we do') ||
        headingText.includes('solutions') ||
        headingText.includes('offerings')
      ) {
        // Find next ul or ol after this heading
        const list = $(heading).nextAll('ul, ol').first();
        list.find('li').each((_, li) => {
          const service = $(li).text().trim();
          if (service.length > 5 && service.length < 100) {
            services.add(service);
          }
        });
      }
    });

    // Extract from common service indicators
    const servicePatterns = [
      /we offer ([^.]+)/gi,
      /we provide ([^.]+)/gi,
      /specializ(?:e|ing) in ([^.]+)/gi,
      /our services include ([^.]+)/gi,
    ];

    for (const pattern of servicePatterns) {
      const matches = textContent.matchAll(pattern);
      for (const match of matches) {
        const service = match[1].trim();
        if (service.length < 100) {
          services.add(service);
        }
      }
    }

    return Array.from(services).slice(0, 20);
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(textContent: string, headings: string[]): string[] {
    const keywords = new Set<string>();

    // Common business/industry keywords
    const commonKeywords = [
      'professional', 'quality', 'expert', 'certified', 'licensed',
      'experienced', 'premium', 'custom', 'affordable', 'reliable',
      'innovative', 'leading', 'trusted', 'comprehensive', 'specialized',
    ];

    const text = (headings.join(' ') + ' ' + textContent).toLowerCase();

    for (const keyword of commonKeywords) {
      if (text.includes(keyword)) {
        keywords.add(keyword);
      }
    }

    // Extract multi-word phrases (2-3 words)
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (phrase.length > 8 && phrase.length < 30) {
        // Check if phrase appears in headings (more important)
        if (headings.some((h) => h.toLowerCase().includes(phrase))) {
          keywords.add(phrase);
        }
      }
    }

    return Array.from(keywords).slice(0, 30);
  }

  /**
   * Extract key phrases from headings and content
   */
  private extractKeyPhrases(headings: string[], textContent: string): string[] {
    const phrases = new Set<string>();

    // Extract from headings (most important)
    for (const heading of headings) {
      if (heading.length > 10 && heading.length < 100) {
        phrases.add(heading);
      }
    }

    // Extract sentences with key business terms
    const sentences = textContent.match(/[^.!?]+[.!?]+/g) || [];
    const keyTerms = ['we', 'our', 'service', 'provide', 'offer', 'specialize', 'help'];

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      if (keyTerms.some((term) => lowerSentence.includes(term)) && sentence.length < 200) {
        phrases.add(sentence.trim());
        if (phrases.size >= 10) break;
      }
    }

    return Array.from(phrases).slice(0, 15);
  }

  /**
   * Extract relevant text snippets with context
   */
  private extractTextSnippets($: cheerio.CheerioAPI, pageType: string): TextSnippet[] {
    const snippets: TextSnippet[] = [];

    // Extract from headings (high relevance)
    $('h1, h2').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 10 && text.length < 200) {
        snippets.push({
          text,
          context: 'heading',
          relevance: 'high',
        });
      }
    });

    // Extract from paragraphs near headings
    $('h2, h3').each((_, heading) => {
      const nextP = $(heading).nextAll('p').first();
      const text = nextP.text().trim();
      if (text && text.length > 20 && text.length < 300) {
        snippets.push({
          text,
          context: 'paragraph',
          relevance: pageType === 'about' || pageType === 'services' ? 'high' : 'medium',
        });
      }
    });

    return snippets.slice(0, 10);
  }

  /**
   * Aggregate analysis from all pages
   */
  private aggregateAnalysis(url: string, pages: PageAnalysis[]): WebsiteAnalysis {
    const allServices = new Set<string>();
    const allKeywords = new Set<string>();
    const allKeyPhrases = new Set<string>();
    const analysisNotes: string[] = [];

    // Collect all extracted data
    for (const page of pages) {
      page.extracted_services.forEach((s) => allServices.add(s));
      page.extracted_keywords.forEach((k) => allKeywords.add(k));
      page.key_phrases.forEach((p) => allKeyPhrases.add(p));

      analysisNotes.push(`Analyzed ${page.page_type} page: ${page.url}`);
    }

    // Generate business summary from homepage and about pages
    const businessSummary = this.generateBusinessSummary(pages);

    // Detect industries
    const industries = this.detectIndustries(pages);

    // Generate suggested keywords
    const suggestedKeywords = this.generateSuggestedKeywords(pages, Array.from(allKeywords));

    // Generate negative keywords
    const suggestedNegativeKeywords = this.generateNegativeKeywords(pages);

    // Extract value propositions
    const valuePropositions = this.extractValuePropositions(pages);

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(pages, allServices.size);

    return {
      url,
      crawled_at: new Date().toISOString(),
      pages_analyzed: pages,
      business_summary: businessSummary,
      services_offered: Array.from(allServices).slice(0, 20),
      industries,
      suggested_keywords: suggestedKeywords,
      suggested_negative_keywords: suggestedNegativeKeywords,
      value_propositions: valuePropositions,
      confidence_score: confidenceScore,
      extraction_method: 'rule_based',
      analysis_notes: analysisNotes,
    };
  }

  /**
   * Generate business summary from page content
   */
  private generateBusinessSummary(pages: PageAnalysis[]): string {
    // Prioritize about page, then homepage
    const aboutPage = pages.find((p) => p.page_type === 'about');
    const homePage = pages.find((p) => p.page_type === 'homepage');

    const sourcePage = aboutPage || homePage || pages[0];

    // Use meta description if available
    if (sourcePage.meta_description && sourcePage.meta_description.length > 20) {
      return sourcePage.meta_description;
    }

    // Use first high-relevance text snippet
    const highRelevanceSnippet = sourcePage.text_snippets.find((s) => s.relevance === 'high');
    if (highRelevanceSnippet) {
      return highRelevanceSnippet.text;
    }

    // Fallback to title
    return sourcePage.title || 'Business summary not available';
  }

  /**
   * Detect industries from page content
   */
  private detectIndustries(pages: PageAnalysis[]): string[] {
    const industries = new Set<string>();

    const industryKeywords = {
      'Technology': ['software', 'technology', 'tech', 'digital', 'IT', 'cloud', 'SaaS'],
      'Healthcare': ['health', 'medical', 'clinic', 'hospital', 'dental', 'healthcare'],
      'Finance': ['finance', 'financial', 'banking', 'accounting', 'investment'],
      'Real Estate': ['real estate', 'property', 'realtor', 'homes'],
      'Legal': ['legal', 'law', 'attorney', 'lawyer'],
      'Marketing': ['marketing', 'advertising', 'branding', 'SEO'],
      'Education': ['education', 'training', 'school', 'learning'],
      'Retail': ['retail', 'shop', 'store', 'ecommerce'],
      'Manufacturing': ['manufacturing', 'production', 'factory'],
      'Hospitality': ['hotel', 'restaurant', 'hospitality', 'catering'],
      'Construction': ['construction', 'building', 'contractor'],
      'Entertainment': ['entertainment', 'music', 'recording', 'studio', 'event'],
    };

    const allText = pages
      .map((p) => p.title + ' ' + p.headings.join(' ') + ' ' + p.key_phrases.join(' '))
      .join(' ')
      .toLowerCase();

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some((keyword) => allText.includes(keyword.toLowerCase()))) {
        industries.add(industry);
      }
    }

    return Array.from(industries).slice(0, 3);
  }

  /**
   * Generate suggested keywords from analysis
   */
  private generateSuggestedKeywords(pages: PageAnalysis[], extractedKeywords: string[]): string[] {
    const keywords = new Set<string>(extractedKeywords);

    // Add important headings as keywords
    for (const page of pages) {
      for (const heading of page.headings) {
        const words = heading.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (word.length > 4 && word.length < 20) {
            keywords.add(word);
          }
        }
      }
    }

    return Array.from(keywords).slice(0, 30);
  }

  /**
   * Generate negative keywords
   */
  private generateNegativeKeywords(pages: PageAnalysis[]): string[] {
    // Common exclusion terms
    const negativeKeywords = [];

    const allText = pages
      .map((p) => p.title + ' ' + p.headings.join(' '))
      .join(' ')
      .toLowerCase();

    // Detect if they explicitly exclude certain things
    if (allText.includes('not') || allText.includes("don't")) {
      // This is a simple heuristic, can be improved
      negativeKeywords.push('excluded terms detected');
    }

    return negativeKeywords;
  }

  /**
   * Extract value propositions
   */
  private extractValuePropositions(pages: PageAnalysis[]): string[] {
    const propositions = new Set<string>();

    const valueWords = ['best', 'leading', 'top', 'premier', 'trusted', 'award', 'certified'];

    for (const page of pages) {
      for (const snippet of page.text_snippets) {
        if (snippet.relevance === 'high') {
          const lowerText = snippet.text.toLowerCase();
          if (valueWords.some((word) => lowerText.includes(word))) {
            propositions.add(snippet.text);
          }
        }
      }
    }

    return Array.from(propositions).slice(0, 5);
  }

  /**
   * Calculate confidence score based on data quality
   */
  private calculateConfidenceScore(pages: PageAnalysis[], servicesCount: number): number {
    let score = 0.5; // Base score

    // More pages analyzed = higher confidence
    score += Math.min(pages.length * 0.1, 0.2);

    // Services found = higher confidence
    score += Math.min(servicesCount * 0.02, 0.15);

    // Has about page = higher confidence
    if (pages.some((p) => p.page_type === 'about')) {
      score += 0.1;
    }

    // Has services page = higher confidence
    if (pages.some((p) => p.page_type === 'services')) {
      score += 0.1;
    }

    // Has meta descriptions = higher confidence
    const pagesWithMeta = pages.filter((p) => p.meta_description && p.meta_description.length > 20);
    score += Math.min(pagesWithMeta.length * 0.05, 0.1);

    return Math.min(Math.round(score * 100) / 100, 0.95);
  }
}
