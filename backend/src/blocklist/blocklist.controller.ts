import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BlocklistService } from './blocklist.service';
import { AddDomainDto } from './dto/add-domain.dto';
import { CheckDomainDto } from './dto/check-domain.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Blocklist')
@ApiBearerAuth()
@Controller('blocklist')
@UseGuards(ApiKeyGuard, RolesGuard)
export class BlocklistController {
  constructor(private readonly blocklistService: BlocklistService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Add domain to blocklist (admin only)' })
  @ApiResponse({ status: 201, description: 'Domain added to blocklist' })
  async addDomain(@Request() req: any, @Body() dto: AddDomainDto) {
    const orgId = req.organization.id;
    return this.blocklistService.addDomain(orgId, dto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all blocked domains (admin only)' })
  @ApiResponse({ status: 200, description: 'List of blocked domains' })
  async listDomains(@Request() req: any) {
    const orgId = req.organization.id;
    return this.blocklistService.listDomains(orgId);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Remove domain from blocklist (admin only)' })
  @ApiResponse({ status: 200, description: 'Domain removed from blocklist' })
  async removeDomain(@Request() req: any, @Param('id') id: string) {
    const orgId = req.organization.id;
    return this.blocklistService.removeDomain(orgId, id);
  }

  @Post('check')
  @ApiOperation({ summary: 'Check if a domain is blocklisted' })
  @ApiResponse({ status: 200, description: 'Domain check result' })
  async checkDomain(@Request() req: any, @Body() dto: CheckDomainDto) {
    const orgId = req.organization.id;
    const isBlocked = await this.blocklistService.isDomainBlocked(orgId, dto.domain);
    return {
      domain: dto.domain,
      isBlocked,
    };
  }
}
