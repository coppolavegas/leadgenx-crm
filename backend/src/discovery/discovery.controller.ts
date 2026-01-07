import { Controller, Post, Body, Logger, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { DiscoveryService } from './discovery.service';
import { DiscoverLeadsDto } from './dto/discover-leads.dto';
import { DiscoveryResultDto } from './dto/lead-response.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@ApiTags('Discovery')
@Controller('discover')
@UseGuards(ApiKeyGuard)
@ApiSecurity('X-API-Key')
export class DiscoveryController {
  private readonly logger = new Logger(DiscoveryController.name);

  constructor(private readonly discoveryService: DiscoveryService) {}

  @Post()
  @ApiOperation({ summary: 'Discover new business leads' })
  @ApiResponse({ status: 201, description: 'Leads discovered successfully', type: DiscoveryResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing API key' })
  async discover(@Body() discoverDto: DiscoverLeadsDto): Promise<DiscoveryResultDto> {
    this.logger.log(`Discovery request received for industry: ${discoverDto.industry}`);
    return this.discoveryService.discoverLeads(discoverDto);
  }
}
