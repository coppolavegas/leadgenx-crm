export interface WebsiteAnalysis {
  url: string;
  crawled_at: string;
  pages_analyzed: PageAnalysis[];
  business_summary: string;
  services_offered: string[];
  industries: string[];
  suggested_keywords: string[];
  suggested_negative_keywords: string[];
  target_customer_profile?: string;
  value_propositions: string[];
  confidence_score: number;
  extraction_method: 'rule_based' | 'llm_enhanced';
  analysis_notes: string[];
}

export interface PageAnalysis {
  url: string;
  page_type: 'homepage' | 'about' | 'services' | 'products' | 'contact' | 'other';
  title: string;
  meta_description?: string;
  headings: string[];
  key_phrases: string[];
  extracted_services: string[];
  extracted_keywords: string[];
  text_snippets: TextSnippet[];
}

export interface TextSnippet {
  text: string;
  context: string; // e.g., 'heading', 'paragraph', 'list-item'
  relevance: 'high' | 'medium' | 'low';
}
