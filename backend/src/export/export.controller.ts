import { Controller, Post, Body, Res, Logger, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProduces, ApiSecurity } from '@nestjs/swagger';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { WebhookService } from './webhook.service';
import { ExportFilterDto } from './dto/export-filter.dto';
import { ExportResponseDto } from './dto/export-response.dto';
import { WebhookTestDto, WebhookTestResponseDto } from './dto/webhook-test.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { AuditLogService } from '../common/services/audit-log.service';

@ApiTags('Exports')
@Controller('exports')
@UseGuards(ApiKeyGuard)
@ApiSecurity('X-API-Key')
export class ExportController {
  private readonly logger = new Logger(ExportController.name);

  constructor(
    private readonly exportService: ExportService,
    private readonly webhookService: WebhookService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post('csv')
  @ApiOperation({ 
    summary: 'Export leads as CSV',
    description: 'Export filtered leads with enrichment data, evidence, and deduplication applied'
  })
  @ApiProduces('text/csv')
  @ApiResponse({ status: 200, description: 'CSV file generated successfully' })
  async exportCsv(@Request() req: any, @Body() filterDto: ExportFilterDto, @Res() res: Response) {
    this.logger.log('Exporting leads as CSV');
    
    try {
      const result = await this.exportService.exportCsv(filterDto);

      // Audit log
      await this.auditLogService.log({
        organizationId: req.organization.id,
        apiKeyId: req.apiKey.id,
        action: 'export.csv',
        resourceType: 'lead',
        metadata: { 
          filters: filterDto,
          leadCount: result.split('\n').length - 1, // Approx count
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success',
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=leadgenx-export-${Date.now()}.csv`);
      res.setHeader('Cache-Control', 'no-store');
      res.send(result);
    } catch (error) {
      // Audit log failure
      await this.auditLogService.log({
        organizationId: req.organization.id,
        apiKeyId: req.apiKey.id,
        action: 'export.csv',
        resourceType: 'lead',
        metadata: { filters: filterDto },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failed',
        errorMessage: error.message,
      });
      throw error;
    }
  }

  @Post('json')
  @ApiOperation({ 
    summary: 'Export leads as JSON',
    description: 'Export filtered leads with full enrichment data, evidence tracking, and metadata'
  })
  @ApiProduces('application/json')
  @ApiResponse({ status: 200, description: 'JSON export generated successfully', type: ExportResponseDto })
  async exportJson(@Request() req: any, @Body() filterDto: ExportFilterDto) {
    this.logger.log('Exporting leads as JSON');
    
    try {
      const result = await this.exportService.exportJson(filterDto);

      // Audit log
      await this.auditLogService.log({
        organizationId: req.organization.id,
        apiKeyId: req.apiKey.id,
        action: 'export.json',
        resourceType: 'lead',
        metadata: { 
          filters: filterDto,
          leadCount: result.leads?.length || 0,
          warnings: result.warnings || [],
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success',
      });

      return result;
    } catch (error) {
      // Audit log failure
      await this.auditLogService.log({
        organizationId: req.organization.id,
        apiKeyId: req.apiKey.id,
        action: 'export.json',
        resourceType: 'lead',
        metadata: { filters: filterDto },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failed',
        errorMessage: error.message,
      });
      throw error;
    }
  }
}
