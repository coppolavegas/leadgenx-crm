import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Req,
  Logger,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { TimeRangeDto } from './dto/time-range.dto';
import { ExportQueryDto } from './dto/export-query.dto';
import { AnalyticsReportingService } from './services/analytics-reporting.service';
import { AnalyticsAggregationService } from './services/analytics-aggregation.service';
import {
  OverviewComparisonDto,
} from './dto/overview-response.dto';
import { FunnelResponseDto } from './dto/funnel-response.dto';
import { AttributionResponseDto } from './dto/attribution-response.dto';
import { TemplateResponseDto } from './dto/template-response.dto';

/**
 * Phase 16: Analytics & ROI Dashboard Controller
 * Provides analytics endpoints for enterprise ROI tracking
 */
@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(SessionAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(
    private reportingService: AnalyticsReportingService,
    private aggregationService: AnalyticsAggregationService,
  ) {}

  /**
   * Get overview metrics for dashboard
   */
  @Get('overview')
  @ApiOperation({
    summary: 'Get overview analytics metrics',
    description:
      'Returns high-level dashboard metrics including lead flow, conversion rates, and response times',
  })
  @ApiResponse({
    status: 200,
    description: 'Overview metrics retrieved successfully',
  })
  async getOverview(
    @Req() req: any,
    @Query() query: TimeRangeDto,
  ): Promise<OverviewComparisonDto> {
    try {
      const organizationId = req.organizationId || req.user?.organization_id;
      if (!organizationId) {
        throw new HttpException('Organization ID not found', HttpStatus.UNAUTHORIZED);
      }

      const { startDate, endDate } = this.parseDateRange(query);

      this.logger.log(
        `[${organizationId}] GET /overview - Range: ${query.range || '30d'}`,
      );

      const data = await this.reportingService.getOverviewMetrics(
        organizationId,
        query.client_id || null,
        startDate,
        endDate,
        true, // Include comparison
      );

      return data;
    } catch (error) {
      this.logger.error('Failed to fetch overview metrics', error.stack);
      throw new HttpException(
        'Failed to fetch overview metrics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get conversion funnel data
   */
  @Get('funnel')
  @ApiOperation({
    summary: 'Get conversion funnel analytics',
    description:
      'Returns stage-by-stage funnel data showing progression from discovery to conversion',
  })
  @ApiResponse({
    status: 200,
    description: 'Funnel data retrieved successfully',
  })
  async getFunnel(
    @Req() req: any,
    @Query() query: TimeRangeDto,
  ): Promise<FunnelResponseDto> {
    try {
      const organizationId = req.organizationId || req.user?.organization_id;
      if (!organizationId) {
        throw new HttpException('Organization ID not found', HttpStatus.UNAUTHORIZED);
      }
      const { startDate, endDate } = this.parseDateRange(query);

      this.logger.log(
        `[${organizationId}] GET /funnel - Range: ${query.range || '30d'}`,
      );

      const data = await this.reportingService.getFunnelData(
        organizationId,
        query.client_id || null,
        startDate,
        endDate,
      );

      return data;
    } catch (error) {
      this.logger.error('Failed to fetch funnel data', error.stack);
      throw new HttpException(
        'Failed to fetch funnel data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get attribution data (source and campaign performance)
   */
  @Get('attribution')
  @ApiOperation({
    summary: 'Get attribution analytics',
    description:
      'Returns performance metrics by source and campaign for ROI analysis',
  })
  @ApiResponse({
    status: 200,
    description: 'Attribution data retrieved successfully',
  })
  async getAttribution(
    @Req() req: any,
    @Query() query: TimeRangeDto,
  ): Promise<AttributionResponseDto> {
    try {
      const organizationId = req.organizationId || req.user?.organization_id;
      if (!organizationId) {
        throw new HttpException('Organization ID not found', HttpStatus.UNAUTHORIZED);
      }
      const { startDate, endDate } = this.parseDateRange(query);

      this.logger.log(
        `[${organizationId}] GET /attribution - Range: ${query.range || '30d'}`,
      );

      const data = await this.reportingService.getAttributionData(
        organizationId,
        query.client_id || null,
        startDate,
        endDate,
      );

      return data;
    } catch (error) {
      this.logger.error('Failed to fetch attribution data', error.stack);
      throw new HttpException(
        'Failed to fetch attribution data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get template performance metrics
   */
  @Get('templates')
  @ApiOperation({
    summary: 'Get template performance analytics',
    description:
      'Returns performance metrics for email/outreach templates including open rates and reply rates',
  })
  @ApiResponse({
    status: 200,
    description: 'Template performance data retrieved successfully',
  })
  async getTemplates(
    @Req() req: any,
    @Query() query: TimeRangeDto,
  ): Promise<TemplateResponseDto> {
    try {
      const organizationId = req.organizationId || req.user?.organization_id;
      if (!organizationId) {
        throw new HttpException('Organization ID not found', HttpStatus.UNAUTHORIZED);
      }
      const { startDate, endDate } = this.parseDateRange(query);

      this.logger.log(
        `[${organizationId}] GET /templates - Range: ${query.range || '30d'}`,
      );

      const data = await this.reportingService.getTemplatePerformance(
        organizationId,
        query.client_id || null,
        startDate,
        endDate,
      );

      return data;
    } catch (error) {
      this.logger.error('Failed to fetch template performance', error.stack);
      throw new HttpException(
        'Failed to fetch template performance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Export analytics data
   */
  @Get('export')
  @ApiOperation({
    summary: 'Export analytics report',
    description: 'Export analytics data in CSV or JSON format',
  })
  @ApiResponse({
    status: 200,
    description: 'Report exported successfully',
  })
  async exportReport(
    @Req() req: any,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const organizationId = req.organizationId || req.user?.organization_id;
      if (!organizationId) {
        throw new HttpException('Organization ID not found', HttpStatus.UNAUTHORIZED);
      }
      const { startDate, endDate } = this.parseDateRange(query);

      this.logger.log(
        `[${organizationId}] GET /export - Type: ${query.report_type || 'overview'}, Format: ${query.format || 'csv'}`,
      );

      let data: any;

      switch (query.report_type) {
        case 'funnel':
          data = await this.reportingService.getFunnelData(
            organizationId,
            query.client_id || null,
            startDate,
            endDate,
          );
          break;
        case 'attribution':
          data = await this.reportingService.getAttributionData(
            organizationId,
            query.client_id || null,
            startDate,
            endDate,
          );
          break;
        case 'templates':
          data = await this.reportingService.getTemplatePerformance(
            organizationId,
            query.client_id || null,
            startDate,
            endDate,
          );
          break;
        case 'overview':
        default:
          data = await this.reportingService.getOverviewMetrics(
            organizationId,
            query.client_id || null,
            startDate,
            endDate,
            false,
          );
      }

      const reportType = query.report_type || 'overview';
      
      if (query.format === 'csv') {
        const csv = this.convertToCSV(data, reportType);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="analytics_${reportType}_${Date.now()}.csv"`,
        );
        res.send(csv);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="analytics_${reportType}_${Date.now()}.json"`,
        );
        res.send(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      this.logger.error('Failed to export report', error.stack);
      throw new HttpException(
        'Failed to export report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Trigger manual metrics aggregation
   */
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh analytics metrics',
    description:
      'Manually trigger aggregation of analytics metrics from raw data',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics refreshed successfully',
  })
  async refreshMetrics(
    @Req() req: any,
    @Query() query: TimeRangeDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const organizationId = req.organizationId || req.user?.organization_id;
      if (!organizationId) {
        throw new HttpException('Organization ID not found', HttpStatus.UNAUTHORIZED);
      }
      const { startDate, endDate } = this.parseDateRange(query);

      this.logger.log(
        `[${organizationId}] POST /refresh - Range: ${query.range || '30d'}`,
      );

      await this.aggregationService.aggregateMetrics(
        organizationId,
        query.client_id || null,
        startDate,
        endDate,
        'daily',
      );

      return {
        success: true,
        message: 'Metrics refreshed successfully',
      };
    } catch (error) {
      this.logger.error('Failed to refresh metrics', error.stack);
      throw new HttpException(
        'Failed to refresh metrics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Parse date range from query parameters
   */
  private parseDateRange(query: TimeRangeDto): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    if (query.range === 'custom') {
      if (!query.start_date || !query.end_date) {
        throw new HttpException(
          'start_date and end_date required for custom range',
          HttpStatus.BAD_REQUEST,
        );
      }
      startDate = new Date(query.start_date);
      endDate = new Date(query.end_date);
    } else {
      const days =
        query.range === '7d' ? 7 : query.range === '90d' ? 90 : 30;
      startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any, reportType: string): string {
    let rows: any[] = [];
    let headers: string[] = [];

    if (reportType === 'overview') {
      const metrics = data.current;
      headers = Object.keys(metrics);
      rows = [Object.values(metrics)];
    } else if (reportType === 'funnel') {
      if (data.stages && data.stages.length > 0) {
        headers = Object.keys(data.stages[0]);
        rows = data.stages.map((s: any) => Object.values(s));
      }
    } else if (reportType === 'attribution') {
      if (data.sources && data.sources.length > 0) {
        headers = Object.keys(data.sources[0]);
        rows = data.sources.map((s: any) => Object.values(s));
      }
    } else if (reportType === 'templates') {
      if (data.templates && data.templates.length > 0) {
        headers = Object.keys(data.templates[0]);
        rows = data.templates.map((t: any) => Object.values(t));
      }
    }

    if (rows.length === 0) {
      return 'No data available';
    }

    const csvRows = [headers.join(',')];
    for (const row of rows) {
      csvRows.push(row.map((v: any) => `"${v}"`).join(','));
    }

    return csvRows.join('\n');
  }
}
