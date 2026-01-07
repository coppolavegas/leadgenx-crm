import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GooglePlacesProvider, GooglePlaceResult } from './providers/google-places.provider';
import { DiscoverLeadsDto } from './dto/discover-leads.dto';
import { LeadResponseDto, DiscoveryResultDto } from './dto/lead-response.dto';
import { AutoGenxService } from '../autogenx/autogenx.service';

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googlePlaces: GooglePlacesProvider,
    private readonly autogenx: AutoGenxService,
  ) {}

  async discoverLeads(dto: DiscoverLeadsDto): Promise<DiscoveryResultDto> {
    this.logger.log(`Starting lead discovery: ${dto.industry} in ${dto.location.city || 'coordinates'}`);

    // Build search query
    const searchQuery = this.buildSearchQuery(dto);
    
    // Determine location for search
    const location = this.buildLocationParams(dto.location);

    // Search Google Places
    const maxLeads = dto.maxLeads || 50;
    const googleResults = await this.googlePlaces.searchWithPagination(
      searchQuery,
      location,
      maxLeads,
    );

    this.logger.log(`Found ${googleResults.length} results from Google Places`);

    // Process and store results with deduplication
    const { newLeads, existingLeads } = await this.processAndStoreResults(googleResults, 'google');

    return {
      new_leads: newLeads.map(this.mapToResponseDto),
      existing_leads: existingLeads.map(this.mapToResponseDto),
      new_count: newLeads.length,
      existing_count: existingLeads.length,
      total_processed: googleResults.length,
    };
  }

  private buildSearchQuery(dto: DiscoverLeadsDto): string {
    let query = dto.industry;

    if (dto.keywords && dto.keywords.length > 0) {
      query += ' ' + dto.keywords.join(' ');
    }

    if (dto.location.city) {
      query += ` in ${dto.location.city}`;
      if (dto.location.state) {
        query += `, ${dto.location.state}`;
      }
    }

    return query;
  }

  private buildLocationParams(
    location: DiscoverLeadsDto['location'],
  ): { lat: number; lng: number; radius: number } | undefined {
    if (location.latitude && location.longitude) {
      return {
        lat: location.latitude,
        lng: location.longitude,
        radius: location.radius || 5000,
      };
    }
    return undefined;
  }

  private async processAndStoreResults(
    results: GooglePlaceResult[],
    source: 'google' | 'yelp',
  ): Promise<{ newLeads: any[]; existingLeads: any[] }> {
    const newLeads = [];
    const existingLeads = [];

    for (const result of results) {
      try {
        const leadData = this.mapGoogleResultToLead(result, source);
        const stored = await this.storeOrUpdateLead(leadData);

        if (stored.isNew) {
          newLeads.push(stored.lead);
        } else {
          existingLeads.push(stored.lead);
        }
      } catch (error) {
        this.logger.error(`Failed to process result: ${result.name}`, error);
        // Continue processing other results
      }
    }

    return { newLeads, existingLeads };
  }

  private mapGoogleResultToLead(result: GooglePlaceResult, source: 'google' | 'yelp') {
    // Determine if this is a valid lead (has contact method)
    const hasContactMethod = !!(result.formatted_phone_number || result.website);

    return {
      name: result.name,
      address: result.formatted_address || null,
      phone: result.formatted_phone_number || null,
      website: result.website || null,
      contact_page_url: null, // Will be enriched in future
      rating: result.rating || null,
      review_count: result.user_ratings_total || null,
      source,
      source_url: result.url || `https://www.google.com/maps/place/?q=place_id:${result.place_id}`,
      place_id: result.place_id,
      yelp_id: null,
      categories: result.types || [],
      latitude: result.geometry?.location?.lat || null,
      longitude: result.geometry?.location?.lng || null,
      is_lead: hasContactMethod,
    };
  }

  private async storeOrUpdateLead(leadData: any): Promise<{ lead: any; isNew: boolean }> {
    // Try to find existing lead
    const existing = await this.findExistingLead(leadData);

    if (existing) {
      // Update last_seen_at
      const updated = await this.prisma.lead.update({
        where: { id: existing.id },
        data: { last_seen_at: new Date() },
      });
      return { lead: updated, isNew: false };
    }

    // Create new lead
    const created = await this.prisma.lead.create({
      data: leadData,
    });

    // AutoGenX Phase 1: Emit lead_created event (fire-and-forget)
    this.autogenx.emitEvent({
      leadId: created.id,
      eventType: 'lead_created',
      payload: { source: created.source, name: created.name, is_lead: created.is_lead },
    });

    return { lead: created, isNew: true };
  }

  private async findExistingLead(leadData: any): Promise<any | null> {
    // Primary: Search by place_id
    if (leadData.place_id) {
      const byPlaceId = await this.prisma.lead.findUnique({
        where: { place_id: leadData.place_id },
      });
      if (byPlaceId) return byPlaceId;
    }

    // Secondary: Search by yelp_id (for future)
    if (leadData.yelp_id) {
      const byYelpId = await this.prisma.lead.findUnique({
        where: { yelp_id: leadData.yelp_id },
      });
      if (byYelpId) return byYelpId;
    }

    // Fallback: Search by normalized name + address
    if (leadData.name && leadData.address) {
      const normalized = this.normalizeName(leadData.name);
      const normalizedAddress = this.normalizeAddress(leadData.address);

      const leads = await this.prisma.lead.findMany({
        where: {
          name: { contains: normalized, mode: 'insensitive' },
          address: { contains: normalizedAddress, mode: 'insensitive' },
        },
      });

      if (leads.length > 0) {
        return leads[0];
      }
    }

    return null;
  }

  private normalizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  }

  private normalizeAddress(address: string): string {
    return address.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  }

  private mapToResponseDto(lead: any): LeadResponseDto {
    return {
      id: lead.id,
      name: lead.name,
      address: lead.address,
      phone: lead.phone,
      website: lead.website,
      contact_page_url: lead.contact_page_url,
      rating: lead.rating,
      review_count: lead.review_count,
      source: lead.source,
      source_url: lead.source_url,
      place_id: lead.place_id,
      yelp_id: lead.yelp_id,
      categories: lead.categories,
      latitude: lead.latitude,
      longitude: lead.longitude,
      is_lead: lead.is_lead,
      discovered_at: lead.discovered_at,
      last_seen_at: lead.last_seen_at,
    };
  }
}
