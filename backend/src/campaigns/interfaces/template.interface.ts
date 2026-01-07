export interface CampaignTemplate {
  id: string;
  name: string;
  vertical: string;
  description: string;
  default_categories: string[];
  default_keywords: string[];
  default_negative_keywords: string[];
  default_min_rating: number;
  default_min_reviews: number;
  default_scoring_weights: {
    phone_weight: number;
    email_weight: number;
    form_weight: number;
    intent_weight: number;
    freshness_weight: number;
  };
  example_brief: string;
}
