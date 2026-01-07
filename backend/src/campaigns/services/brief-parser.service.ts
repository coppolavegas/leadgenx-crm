import { Injectable, Logger } from '@nestjs/common';
import { TargetingProfile } from '../interfaces/targeting-profile.interface';

/**
 * BriefParser Service
 * Converts natural language client briefs into structured targeting profiles
 * Uses rule-based extraction (MVP - no LLM required)
 */
@Injectable()
export class BriefParserService {
  private readonly logger = new Logger(BriefParserService.name);

  // Feature extraction patterns
  private readonly MUST_HAVE_PATTERNS = [
    /\b(?:must|need|require|looking for|want)\s+(?:to\s+)?([\w\s-]+?)(?:\s*(?:that|which|with|and|,|\.))/gi,
    /\b(?:has to|have to|should)\s+(?:have|offer|provide|include)\s+([\w\s-]+?)(?:\s*(?:that|which|with|and|,|\.))/gi,
  ];

  private readonly NICE_TO_HAVE_PATTERNS = [
    /\b(?:nice to have|prefer|would like|bonus if|ideally|preferably)\s+([\w\s-]+?)(?:\s*(?:that|which|with|and|,|\.))/gi,
    /\b(?:hope to find|it'd be great if)\s+([\w\s-]+?)(?:\s*(?:that|which|with|and|,|\.))/gi,
  ];

  private readonly EXCLUDE_PATTERNS = [
    /\b(?:no|not|don't want|avoid|exclude|without)\s+([\w\s-]+?)(?:\s*(?:that|which|with|and|,|\.))/gi,
    /\b(?:must not|shouldn't|can't have)\s+([\w\s-]+?)(?:\s*(?:that|which|with|and|,|\.))/gi,
  ];

  // Contact method patterns
  private readonly CONTACT_METHOD_PATTERNS = {
    phone: /\b(?:phone|call|telephone|mobile)\b/i,
    email: /\b(?:email|e-mail|electronic mail)\b/i,
    form: /\b(?:form|contact form|online form|web form|booking form)\b/i,
  };

  // Service/feature keywords for recording studios (vertical-specific)
  private readonly STUDIO_SERVICES = [
    'mixing', 'mastering', 'recording', 'production', 'editing',
    'vocal booth', 'live room', 'control room', 'isolation booth',
    'analog gear', 'digital recording', 'pro tools', 'logic pro',
    'tracking', 'overdubbing', 'multitrack', 'session',
    'engineer', 'producer', 'sound design', 'post-production',
  ];

  private readonly STUDIO_FEATURES = [
    'late-night', 'overnight', '24/7', '24 hour', 'weekend',
    'online booking', 'instant booking', 'hourly rates', 'day rate',
    'rehearsal space', 'equipment rental', 'consultation',
    'mixing online', 'remote mixing', 'mastering online',
    'podcast recording', 'voiceover', 'audiobook',
  ];

  /**
   * Generate targeting profile from client brief
   */
  async generateTargetingProfile(clientBrief: string): Promise<TargetingProfile> {
    this.logger.log('Generating targeting profile from client brief');

    const normalizedBrief = clientBrief.toLowerCase();

    // Extract features
    const mustHaveFeatures = this.extractFeatures(clientBrief, this.MUST_HAVE_PATTERNS);
    const niceToHaveFeatures = this.extractFeatures(clientBrief, this.NICE_TO_HAVE_PATTERNS);
    const excludedFeatures = this.extractFeatures(clientBrief, this.EXCLUDE_PATTERNS);

    // Extract keywords from features and brief
    const suggestedKeywords = this.extractKeywords(clientBrief, mustHaveFeatures, niceToHaveFeatures);
    const suggestedNegativeKeywords = this.extractNegativeKeywords(excludedFeatures);

    // Detect preferred contact methods
    const preferredContactMethods = this.detectContactMethods(normalizedBrief);

    // Extract geographic notes
    const priorityGeoNotes = this.extractGeoNotes(clientBrief);

    // Generate scoring overrides based on contact preferences
    const suggestedScoringOverrides = this.generateScoringOverrides(preferredContactMethods, mustHaveFeatures);

    // Calculate confidence score
    const confidenceScore = this.calculateConfidence(
      mustHaveFeatures,
      niceToHaveFeatures,
      suggestedKeywords
    );

    const profile: TargetingProfile = {
      must_have_features: mustHaveFeatures,
      nice_to_have_features: niceToHaveFeatures,
      excluded_features: excludedFeatures,
      suggested_keywords: suggestedKeywords,
      suggested_negative_keywords: suggestedNegativeKeywords,
      preferred_contact_methods: preferredContactMethods,
      priority_geo_notes: priorityGeoNotes,
      suggested_scoring_overrides: suggestedScoringOverrides,
      extraction_method: 'rule_based',
      confidence_score: confidenceScore,
      generated_at: new Date().toISOString(),
    };

    this.logger.log(`Generated targeting profile with ${mustHaveFeatures.length} must-have features`);
    return profile;
  }

  /**
   * Extract features using regex patterns
   */
  private extractFeatures(text: string, patterns: RegExp[]): string[] {
    const features = new Set<string>();

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const feature = match[1].trim().toLowerCase();
          if (feature.length > 2 && feature.length < 50) {
            features.add(feature);
          }
        }
      }
    }

