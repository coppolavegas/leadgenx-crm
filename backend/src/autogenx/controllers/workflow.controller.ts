import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { WorkflowService } from '../services/workflow.service';
import { CreateWorkflowDto } from '../dto/create-workflow.dto';
import { UpdateWorkflowDto } from '../dto/update-workflow.dto';
import { UpdateStepsDto } from '../dto/update-steps.dto';
import { WorkflowResponse } from '../dto/workflow-response.dto';
import { LeadHistoryResponse } from '../dto/lead-history-response.dto';

/**
 * Workspace admin endpoints for managing workflows.
 * All endpoints are scoped to a specific workspace.
 */
@Controller('workspaces/:workspaceId/autogenx')
@UseGuards(SessionAuthGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  /**
   * List all workflows in a workspace.
   * GET /workspaces/:workspaceId/autogenx/workflows
   */
  @Get('workflows')
  async listWorkflows(
    @Param('workspaceId') workspaceId: string,
    @Query('includeSteps') includeSteps?: string,
  ): Promise<WorkflowResponse[]> {
    const include = includeSteps === 'true';
    return this.workflowService.listWorkflows(workspaceId, include);
  }

  /**
   * Create a new workflow.
   * POST /workspaces/:workspaceId/autogenx/workflows
   */
  @Post('workflows')
  async createWorkflow(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateWorkflowDto,
  ): Promise<WorkflowResponse> {
    return this.workflowService.createWorkflow(workspaceId, dto);
  }

  /**
   * Get a specific workflow with steps.
   * GET /workspaces/:workspaceId/autogenx/workflows/:workflowId
   */
  @Get('workflows/:workflowId')
  async getWorkflow(
    @Param('workspaceId') workspaceId: string,
    @Param('workflowId') workflowId: string,
  ): Promise<WorkflowResponse> {
    return this.workflowService.getWorkflow(workspaceId, workflowId);
  }

  /**
   * Update a workflow (name, trigger, enabled status).
   * PATCH /workspaces/:workspaceId/autogenx/workflows/:workflowId
   */
  @Patch('workflows/:workflowId')
  async updateWorkflow(
    @Param('workspaceId') workspaceId: string,
    @Param('workflowId') workflowId: string,
    @Body() dto: UpdateWorkflowDto,
  ): Promise<WorkflowResponse> {
    return this.workflowService.updateWorkflow(workspaceId, workflowId, dto);
  }

  /**
   * Delete a workflow.
   * DELETE /workspaces/:workspaceId/autogenx/workflows/:workflowId
   */
  @Delete('workflows/:workflowId')
  async deleteWorkflow(
    @Param('workspaceId') workspaceId: string,
    @Param('workflowId') workflowId: string,
  ): Promise<{ message: string }> {
    await this.workflowService.deleteWorkflow(workspaceId, workflowId);
    return { message: 'Workflow deleted successfully' };
  }

  /**
   * Update workflow steps (replaces all existing steps).
   * POST /workspaces/:workspaceId/autogenx/workflows/:workflowId/steps
   */
  @Post('workflows/:workflowId/steps')
  async updateSteps(
    @Param('workspaceId') workspaceId: string,
    @Param('workflowId') workflowId: string,
    @Body() dto: UpdateStepsDto,
  ): Promise<WorkflowResponse> {
    return this.workflowService.updateWorkflowSteps(
      workspaceId,
      workflowId,
      dto,
    );
  }

  /**
   * Get lead history (events, enrollments, runs).
   * GET /workspaces/:workspaceId/autogenx/leads/:leadId/history
   */
  @Get('leads/:leadId/history')
  async getLeadHistory(
    @Param('workspaceId') workspaceId: string,
    @Param('leadId') leadId: string,
  ): Promise<LeadHistoryResponse> {
    return this.workflowService.getLeadHistory(workspaceId, leadId);
  }

  /**
   * Get enrollment detail (Phase 2.5).
   * GET /workspaces/:workspaceId/autogenx/enrollments/:enrollmentId
   */
  @Get('enrollments/:enrollmentId')
  async getEnrollmentDetail(
    @Param('workspaceId') workspaceId: string,
    @Param('enrollmentId') enrollmentId: string,
  ): Promise<any> {
    return this.workflowService.getEnrollmentDetail(workspaceId, enrollmentId);
  }

  /**
   * Publish workflow (enable it to start processing events).
   * PATCH /workspaces/:workspaceId/autogenx/workflows/:workflowId/publish
   * Phase 3: Explicit action required to activate AI-generated workflows
   */
  @Patch('workflows/:workflowId/publish')
  async publishWorkflow(
    @Param('workspaceId') workspaceId: string,
    @Param('workflowId') workflowId: string,
  ): Promise<{ message: string; workflow: WorkflowResponse }> {
    const workflow = await this.workflowService.updateWorkflow(
      workspaceId,
      workflowId,
      { isEnabled: true },
    );

    return {
      message: 'Workflow published and enabled successfully',
      workflow,
    };
  }
}
