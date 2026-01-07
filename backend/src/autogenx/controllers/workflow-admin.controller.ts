import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { WorkflowService } from '../services/workflow.service';
import { WorkflowResponse } from '../dto/workflow-response.dto';
import { EnrollmentResponse } from '../dto/enrollment-response.dto';
import { RunResponse } from '../dto/run-response.dto';

/**
 * Superadmin endpoints for global workflow management.
 */
@Controller('admin/autogenx')
@UseGuards(RolesGuard)
@Roles('superadmin')
export class WorkflowAdminController {
  constructor(private readonly workflowService: WorkflowService) {}

  /**
   * List all workflows (optionally filtered by workspace).
   * GET /admin/autogenx/workflows?workspaceId=...
   */
  @Get('workflows')
  async listAllWorkflows(
    @Query('workspaceId') workspaceId?: string,
  ): Promise<WorkflowResponse[]> {
    return this.workflowService.listAllWorkflows(workspaceId);
  }

  /**
   * List enrollments (optionally filtered by workspace or lead).
   * GET /admin/autogenx/enrollments?workspaceId=...&leadId=...
   */
  @Get('enrollments')
  async listEnrollments(
    @Query('workspaceId') workspaceId?: string,
    @Query('leadId') leadId?: string,
  ): Promise<EnrollmentResponse[]> {
    return this.workflowService.listEnrollments(workspaceId, leadId);
  }

  /**
   * List runs (optionally filtered by workspace or enrollment).
   * GET /admin/autogenx/runs?workspaceId=...&enrollmentId=...
   */
  @Get('runs')
  async listRuns(
    @Query('workspaceId') workspaceId?: string,
    @Query('enrollmentId') enrollmentId?: string,
  ): Promise<RunResponse[]> {
    return this.workflowService.listRuns(workspaceId, enrollmentId);
  }
}
