import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  url?: string;
}

@Injectable()
export class GooglePlacesProvider {
  private readonly logger = new Logger(GooglePlacesProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY is not configured');
    }
    this.apiKey = apiKey;
  }

  /**
   * Search for places using Google Places Text Search API
   * Supports pagination via nextPageToken
   */
  async textSearch(
    query: string,
    location?: { lat: number; lng: number; radius: number },
    pageToken?: string,
  ): Promise<{ results: GooglePlaceResult[]; nextPageToken?: string }> {
    const params: any = {
      query,
      key: this.apiKey,
    };

    if (location) {
      params.location = `${location.lat},${location.lng}`;
      params.radius = location.radius;
    }

    if (pageToken) {
      params.pagetoken = pageToken;
      // Google requires a short delay before using the next page token
      await this.delay(2000);
    }

    try {
      this.logger.log(`Searching Google Places: ${query} ${location ? `near ${location.lat},${location.lng}` : ''}`);
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/textsearch/json`, { params }),
      );

      if (response.data.status === 'ZERO_RESULTS') {
        return { results: [] };
      }

      if (response.data.status !== 'OK') {
        this.logger.warn(`Google Places API returned status: ${response.data.status}`);
        return { results: [] };
      }

      return {
        results: response.data.results || [],
        nextPageToken: response.data.next_page_token,
      };
    } catch (error) {
      this.handleApiError(error);
      return { results: [] };
    }
  }

  /**
   * Get detailed place information by place_id
   */
  async getPlaceDetails(placeId: string): Promise<GooglePlaceResult | null> {
    const params = {
      place_id: placeId,
      fields: 'place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,geometry,url',
      key: this.apiKey,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/details/json`, { params }),
      );

      if (response.data.status === 'OK') {
        return response.data.result;
      }

      this.logger.warn(`Failed to get place details for ${placeId}: ${response.data.status}`);
      return null;
    } catch (error) {
      this.handleApiError(error);
      return null;
    }
  }

  /**
   * Search with automatic pagination up to maxResults
   */
  async searchWithPagination(
    query: string,
    location: { lat: number; lng: number; radius: number } | undefined,
    maxResults: number,
  ): Promise<GooglePlaceResult[]> {
    const allResults: GooglePlaceResult[] = [];
    let pageToken: string | undefined = undefined;
    let pageCount = 0;
    const maxPages = 3; // Google allows up to 3 pages

    while (allResults.length < maxResults && pageCount < maxPages) {
      const { results, nextPageToken } = await this.textSearch(query, location, pageToken);
      
      if (results.length === 0) {
        break;
      }

      // Enrich results with detailed information
      const enrichedResults = await this.enrichResults(results);
      allResults.push(...enrichedResults);

      pageToken = nextPageToken;
      pageCount++;

      if (!pageToken) {
        break;
      }

      this.logger.log(`Fetched page ${pageCount}, total results so far: ${allResults.length}`);
    }

    return allResults.slice(0, maxResults);
  }

  /**
   * Enrich basic search results with detailed information
   */
  private async enrichResults(results: GooglePlaceResult[]): Promise<GooglePlaceResult[]> {
    const enrichedResults: GooglePlaceResult[] = [];

    for (const result of results) {
      try {
        const details = await this.getPlaceDetails(result.place_id);
        if (details) {
          enrichedResults.push(details);
        } else {
          // Fallback to basic result if details fetch fails
          enrichedResults.push(result);
        }
        // Small delay to avoid rate limiting
        await this.delay(100);
      } catch (error) {
        this.logger.warn(`Failed to enrich result for ${result.place_id}, using basic info`);
        enrichedResults.push(result);
      }
    }

    return enrichedResults;
  }

  private handleApiError(error: any): void {
    if (error instanceof AxiosError) {
      this.logger.error(
        `Google Places API error: ${error.message}`,
        error.response?.data,
      );
    } else {
      this.logger.error('Unexpected error calling Google Places API', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
