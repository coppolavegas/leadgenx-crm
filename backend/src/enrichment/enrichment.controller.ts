import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { EnrichmentQueueService } from './services/enrichment-queue.service';
import { EnrichmentService } from './services/enrichment.service';
import { EnrichLeadDto, EnrichBatchDto } from './dto/enrich.dto';
import { EnrichmentResultDto, EnrichmentJobDto, EnrichmentStatsDto } from './dto/enrichment-result.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@ApiTags('Enrichment')
@Controller('enrich')
@UseGuards(ApiKeyGuard)
@ApiSecurity('X-API-Key')
export class EnrichmentController {
  private readonly logger = new Logger(EnrichmentController.name);

  constructor(
    private readonly enrichmentQueue: EnrichmentQueueService,
    private readonly enrichmentService: EnrichmentService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Enqueue a lead for enrichment' })
  @ApiResponse({
    status: 202,
    description: 'Enrichment job queued successfully',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        leadId: { type: 'string' },
        status: { type: 'string', example: 'queued' },
      },
    },
  })
  async enrich(@Body() dto: EnrichLeadDto) {
    const jobId = await this.enrichmentQueue.addEnrichmentJob(dto.leadId, dto.dryRun);

    return {
      jobId,
      leadId: dto.leadId,
      status: 'queued',
    };
  }

  @Post('batch')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Enqueue multiple leads for enrichment' })
  @ApiResponse({
    status: 202,
    description: 'Batch enrichment jobs queued successfully',
    schema: {
      type: 'object',
      properties: {
        jobIds: { type: 'array', items: { type: 'string' } },
        count: { type: 'number' },
      },
    },
  })
  async enrichBatch(@Body() dto: EnrichBatchDto) {
    const jobIds = await this.enrichmentQueue.addBatchEnrichmentJobs(dto.leadIds);

    return {
      jobIds,
      count: jobIds.length,
    };
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get enrichment job status' })
  @ApiResponse({ status: 200, description: 'Job status retrieved', type: EnrichmentJobDto })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobStatus(@Param('jobId') jobId: string) {
    const status = await this.enrichmentQueue.getJobStatus(jobId);

    if (!status) {
      return {
        jobId,
        status: 'not_found',
      };
    }

    return status;
  }

  @Get(':leadId')
  @ApiOperation({ summary: 'Get enrichment result for a lead' })
  @ApiResponse({ status: 200, description: 'Enrichment result retrieved', type: EnrichmentResultDto })
  @ApiResponse({ status: 404, description: 'Enrichment not found' })
  async getEnrichment(@Param('leadId') leadId: string) {
    const enrichment = await this.enrichmentService.getEnrichment(leadId);

    if (!enrichment) {
      return {
        leadId,
        status: 'not_enriched',
      };
    }

    return enrichment;
  }

  @Get()
  @ApiOperation({ summary: 'Get enrichment statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved', type: EnrichmentStatsDto })
  async getStats() {
    return await this.enrichmentService.getStats();
  }

  @Post('dry-run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test enrichment without persisting (dry run)' })
  @ApiResponse({ status: 200, description: 'Dry run completed', type: EnrichmentResultDto })
  async dryRun(@Body() dto: EnrichLeadDto) {
    const result = await this.enrichmentService.enrichLead(dto.leadId, true);
    return result;
  }

  // =================
  // Phase 13: Verified Match Scoring & Evidence-Based Trust Layer
  // =================

  @Post(':leadId/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Run verification on an enriched lead',
    description:
      'Phase 13: Verifies features against enrichment data and calculates verified/preference scores',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification completed',
    schema: {
      type: 'object',
      properties: {
        feature_matches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              match_type: { type: 'string', enum: ['verified', 'preference'] },
              evidence: {
                type: 'object',
                properties: {
                  page_url: { type: 'string' },
                  snippet: { type: 'string' },
                },
              },
              confidence: { type: 'number' },
            },
          },
        },
        verified_score: { type: 'number' },
        preference_score: { type: 'number' },
        final_score: { type: 'number' },
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
  async verifyLead(
    @Param('leadId') leadId: string,
    @Body() body?: { campaignId?: string },
  ) {
    return await this.enrichmentService.verifyEnrichedLead(
      leadId,
      body?.campaignId,
    );
  }
}
