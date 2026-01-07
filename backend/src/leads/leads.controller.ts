import { Controller, Get, Param, Query, Logger, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiSecurity } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { FilterLeadsDto } from './dto/filter-leads.dto';
import { LeadResponseDto } from '../discovery/dto/lead-response.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { VerificationService } from '../enrichment/services/verification.service';

@ApiTags('Leads')
@Controller('leads')
@UseGuards(ApiKeyGuard)
@ApiSecurity('X-API-Key')
export class LeadsController {
  private readonly logger = new Logger(LeadsController.name);

  constructor(
    private readonly leadsService: LeadsService,
    private readonly verificationService: VerificationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all leads with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Leads retrieved successfully' })
  async findAll(@Query() filterDto: FilterLeadsDto) {
    this.logger.log('Fetching leads with filters');
    return this.leadsService.findAll(filterDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get lead statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats() {
    this.logger.log('Fetching lead statistics');
    return this.leadsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single lead by ID' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Lead found', type: LeadResponseDto })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async findOne(@Param('id') id: string): Promise<LeadResponseDto> {
    this.logger.log(`Fetching lead with ID: ${id}`);
    return this.leadsService.findOne(id);
  }

  // Phase 13: Explainability endpoint
  @Get(':id/explain')
  @ApiOperation({
    summary: 'Get lead verification explanation',
    description:
      'Phase 13: Returns detailed explanation of verified/preference features with evidence snippets',
  })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({
    status: 200,
    description: 'Explanation retrieved',
    schema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string' },
        lead_name: { type: 'string' },
        verified_features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              evidence_snippet: { type: 'string' },
              page_url: { type: 'string' },
            },
          },
        },
        preference_features: {
          type: 'array',
          items: { type: 'string' },
        },
        exclusions_triggered: {
          type: 'array',
          items: { type: 'string' },
        },
        scoring_breakdown: {
          type: 'object',
          properties: {
            verified: { type: 'number' },
            preference: { type: 'number' },
            intent: { type: 'number' },
            freshness: { type: 'number' },
            total: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Enriched lead not found' })
  async explainLead(@Param('id') id: string) {
    this.logger.log(`Getting explanation for lead ${id}`);
    return await this.verificationService.getLeadExplanation(id);
  }
}
