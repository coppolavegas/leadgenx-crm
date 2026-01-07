import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { RunCampaignDto } from './dto/run-campaign.dto';
import { CampaignLeadsQueryDto } from './dto/campaign-leads-query.dto';
import { UpdateBriefDto } from './dto/update-brief.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { TemplateService } from './services/template.service';
import { VerificationService } from '../enrichment/services/verification.service';

@ApiTags('Campaigns')
@Controller('campaigns')
@UseGuards(ApiKeyGuard)
@ApiSecurity('X-API-Key')
export class CampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly templateService: TemplateService,
    private readonly verificationService: VerificationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Request() req: any, @Body() createCampaignDto: CreateCampaignDto) {
    return this.campaignsService.create(req.organizationId, createCampaignDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all campaigns for the organization' })
  @ApiQuery({ name: 'client_id', required: false, description: 'Filter by client ID' })
  @ApiResponse({ status: 200, description: 'List of campaigns' })
  async findAll(@Request() req: any, @Query('client_id') clientId?: string) {
    try {
      // Validate organizationId exists
      if (!req.organizationId) {
        throw new Error('Organization ID not found in request. API key may be invalid.');
      }
      
      return await this.campaignsService.findAll(req.organizationId, clientId);
    } catch (error) {
      console.error('Error in campaigns findAll:', error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific campaign by ID' })
  @ApiResponse({ status: 200, description: 'Campaign details' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.campaignsService.findOne(req.organizationId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign updated successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(req.organizationId, id, updateCampaignDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign deleted successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.campaignsService.remove(req.organizationId, id);
  }

  @Post(':id/run')
  @ApiOperation({ 
    summary: 'Run a campaign',
    description: 'Executes the campaign: discovers leads from configured sources, links them to the campaign, and enriches them with contact information',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Campaign run started successfully',
    schema: {
      example: {
        run_id: 'run-uuid-here',
        status: 'success',
        stats: {
          intent_signals_found: 0,
          leads_discovered: 25,
          leads_upserted: 25,
          leads_enriched: 18,
          lead_ready_count: 20,
          bot_block_rate: 0,
          avg_enrich_ms: 2500,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request (e.g., archived campaign)' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  runCampaign(
    @Request() req: any,
    @Param('id') id: string,
    @Body() runDto: RunCampaignDto,
  ) {
    return this.campaignsService.runCampaign(req.organizationId, id, runDto);
  }

  @Get(':id/runs')
  @ApiOperation({ summary: 'Get all runs for a campaign' })
  @ApiResponse({ status: 200, description: 'List of campaign runs' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  getCampaignRuns(@Request() req: any, @Param('id') id: string) {
    return this.campaignsService.getCampaignRuns(req.organizationId, id);
  }

  @Get(':id/leads')
  @ApiOperation({ 
    summary: 'Get leads for a campaign',
    description: 'Returns paginated list of leads linked to this campaign with campaign-specific scores and stages',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Paginated list of campaign leads',
    schema: {
      example: {
        data: [
          {
            id: 'campaign-lead-uuid',
            campaign_id: 'campaign-uuid',
            lead_id: 'lead-uuid',
            campaign_score: 85,
            stage: 'new',
            tags: [],
            notes: null,
            created_at: '2025-01-01T00:00:00.000Z',
            lead: {
              id: 'lead-uuid',
              name: 'Acme Recording Studio',
              phone: '+1234567890',
              website: 'https://acme.com',
              enriched_lead: {
                emails_found: [{ email: 'contact@acme.com' }],
              },
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 100,
          total_pages: 2,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  getCampaignLeads(
    @Request() req: any,
    @Param('id') id: string,
    @Query() query: CampaignLeadsQueryDto,
  ) {
    return this.campaignsService.getCampaignLeads(req.organizationId, id, query);
  }

  // ==================== CLIENT BRIEF ENDPOINTS (Phase 11.5) ====================

  @Patch(':id/brief')
  @ApiOperation({ 
    summary: 'Update campaign client brief',
    description: 'Updates the client brief and automatically generates a structured targeting profile using rule-based extraction',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Brief updated and targeting profile generated',
    schema: {
      example: {
        campaign: {
          id: 'campaign-uuid',
          name: 'Recording Studios - Portland',
          client_brief: 'We need recording studios that do mixing/mastering, offer late-night sessions, and have online booking.',
          targeting_profile: {
            must_have_features: ['mixing/mastering', 'late-night sessions', 'online booking'],
            nice_to_have_features: [],
            excluded_features: [],
            suggested_keywords: ['mixing', 'mastering', 'recording', 'late-night', 'online booking'],
            suggested_negative_keywords: [],
            preferred_contact_methods: ['form', 'email', 'phone'],
            priority_geo_notes: [],
            suggested_scoring_overrides: {
              phone_weight: 35,
              email_weight: 35,
              form_weight: 30,
              intent_weight: 15,
            },
            extraction_method: 'rule_based',
            confidence_score: 0.85,
          },
          targeting_profile_updated_at: '2025-12-28T22:00:00.000Z',
        },
        targeting_profile: {},
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  updateBrief(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateBriefDto: UpdateBriefDto,
  ) {
    return this.campaignsService.updateBrief(id, req.organizationId, updateBriefDto);
  }

  @Get(':id/brief')
  @ApiOperation({ 
    summary: 'Get campaign brief and targeting profile',
    description: 'Returns the current client brief and generated targeting profile',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Campaign brief and targeting profile',
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  getBrief(@Request() req: any, @Param('id') id: string) {
    return this.campaignsService.getBrief(id, req.organizationId);
  }

  @Post(':id/brief/apply')
  @ApiOperation({ 
    summary: 'Apply targeting profile to campaign settings',
    description: 'Applies the targeting profile suggestions to discovery_config (keywords, negative_keywords) and scoring_weights',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Targeting profile applied successfully',
    schema: {
      example: {
        campaign: {},
        changes: {
          keywords_added: 5,
          negative_keywords_added: 0,
          scoring_weights_updated: 4,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'No targeting profile found' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  applyTargetingProfile(@Request() req: any, @Param('id') id: string) {
    return this.campaignsService.applyTargetingProfile(id, req.organizationId);
  }

  // ==================== WEBSITE INTELLIGENCE (Phase 11.7) ====================

  @Post(':id/website/analyze')
  @ApiOperation({ 
    summary: 'Analyze website and extract business intelligence',
    description: 'Crawls the website URL and extracts business summary, services, industries, keywords, and value propositions',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Website analyzed successfully',
    schema: {
      example: {
        campaign: {
          id: 'campaign-uuid',
          name: 'Recording Studios - Portland',
          website_url: 'https://example.com',
          website_analysis: {
            url: 'https://example.com',
            crawled_at: '2025-12-28T23:00:00.000Z',
            pages_analyzed: [{ url: 'https://example.com', page_type: 'homepage' }],
            business_summary: 'Professional recording studio...',
            services_offered: ['Recording', 'Mixing', 'Mastering'],
            industries: ['Entertainment', 'Music'],
            suggested_keywords: ['recording studio', 'professional audio'],
            suggested_negative_keywords: [],
            confidence_score: 0.85,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'No website URL provided or invalid URL' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  analyzeWebsite(@Request() req: any, @Param('id') id: string) {
    return this.campaignsService.analyzeWebsite(id, req.organizationId);
  }

  @Get(':id/website')
  @ApiOperation({ 
    summary: 'Get website analysis for campaign',
    description: 'Returns the website analysis data if available',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Website analysis data',
  })
  @ApiResponse({ status: 404, description: 'Campaign not found or no website analysis available' })
  getWebsiteAnalysis(@Request() req: any, @Param('id') id: string) {
    return this.campaignsService.getWebsiteAnalysis(id, req.organizationId);
  }

  @Post(':id/website/apply')
  @ApiOperation({ 
    summary: 'Apply website analysis to campaign settings',
    description: 'Merges website analysis insights into discovery_config. Combines with existing brief targeting without overriding explicit exclusions.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Website analysis applied successfully',
    schema: {
      example: {
        campaign: {},
        changes: {
          keywords_added: 8,
          services_added: 3,
          industries_detected: 2,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'No website analysis found' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  applyWebsiteAnalysis(@Request() req: any, @Param('id') id: string) {
    return this.campaignsService.applyWebsiteAnalysis(id, req.organizationId);
  }

  // ==================== CAMPAIGN LIFECYCLE (Phase 12) ====================

  @Post(':id/launch')
  @ApiOperation({ 
    summary: 'Launch a campaign',
    description: 'Changes campaign status from draft to active, making it ready for execution',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Campaign launched successfully',
    schema: {
      example: {
        id: 'campaign-uuid',
        name: 'Recording Studios - Portland',
        status: 'active',
        vertical: 'Recording Studio',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Campaign is not in draft status' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  launchCampaign(@Request() req: any, @Param('id') id: string) {
    return this.campaignsService.launchCampaign(id, req.organizationId);
  }

  // ==================== TEMPLATES (Phase 12) ====================

  @Get('templates/verticals')
  @ApiOperation({ 
    summary: 'Get all campaign templates',
    description: 'Returns a list of pre-configured vertical templates with default settings',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of campaign templates',
    schema: {
      example: [
        {
          id: 'recording-studio',
          name: 'Recording Studio',
          vertical: 'Recording Studio',
          description: 'Target professional recording studios',
          default_categories: ['recording_studio', 'music_production_studio'],
          default_keywords: ['recording studio', 'mixing', 'mastering'],
          default_negative_keywords: ['karaoke', 'party rental'],
          default_min_rating: 4.0,
          default_min_reviews: 10,
          default_scoring_weights: {
            phone_weight: 30,
            email_weight: 35,
            form_weight: 25,
            intent_weight: 10,
            freshness_weight: 5,
          },
          example_brief: 'I need recording studios that offer mixing and mastering...',
        },
      ],
    },
  })
  getAllTemplates() {
    return this.templateService.findAll();
  }

  @Get('templates/verticals/:id')
  @ApiOperation({ 
    summary: 'Get a specific template by ID',
    description: 'Returns details of a single campaign template',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Template details',
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  getTemplateById(@Param('id') id: string) {
    const template = this.templateService.findOne(id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  // Phase 13: Campaign verification summary
  @Get(':id/verification-summary')
  @ApiOperation({
    summary: 'Get campaign verification summary',
    description:
      'Phase 13: Returns statistics on verified features and scores across all campaign leads',
  })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiResponse({
    status: 200,
    description: 'Verification summary',
    schema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string' },
        campaign_name: { type: 'string' },
        total_leads: { type: 'number' },
        verified_leads: { type: 'number', description: 'Leads with at least 1 verified feature' },
        avg_verified_score: { type: 'number' },
        avg_preference_score: { type: 'number' },
        avg_final_score: { type: 'number' },
        top_verified_features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        exclusion_stats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignVerificationSummary(@Param('id') id: string) {
    return await this.verificationService.getCampaignVerificationSummary(id);
  }
}
