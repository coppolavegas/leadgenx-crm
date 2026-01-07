import { Controller, Get, Patch, UseGuards, Param, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateWorkspaceFeaturesDto } from './dto/update-workspace-features.dto';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(SessionAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('ping')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Test superadmin access' })
  @ApiResponse({ status: 200, description: 'Superadmin access confirmed' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires superadmin role' })
  async ping() {
    return this.adminService.ping();
  }

  @Get('workspaces')
  @Roles('superadmin')
  @ApiOperation({ summary: 'List all workspaces' })
  @ApiResponse({ status: 200, description: 'List of workspaces', type: [WorkspaceResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden - requires superadmin role' })
  async listWorkspaces() {
    return this.adminService.listWorkspaces();
  }

  @Get('workspaces/:id')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Get workspace details' })
  @ApiResponse({ status: 200, description: 'Workspace details', type: WorkspaceResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - requires superadmin role' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async getWorkspace(@Param('id') id: string) {
    return this.adminService.getWorkspace(id);
  }

  @Patch('workspaces/:id/features')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Update workspace feature flags' })
  @ApiResponse({ status: 200, description: 'Workspace features updated', type: WorkspaceResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - requires superadmin role' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async updateWorkspaceFeatures(
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceFeaturesDto,
  ) {
    return this.adminService.updateWorkspaceFeatures(id, dto);
  }
}
