import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get('health')
  @ApiOperation({ 
    summary: 'Health check endpoint',
    description: 'Returns basic health status of the API'
  })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  async health() {
    return this.healthService.getHealth();
  }

  @Public()
  @Get('ready')
  @ApiOperation({ 
    summary: 'Readiness check endpoint',
    description: 'Checks if all dependencies (database, Redis, etc.) are ready'
  })
  @ApiResponse({ status: 200, description: 'API is ready' })
  @ApiResponse({ status: 503, description: 'API is not ready' })
  async ready() {
    return this.healthService.getReadiness();
  }
}
