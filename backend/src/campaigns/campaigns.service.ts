import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiscoveryService } from '../discovery/discovery.service';
import { EnrichmentService } from '../enrichment/services/enrichment.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { RunCampaignDto } from './dto/run-campaign.dto';
import { CampaignLeadsQueryDto } from './dto/campaign-leads-query.dto';
import { UpdateBriefDto } from './dto/update-brief.dto';
import { BriefParserService } from './services/brief-parser.service';
import { WebsiteAnalyzerService } from './services/website-analyzer.service';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private prisma: PrismaService,
    private discoveryService: DiscoveryService,
    private enrichmentService: EnrichmentService,
    private briefParserService: BriefParserService,
    private websiteAnalyzerService: WebsiteAnalyzerService,
  ) {}

  async create(organizationId: string, createCampaignDto: CreateCampaignDto) {
    this.logger.log(`Creating campaign for organization ${organizationId}`);

    // If client_id provided, verify it belongs to the organization
    if (createCampaignDto.client_id) {
      const client = await this.prisma.client.findFirst({
        where: {
          id: createCampaignDto.client_id,
          organization_id: organizationId,
        },
      });

      if (!client) {
        throw new BadRequestException('Client not found or does not belong to organization');
      }
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        organization_id: organizationId,
        ...createCampaignDto,
        discovery_config: createCampaignDto.discovery_config || {},
        intent_config: createCampaignDto.intent_config || {},
        enrichment_config: createCampaignDto.enrichment_config || {},
        scoring_weights: createCampaignDto.scoring_weights || {},
      },
      include: {
        client: true,
      },
    });

    this.logger.log(`Campaign created: ${campaign.id}`);
    return campaign;
  }

  async findAll(organizationId: string, clientId?: string) {
    try {
      this.logger.log(`Fetching campaigns for organization: ${organizationId}${clientId ? `, client: ${clientId}` : ''}`);
      
      const where: any = { organization_id: organizationId };
      if (clientId) {
        where.client_id = clientId;
      }

      const campaigns = await this.prisma.campaign.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              campaign_leads: true,
              runs: true,
            },
          },
        },
      });

      this.logger.log(`Found ${campaigns.length} campaigns`);
      return campaigns;
    } catch (error) {
      this.logger.error(`Error fetching campaigns for organization ${organizationId}:`, error);
      throw error;
    }
  }

  async findOne(organizationId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        organization_id: organizationId,
      },
      include: {
        client: true,
        _count: {
          select: {
            campaign_leads: true,
            runs: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return campaign;
  }

  async update(organizationId: string, id: string, updateCampaignDto: UpdateCampaignDto) {
    // Verify campaign exists and belongs to organization
    await this.findOne(organizationId, id);

    // If client_id is being updated, verify it belongs to the organization
    if (updateCampaignDto.client_id) {
      const client = await this.prisma.client.findFirst({
        where: {
          id: updateCampaignDto.client_id,
          organization_id: organizationId,
        },
      });

      if (!client) {
        throw new BadRequestException('Client not found or does not belong to organization');
      }
    }

    const campaign = await this.prisma.campaign.update({
      where: { id },
      data: updateCampaignDto,
      include: {
        client: true,
      },
    });

    this.logger.log(`Campaign updated: ${campaign.id}`);
    return campaign;
  }

  async remove(organizationId: string, id: string) {
    // Verify campaign exists and belongs to organization
    await this.findOne(organizationId, id);

    await this.prisma.campaign.delete({
      where: { id },
    });

    this.logger.log(`Campaign deleted: ${id}`);
    return { message: 'Campaign deleted successfully' };
  }

  /**
   * Run a campaign - discovers leads and enriches them
   */
  async runCampaign(organizationId: string, campaignId: string, runDto: RunCampaignDto = {}) {
    const campaign = await this.findOne(organizationId, campaignId);

    if (campaign.status === 'archived') {
      throw new BadRequestException('Cannot run archived campaigns');
    }

    this.logger.log(`Starting campaign run: ${campaignId}`);

    // Create campaign run record
    const campaignRun = await this.prisma.campaign_run.create({
      data: {
        campaign_id: campaignId,
        run_type: runDto.run_type || 'manual',
        status: 'running',
        logs: ['Campaign run started'],
      },
    });

    try {
      const stats = {
        intent_signals_found: 0,
        leads_discovered: 0,
        leads_upserted: 0,
        leads_enriched: 0,
        lead_ready_count: 0,
        bot_block_rate: 0,
        avg_enrich_ms: 0,
      };

      const logs: string[] = ['Campaign run started'];

      // Step 1: Discovery
      if (campaign.sources_google_places) {
        logs.push('Running Google Places discovery...');
        
        const discoveryConfig = campaign.discovery_config as any;

        try {
          const discoveryResult = await this.discoveryService.discoverLeads({
            industry: campaign.vertical,
            keywords: discoveryConfig?.keywords,
            location: {
              city: campaign.geo_city || undefined,
              state: campaign.geo_state || undefined,
              latitude: campaign.geo_lat || undefined,
              longitude: campaign.geo_lng || undefined,
              radius: campaign.geo_radius_miles ? campaign.geo_radius_miles * 1609 : undefined, // Convert miles to meters
            },
            maxLeads: 50,
          });

          stats.leads_discovered = discoveryResult.new_count || 0;
          logs.push(`Discovered ${stats.leads_discovered} leads from Google Places`);
        } catch (error) {
          logs.push(`Discovery error: ${error.message}`);
          this.logger.error(`Discovery error in campaign ${campaignId}:`, error);
        }
      }

      // Step 2: Link discovered leads to campaign
      // Find leads matching campaign criteria that were discovered recently
      const recentLeads = await this.prisma.lead.findMany({
        where: {
          discovered_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        include: {
          enriched_lead: true,
        },
        take: 100, // Limit to avoid overload
      });

      stats.leads_upserted = recentLeads.length;
      logs.push(`Processing ${recentLeads.length} leads for campaign...`);

      // Step 3: Create campaign_lead records and enrich
      let enrichedCount = 0;
      let totalEnrichTime = 0;

      for (const lead of recentLeads) {
        // Check if lead is already in this campaign
        const existingCampaignLead = await this.prisma.campaign_lead.findUnique({
          where: {
            campaign_id_lead_id: {
              campaign_id: campaignId,
              lead_id: lead.id,
            },
          },
        });

        if (!existingCampaignLead) {
          // Calculate campaign-specific score
          const campaignScore = this.calculateCampaignScore(lead, campaign);

          // Create campaign_lead record
          await this.prisma.campaign_lead.create({
            data: {
              campaign_id: campaignId,
              lead_id: lead.id,
              campaign_score: campaignScore,
              stage: 'new',
            },
          });
        }

        // Step 4: Enrich lead if it has a website and hasn't been enriched yet
        if (lead.website && !lead.enriched_lead) {
          try {
            const startTime = Date.now();
            
            // Note: enrichLead only takes leadId and optional dryRun boolean
            // Enrichment config from campaign is not directly passed here
            await this.enrichmentService.enrichLead(lead.id, false);

            const enrichTime = Date.now() - startTime;
            totalEnrichTime += enrichTime;
            enrichedCount++;
          } catch (error) {
            this.logger.warn(`Failed to enrich lead ${lead.id}: ${error.message}`);
          }
        }
      }

      stats.leads_enriched = enrichedCount;
      stats.avg_enrich_ms = enrichedCount > 0 ? Math.round(totalEnrichTime / enrichedCount) : 0;

      // Count lead-ready (has contact info)
      const leadReadyCount = await this.prisma.campaign_lead.count({
        where: {
          campaign_id: campaignId,
          lead: {
            OR: [
              { phone: { not: null } },
              { contact_page_url: { not: null } },
              { enriched_lead: { emails_found: { isEmpty: false } } },
            ],
          },
        },
      });

      stats.lead_ready_count = leadReadyCount;
      logs.push(`Campaign run completed: ${stats.leads_discovered} discovered, ${stats.leads_enriched} enriched, ${stats.lead_ready_count} ready`);

      // Update campaign run with success
      await this.prisma.campaign_run.update({
        where: { id: campaignRun.id },
        data: {
          status: 'success',
          finished_at: new Date(),
          stats,
          logs,
        },
      });

      // Update campaign last_run_at
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { last_run_at: new Date() },
      });

      this.logger.log(`Campaign run completed: ${campaignRun.id}`);

      return {
        run_id: campaignRun.id,
        status: 'success',
        stats,
      };
    } catch (error) {
      // Update campaign run with failure
      await this.prisma.campaign_run.update({
        where: { id: campaignRun.id },
        data: {
          status: 'failed',
          finished_at: new Date(),
          error: error.message,
          logs: [`Campaign run failed: ${error.message}`],
        },
      });

      this.logger.error(`Campaign run failed: ${campaignRun.id}`, error);

      throw error;
    }
  }

  /**
   * Get all runs for a campaign
   */
  async getCampaignRuns(organizationId: string, campaignId: string) {
    // Verify campaign belongs to organization
    await this.findOne(organizationId, campaignId);

    return this.prisma.campaign_run.findMany({
      where: { campaign_id: campaignId },
      orderBy: { started_at: 'desc' },
    });
  }

  /**
   * Get leads for a campaign with filters
   */
  async getCampaignLeads(organizationId: string, campaignId: string, query: CampaignLeadsQueryDto) {
    // Verify campaign belongs to organization
    await this.findOne(organizationId, campaignId);

    const { stage, min_score, lead_ready, intent_strength, page = 1, limit = 50 } = query;

    const where: any = { campaign_id: campaignId };

    if (stage) {
      where.stage = stage;
    }

    if (min_score !== undefined) {
      where.campaign_score = { gte: min_score };
    }

    if (lead_ready) {
      where.lead = {
        OR: [
          { phone: { not: null } },
          { contact_page_url: { not: null } },
          { enriched_lead: { emails_found: { isEmpty: false } } },
        ],
      };
    }

    const skip = (page - 1) * limit;

    const [campaignLeads, total] = await Promise.all([
      this.prisma.campaign_lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { campaign_score: 'desc' },
        include: {
          lead: {
            include: {
              enriched_lead: true,
            },
          },
        },
      }),
      this.prisma.campaign_lead.count({ where }),
    ]);

    return {
      data: campaignLeads,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Calculate campaign-specific score for a lead
   */
  private calculateCampaignScore(lead: any, campaign: any): number {
    const weights = campaign.scoring_weights as any || {};
    
    let score = 0;
    let maxScore = 0;

    // Phone weight
    const phoneWeight = weights.phone_weight || 20;
    maxScore += phoneWeight;
    if (lead.phone) score += phoneWeight;

    // Email weight (check if enriched)
    const emailWeight = weights.email_weight || 25;
    maxScore += emailWeight;
    if (lead.enriched_lead?.emails_found?.length > 0) score += emailWeight;

    // Contact form weight
    const formWeight = weights.form_weight || 15;
    maxScore += formWeight;
    if (lead.contact_page_url || lead.enriched_lead?.contact_form_url) score += formWeight;

    // Website quality (rating)
    const ratingWeight = weights.rating_weight || 20;
    maxScore += ratingWeight;
    if (lead.rating && lead.rating >= 4.0) {
      score += ratingWeight * (lead.rating / 5.0);
    }

    // Review count
    const reviewWeight = weights.review_weight || 10;
    maxScore += reviewWeight;
    if (lead.review_count && lead.review_count > 0) {
      score += Math.min(reviewWeight, (lead.review_count / 50) * reviewWeight);
    }

    // Freshness (recently discovered)
    const freshnessWeight = weights.freshness_weight || 10;
    maxScore += freshnessWeight;
    const daysSinceDiscovery = (Date.now() - new Date(lead.discovered_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDiscovery < 7) {
      score += freshnessWeight * (1 - daysSinceDiscovery / 7);
    }

    // Normalize to 0-100
    const normalizedScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    return Math.min(100, Math.max(0, normalizedScore));
  }

  // ==================== CLIENT BRIEF METHODS (Phase 11.5) ====================

  /**
   * Update campaign brief and generate targeting profile
   */
  async updateBrief(campaignId: string, organizationId: string, updateBriefDto: UpdateBriefDto) {
    this.logger.log(`Updating brief for campaign ${campaignId}`);

    // Verify campaign belongs to organization
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, organization_id: organizationId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Generate targeting profile from brief
    const targetingProfile = await this.briefParserService.generateTargetingProfile(
      updateBriefDto.client_brief
    );

    // Update campaign with brief and targeting profile
    const updatedCampaign = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        client_brief: updateBriefDto.client_brief,
        targeting_profile: targetingProfile as any,
        targeting_profile_updated_at: new Date(),
      },
      include: {
        client: true,
      },
    });

    this.logger.log(`Generated targeting profile for campaign ${campaignId}`);

    return {
      campaign: updatedCampaign,
      targeting_profile: targetingProfile,
    };
  }

  /**
   * Get campaign brief and targeting profile
   */
  async getBrief(campaignId: string, organizationId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, organization_id: organizationId },
      select: {
        id: true,
        name: true,
        client_brief: true,
        targeting_profile: true,
        targeting_profile_updated_at: true,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return {
      client_brief: campaign.client_brief,
      targeting_profile: campaign.targeting_profile,
      updated_at: campaign.targeting_profile_updated_at,
    };
  }

  /**
   * Apply targeting profile to campaign settings
   * Updates discovery_config and scoring_weights based on targeting profile
   */
  async applyTargetingProfile(campaignId: string, organizationId: string) {
    this.logger.log(`Applying targeting profile to campaign ${campaignId}`);

    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, organization_id: organizationId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (!campaign.targeting_profile) {
      throw new BadRequestException('No targeting profile found. Please update the brief first.');
    }

    const profile = campaign.targeting_profile as any;
    const currentDiscoveryConfig = (campaign.discovery_config as any) || {};
    const currentScoringWeights = (campaign.scoring_weights as any) || {};

    // Merge targeting profile into discovery config
    const updatedDiscoveryConfig = {
      ...currentDiscoveryConfig,
      keywords: [
        ...(currentDiscoveryConfig.keywords || []),
        ...(profile.suggested_keywords || []),
      ],
      negative_keywords: [
        ...(currentDiscoveryConfig.negative_keywords || []),
        ...(profile.suggested_negative_keywords || []),
      ],
    };

    // Merge scoring overrides
    const updatedScoringWeights = {
      ...currentScoringWeights,
      ...profile.suggested_scoring_overrides,
    };

    // Update campaign
    const updatedCampaign = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        discovery_config: updatedDiscoveryConfig,
        scoring_weights: updatedScoringWeights,
      },
      include: {
        client: true,
      },
    });

    this.logger.log(`Applied targeting profile to campaign ${campaignId}`);

    return {
      campaign: updatedCampaign,
      changes: {
        keywords_added: profile.suggested_keywords?.length || 0,
        negative_keywords_added: profile.suggested_negative_keywords?.length || 0,
        scoring_weights_updated: Object.keys(profile.suggested_scoring_overrides || {}).length,
      },
    };
  }

  // ==================== CAMPAIGN LIFECYCLE (Phase 12) ====================

  async launchCampaign(campaignId: string, organizationId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: campaignId,
        organization_id: organizationId,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== 'draft') {
      throw new BadRequestException('Only draft campaigns can be launched');
    }

    // Validate required fields
    if (!campaign.geo_city || !campaign.geo_state || !campaign.geo_country) {
      throw new BadRequestException('Location is required (city, state, country)');
    }

    if (!campaign.geo_radius_miles) {
      throw new BadRequestException('Radius is required');
    }

    const updatedCampaign = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'active',
      },
      include: {
        client: true,
      },
    });

    this.logger.log(`Campaign ${campaignId} launched (status: active)`);

    return updatedCampaign;
  }

  // ==================== WEBSITE INTELLIGENCE (Phase 11.7) ====================

  async analyzeWebsite(campaignId: string, organizationId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: campaignId,
        organization_id: organizationId,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (!campaign.website_url) {
      throw new BadRequestException('No website URL provided. Please set website_url first.');
    }

    this.logger.log(`Starting website analysis for campaign ${campaignId}: ${campaign.website_url}`);

    // Analyze the website
    const websiteAnalysis = await this.websiteAnalyzerService.analyzeWebsite(campaign.website_url);

    // Update campaign with analysis
    const updatedCampaign = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        website_analysis: websiteAnalysis as any,
        website_analysis_updated_at: new Date(),
      },
      include: {
        client: true,
      },
    });

    this.logger.log(
      `Website analysis complete for campaign ${campaignId}: ` +
      `${websiteAnalysis.pages_analyzed.length} pages, ` +
      `${websiteAnalysis.services_offered.length} services, ` +
      `confidence ${websiteAnalysis.confidence_score}`,
    );

    return {
      campaign: updatedCampaign,
      website_analysis: websiteAnalysis,
    };
  }

  async getWebsiteAnalysis(campaignId: string, organizationId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: campaignId,
        organization_id: organizationId,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (!campaign.website_analysis) {
      throw new NotFoundException('No website analysis available. Run analysis first.');
    }

    return {
      campaign_id: campaign.id,
      website_url: campaign.website_url,
      website_analysis: campaign.website_analysis,
      website_analysis_updated_at: campaign.website_analysis_updated_at,
    };
  }

  async applyWebsiteAnalysis(campaignId: string, organizationId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: campaignId,
        organization_id: organizationId,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (!campaign.website_analysis) {
      throw new BadRequestException('No website analysis found. Please analyze website first.');
    }

    const websiteAnalysis = campaign.website_analysis as any;
    const currentDiscoveryConfig = (campaign.discovery_config as any) || {};

    // Existing keywords and negative keywords (from template + brief)
    const existingKeywords = currentDiscoveryConfig.keywords || [];
    const existingNegativeKeywords = currentDiscoveryConfig.negative_keywords || [];

    // New keywords from website analysis
    const websiteKeywords = websiteAnalysis.suggested_keywords || [];
    const websiteNegativeKeywords = websiteAnalysis.suggested_negative_keywords || [];

    // Merge keywords (avoid duplicates, respect existing exclusions)
    const mergedKeywords = [
      ...new Set([
        ...existingKeywords,
        ...websiteKeywords.filter((k: string) => !existingNegativeKeywords.includes(k)),
      ]),
    ];

    // Merge negative keywords (avoid duplicates, don't override explicit exclusions)
    const mergedNegativeKeywords = [
      ...new Set([
        ...existingNegativeKeywords,
        ...websiteNegativeKeywords,
      ]),
    ];

    // Update discovery config
    const updatedDiscoveryConfig = {
      ...currentDiscoveryConfig,
      keywords: mergedKeywords,
      negative_keywords: mergedNegativeKeywords,
    };

    // Update campaign
    const updatedCampaign = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        discovery_config: updatedDiscoveryConfig,
      },
      include: {
        client: true,
      },
    });

    this.logger.log(`Applied website analysis to campaign ${campaignId}`);

    return {
      campaign: updatedCampaign,
      changes: {
        keywords_added: websiteKeywords.length,
        negative_keywords_added: websiteNegativeKeywords.length,
        services_detected: websiteAnalysis.services_offered?.length || 0,
        industries_detected: websiteAnalysis.industries?.length || 0,
      },
    };
  }
}
