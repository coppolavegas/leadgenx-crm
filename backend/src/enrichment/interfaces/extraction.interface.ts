export interface ExtractionResult {
  emails: EmailExtraction[];
  phones: PhoneExtraction[];
  socialLinks: SocialLinks;
  addresses: AddressExtraction[];
  contactForms: ContactFormExtraction[];
  isContactPage: boolean;
}

export interface EmailExtraction {
  email: string;
  pageUrl: string;
  snippet: string;
  confidence: 'high' | 'medium' | 'low';
  method: 'mailto' | 'regex' | 'jsonld';
}

export interface PhoneExtraction {
  rawPhone: string;
  normalizedPhone: string;
  pageUrl: string;
  snippet: string;
  confidence: 'high' | 'medium' | 'low';
  method: 'tel' | 'regex' | 'jsonld';
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
}

export interface AddressExtraction {
  fullAddress: string;
  pageUrl: string;
  snippet: string;
  parsed: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

export interface ContactFormExtraction {
  formUrl: string;
  pageUrl: string;
  hasEmailField: boolean;
  hasMessageField: boolean;
}

export interface JsonLdOrganization {
  '@type': string;
  name?: string;
  email?: string;
  telephone?: string;
  address?: any;
  url?: string;
  sameAs?: string[];
}