    return Array.from(features);
  }

  /**
   * Extract relevant keywords from brief
   */
  private extractKeywords(
    brief: string,
    mustHaveFeatures: string[],
    niceToHaveFeatures: string[]
  ): string[] {
    const keywords = new Set<string>();

    // Add features as keywords
    [...mustHaveFeatures, ...niceToHaveFeatures].forEach(feature => {
      // Split multi-word features into individual keywords
      feature.split(/\s+/).forEach(word => {
        if (word.length > 3 && !this.isStopWord(word)) {
          keywords.add(word);
        }
      });
    });

    // Extract service-related keywords for studios
    const briefLower = brief.toLowerCase();
    [...this.STUDIO_SERVICES, ...this.STUDIO_FEATURES].forEach(service => {
      if (briefLower.includes(service)) {
        keywords.add(service);
      }
    });

    return Array.from(keywords).slice(0, 20); // Limit to 20 keywords
  }

  /**
   * Extract negative keywords from excluded features
   */
  private extractNegativeKeywords(excludedFeatures: string[]): string[] {
    const negativeKeywords = new Set<string>();

    excludedFeatures.forEach(feature => {
      feature.split(/\s+/).forEach(word => {
        if (word.length > 3 && !this.isStopWord(word)) {
          negativeKeywords.add(word);
        }
      });
    });

    return Array.from(negativeKeywords);
  }

  /**
   * Detect preferred contact methods
   */
  private detectContactMethods(text: string): ('phone' | 'email' | 'form')[] {
    const methods: ('phone' | 'email' | 'form')[] = [];

    if (this.CONTACT_METHOD_PATTERNS.phone.test(text)) {
      methods.push('phone');
    }
    if (this.CONTACT_METHOD_PATTERNS.email.test(text)) {
      methods.push('email');
    }
    if (this.CONTACT_METHOD_PATTERNS.form.test(text)) {
      methods.push('form');
    }

    // Default to all methods if none specified
    return methods.length > 0 ? methods : ['phone', 'email', 'form'];
  }

  /**
   * Extract geographic targeting notes
   */
  private extractGeoNotes(text: string): string[] {
    const notes: string[] = [];

    // Look for location-specific requirements
    const locationPatterns = [
      /\b(?:near|close to|around|in|at)\s+([\w\s,]+?)(?:\s*(?:area|region|neighborhood|district))/gi,
      /\b(?:downtown|uptown|suburb|city center)\b/gi,
    ];

    for (const pattern of locationPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[0]) {
          notes.push(match[0].trim());
        }
      }
    }

    return notes;
  }

  /**
   * Generate scoring weight overrides
   */
  private generateScoringOverrides(
    contactMethods: string[],
    mustHaveFeatures: string[]
  ): TargetingProfile['suggested_scoring_overrides'] {
    const overrides: TargetingProfile['suggested_scoring_overrides'] = {};

    // Boost phone weight if phone is preferred
    if (contactMethods.includes('phone')) {
      overrides.phone_weight = 35;
    }

    // Boost email weight if email is preferred
    if (contactMethods.includes('email')) {
      overrides.email_weight = 35;
    }

    // Boost form weight if form is preferred
    if (contactMethods.includes('form')) {
      overrides.form_weight = 30;
    }

    // If many must-have features, boost intent weight
    if (mustHaveFeatures.length >= 3) {
      overrides.intent_weight = 15;
    }

    return overrides;
  }

  /**
   * Calculate confidence score for the extraction
   */
  private calculateConfidence(
    mustHaveFeatures: string[],
    niceToHaveFeatures: string[],
    keywords: string[]
  ): number {
    let score = 0.5; // Base score

    // Increase confidence based on extracted features
    if (mustHaveFeatures.length > 0) score += 0.2;
    if (niceToHaveFeatures.length > 0) score += 0.1;
    if (keywords.length >= 3) score += 0.15;
    if (keywords.length >= 5) score += 0.05;

    return Math.min(score, 1.0);
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'a', 'an', 'as', 'by', 'from', 'that', 'this',
      'are', 'is', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
    ]);
    return stopWords.has(word.toLowerCase());
  }
}
