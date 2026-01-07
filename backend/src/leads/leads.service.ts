import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilterLeadsDto } from './dto/filter-leads.dto';
import { LeadResponseDto } from '../discovery/dto/lead-response.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(filterDto: FilterLeadsDto) {
    const { page = 1, limit = 20, source, is_lead, discovered_after, discovered_before, search } = filterDto;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (source) {
      where.source = source;
    }

    if (is_lead !== undefined) {
      where.is_lead = is_lead;
    }

    if (discovered_after || discovered_before) {
      where.discovered_at = {};
      if (discovered_after) {
        where.discovered_at.gte = new Date(discovered_after);
      }
      if (discovered_before) {
        where.discovered_at.lte = new Date(discovered_before);
      }
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Execute query with pagination
    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { discovered_at: 'desc' },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: leads.map(this.mapToResponseDto),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<LeadResponseDto> {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    return this.mapToResponseDto(lead);
  }

  async getStats() {
    try {
      this.logger.log('Fetching lead statistics...');
      
      const [totalLeads, totalDiscovered, bySource, byDate] = await Promise.all([
        this.prisma.lead.count({ where: { is_lead: true } }),
        this.prisma.lead.count(),
        this.getStatsBySource(),
        this.getStatsByDate(),
      ]);

      this.logger.log(`Stats fetched: ${totalLeads} leads, ${totalDiscovered} discovered`);
      
      return {
        total_leads: totalLeads,
        total_discovered: totalDiscovered,
        by_source: bySource,
        recent_discoveries: byDate,
      };
    } catch (error) {
      this.logger.error('Error fetching stats:', error);
      throw error;
    }
  }

  private async getStatsBySource() {
    const results = await this.prisma.lead.groupBy({
      by: ['source'],
      _count: { id: true },
    });

    return results.reduce((acc, item) => {
      acc[item.source] = item._count.id;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getStatsByDate() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all leads from the last 7 days
    const leads = await this.prisma.lead.findMany({
      where: {
        discovered_at: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        discovered_at: true,
      },
    });

    // Group by date in application code
    const countsByDate: Record<string, number> = {};
    for (const lead of leads) {
      const date = lead.discovered_at.toISOString().split('T')[0];
      countsByDate[date] = (countsByDate[date] || 0) + 1;
    }

    // Convert to array format
    return Object.entries(countsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.date.localeCompare(a.date));
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
