import { Injectable } from '@nestjs/common';
import { CampaignTemplate } from '../interfaces/template.interface';

@Injectable()
export class TemplateService {
  // Hard-coded vertical templates (MVP approach)
  private readonly templates: CampaignTemplate[] = [
    {
      id: 'recording-studio',
      name: 'Recording Studio',
      vertical: 'Recording Studio',
      description: 'Target professional recording studios offering mixing, mastering, and production services',
      default_categories: [
        'recording_studio',
        'music_production_studio',
        'audio_production_service',
      ],
      default_keywords: [
        'recording studio',
        'music production',
        'mixing',
        'mastering',
        'audio recording',
        'professional studio',
      ],
      default_negative_keywords: [
        'karaoke',
        'party rental',
        'cheap',
        'hobbyist',
      ],
      default_min_rating: 4.0,
      default_min_reviews: 10,
      default_scoring_weights: {
        phone_weight: 30,
        email_weight: 35,
        form_weight: 25,
        intent_weight: 10,
        freshness_weight: 5,
      },
      example_brief: 'I need recording studios that offer mixing and mastering, have professional equipment, and can accommodate bands for multi-day sessions.',
    },
    {
      id: 'dental-clinic',
      name: 'Dental Clinic',
      vertical: 'Dental Clinic',
      description: 'Target dental practices and clinics providing general and specialized dental services',
      default_categories: [
        'dentist',
        'dental_clinic',
        'cosmetic_dentist',
      ],
      default_keywords: [
        'dentist',
        'dental clinic',
        'teeth cleaning',
        'dental implants',
        'cosmetic dentistry',
        'family dentist',
      ],
      default_negative_keywords: [
        'emergency only',
        'no new patients',
        'closed',
      ],
      default_min_rating: 4.2,
      default_min_reviews: 20,
      default_scoring_weights: {
        phone_weight: 40,
        email_weight: 25,
        form_weight: 30,
        intent_weight: 5,
        freshness_weight: 5,
      },
      example_brief: 'Looking for dental clinics that accept new patients, offer cosmetic services like whitening and veneers, and have evening hours.',
    },
    {
      id: 'fitness-gym',
      name: 'Fitness Gym / Studio',
      vertical: 'Fitness Gym',
      description: 'Target gyms, fitness studios, and personal training centers',
      default_categories: [
        'gym',
        'fitness_center',
        'personal_trainer',
      ],
      default_keywords: [
        'gym',
        'fitness',
        'personal training',
        'CrossFit',
        'yoga studio',
        'group classes',
      ],
      default_negative_keywords: [
        'martial arts',
        'dance studio',
        'physical therapy',
      ],
      default_min_rating: 4.0,
      default_min_reviews: 15,
      default_scoring_weights: {
        phone_weight: 35,
        email_weight: 30,
        form_weight: 30,
        intent_weight: 5,
        freshness_weight: 5,
      },
      example_brief: 'Target boutique fitness studios and gyms that offer personal training, have modern equipment, and are located in urban areas.',
    },
    {
      id: 'restaurant',
      name: 'Restaurant',
      vertical: 'Restaurant',
      description: 'Target restaurants and dining establishments',
      default_categories: [
        'restaurant',
        'cafe',
        'bar',
      ],
      default_keywords: [
        'restaurant',
        'dining',
        'food',
        'cuisine',
        'eatery',
      ],
      default_negative_keywords: [
        'fast food',
        'food truck',
        'catering only',
      ],
      default_min_rating: 4.0,
      default_min_reviews: 25,
      default_scoring_weights: {
        phone_weight: 40,
        email_weight: 20,
        form_weight: 35,
        intent_weight: 5,
        freshness_weight: 5,
      },
      example_brief: 'Looking for upscale restaurants with online reservations, outdoor seating, and full bar service.',
    },
    {
      id: 'real-estate',
      name: 'Real Estate Agency',
      vertical: 'Real Estate',
      description: 'Target real estate agencies, brokers, and property management firms',
      default_categories: [
        'real_estate_agency',
        'real_estate_agent',
        'property_management_company',
      ],
      default_keywords: [
        'real estate',
        'realtor',
        'property',
        'homes for sale',
        'buyer agent',
      ],
      default_negative_keywords: [
        'rental only',
        'vacation rental',
        'commercial only',
      ],
      default_min_rating: 4.2,
      default_min_reviews: 10,
      default_scoring_weights: {
        phone_weight: 35,
        email_weight: 40,
        form_weight: 20,
        intent_weight: 5,
        freshness_weight: 5,
      },
      example_brief: 'Target residential real estate agencies that specialize in first-time homebuyers and have strong local market knowledge.',
    },
    {
      id: 'law-firm',
      name: 'Law Firm',
      vertical: 'Legal Services',
      description: 'Target law firms and legal practices',
      default_categories: [
        'lawyer',
        'attorney',
        'law_firm',
      ],
      default_keywords: [
        'attorney',
        'lawyer',
        'legal services',
        'law firm',
        'consultation',
      ],
      default_negative_keywords: [
        'pro bono only',
        'criminal defense',
        'bankruptcy only',
      ],
      default_min_rating: 4.3,
      default_min_reviews: 8,
      default_scoring_weights: {
        phone_weight: 30,
        email_weight: 40,
        form_weight: 25,
        intent_weight: 5,
        freshness_weight: 5,
      },
      example_brief: 'Looking for law firms that handle business law, contracts, and M&A transactions for mid-sized companies.',
    },
    {
      id: 'saas-b2b',
      name: 'SaaS / B2B Tech',
      vertical: 'SaaS',
      description: 'Target SaaS companies and B2B technology providers',
      default_categories: [
        'software_company',
        'information_technology_company',
        'web_hosting_company',
      ],
      default_keywords: [
        'SaaS',
        'software',
        'cloud platform',
        'enterprise software',
        'API',
        'integration',
      ],
      default_negative_keywords: [
        'freelancer',
        'agency',
        'consulting',
      ],
      default_min_rating: 4.0,
      default_min_reviews: 5,
      default_scoring_weights: {
        phone_weight: 20,
        email_weight: 45,
        form_weight: 30,
        intent_weight: 5,
        freshness_weight: 5,
      },
      example_brief: 'Target B2B SaaS companies offering API-first products with enterprise pricing tiers and white-glove onboarding.',
    },
    {
      id: 'generic',
      name: 'Generic / Custom',
      vertical: 'Custom',
      description: 'Start with a blank template for custom campaign configuration',
      default_categories: [],
      default_keywords: [],
      default_negative_keywords: [],
      default_min_rating: 4.0,
      default_min_reviews: 10,
      default_scoring_weights: {
        phone_weight: 33,
        email_weight: 33,
        form_weight: 33,
        intent_weight: 10,
        freshness_weight: 5,
      },
      example_brief: '',
    },
  ];

  findAll(): CampaignTemplate[] {
    return this.templates;
  }

  findOne(id: string): CampaignTemplate | undefined {
    return this.templates.find((t) => t.id === id);
  }

  findByVertical(vertical: string): CampaignTemplate | undefined {
    return this.templates.find((t) => t.vertical === vertical);
  }
}
