import { Controller, Post, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AutoGenxWorkerService } from './autogenx-worker.service';
import { AutoGenxService } from './autogenx.service';
import { Public } from '../auth/decorators/public.decorator';

/**
 * AutoGenX Phase 1: Internal Worker Endpoint
 * 
 * SECURITY: This endpoint is protected by X-Worker-Secret header
 * Only internal systems should call this endpoint
 */
@ApiTags('AutoGenX (Internal)')
@Controller('autogenx')
export class AutoGenxController {
  private readonly workerSecret: string;

  constructor(
    private readonly workerService: AutoGenxWorkerService,
    private readonly autogenxService: AutoGenxService,
    private readonly configService: ConfigService,
  ) {
    this.workerSecret = this.configService.get<string>(
      'AUTOGENX_WORKER_SECRET',
      'default-secret-change-in-production',
    );
  }

  /**
   * Trigger the background worker
   * Protected by X-Worker-Secret header
   */
  @Public()
  @Post('worker/trigger')
  @ApiOperation({ summary: 'Trigger AutoGenX worker (Internal only)' })
  @ApiHeader({ name: 'X-Worker-Secret', required: true })
  @ApiResponse({ status: 200, description: 'Worker executed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid secret' })
  async triggerWorker(@Headers('x-worker-secret') secret: string) {
    if (secret !== this.workerSecret) {
      throw new UnauthorizedException('Invalid worker secret');
    }

    const result = await this.workerService.processPendingEvents();
    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get AutoGenX statistics
   * Protected by X-Worker-Secret header
   */
  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Get AutoGenX event statistics (Internal only)' })
  @ApiHeader({ name: 'X-Worker-Secret', required: true })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid secret' })
  async getStats(@Headers('x-worker-secret') secret: string) {
    if (secret !== this.workerSecret) {
      throw new UnauthorizedException('Invalid worker secret');
    }

    return this.autogenxService.getStats();
  }
}
