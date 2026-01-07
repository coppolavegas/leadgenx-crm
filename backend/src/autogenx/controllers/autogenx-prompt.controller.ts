import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { AutogenxPromptService } from '../services/autogenx-prompt.service';
import { WorkflowService } from '../services/workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GenerateWorkflowPromptDto,
} from '../dto/generate-workflow-prompt.dto';
import {
  WorkflowDraftResponseDto,
} from '../dto/workflow-draft.dto';
import {
  CreateWorkflowFromDraftDto,
} from '../dto/create-workflow-from-draft.dto';

/**
 * AutoGenX Prompt Controller
 * AI-powered workflow generation from natural language
 */
@ApiTags('AutoGenX - AI Prompts')
@Controller()
@UseGuards(SessionAuthGuard)
@ApiBearerAuth()
export class AutogenxPromptController {
  private readonly logger = new Logger(AutogenxPromptController.name);

  constructor(
    private readonly promptService: AutogenxPromptService,
    private readonly workflowService: WorkflowService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generate workflow draft from natural language prompt
   */
  @Post('workspaces/:workspaceId/autogenx/prompt')
  @ApiOperation({
    summary: 'Generate workflow draft from natural language prompt',
    description:
      'Convert a natural language automation request into a structured workflow draft. ' +
      'The draft must be validated and explicitly published before it becomes active.',
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow draft generated successfully',
    type: WorkflowDraftResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid prompt or rate limit exceeded',
  })
  @ApiResponse({
    status: 403,
    description: 'AutoGenX feature not enabled for workspace',
  })
  async generateWorkflowFromPrompt(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: GenerateWorkflowPromptDto,
  ): Promise<WorkflowDraftResponseDto> {
    // Check feature flag
    await this.checkAutogenxEnabled(workspaceId);

    this.logger.log(`Generating workflow for workspace ${workspaceId}: "${dto.prompt.substring(0, 100)}..."`);

    const result = await this.promptService.generateWorkflowFromPrompt(
      workspaceId,
      dto.prompt,
      dto.userId,
    );

    this.logger.log(
      `Draft generated: ${result.valid ? 'valid' : 'invalid'}, ` +
      `${result.errors?.length || 0} errors, ${result.warnings?.length || 0} warnings`,
    );

    return result;
  }

  /**
   * Publish workflow from validated draft
   */
  @Post('workspaces/:workspaceId/autogenx/workflows/from-draft')
  @ApiOperation({
    summary: 'Create and save workflow from draft',
    description:
      'Persist a validated workflow draft to the database. ' +
      'The workflow is created in disabled state and must be explicitly published.',
  })
  @ApiResponse({
    status: 201,
    description: 'Workflow created successfully from draft',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid draft or validation failed',
  })
  async createWorkflowFromDraft(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateWorkflowFromDraftDto,
  ): Promise<{ workflowId: string; message: string }> {
    // Check feature flag
    await this.checkAutogenxEnabled(workspaceId);

    // Validate draft again before saving
    const validation = await this.promptService['validateWorkflowDraft'](dto.workflowDraft);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Workflow draft validation failed',
        errors: validation.errors,
      });
    }

    this.logger.log(`Creating workflow from draft for workspace ${workspaceId}`);

    // Create workflow (disabled by default)
    const workflow = await this.workflowService.createWorkflow(
      workspaceId,
      {
        name: dto.workflowDraft.name,
        triggerEventType: dto.workflowDraft.trigger.eventType,
        isEnabled: false, // CRITICAL: Not enabled by default
      },
    );

    // Create steps using updateWorkflowSteps
    if (dto.workflowDraft.steps && dto.workflowDraft.steps.length > 0) {
      await this.workflowService.updateWorkflowSteps(
        workspaceId,
        workflow.id,
        {
          steps: dto.workflowDraft.steps.map(step => ({
            stepOrder: step.order,
            actionType: step.actionType,
            actionConfig: step.actionConfig,
          })),
        },
      );
    }

    // Link to prompt log if provided
    if (dto.promptLogId) {
      await this.promptService.linkPublishedWorkflow(dto.promptLogId, workflow.id);
    }

    this.logger.log(
      `Workflow ${workflow.id} created from draft with ${dto.workflowDraft.steps.length} steps. ` +
      `Status: DISABLED (must be explicitly published)`,
    );

    return {
      workflowId: workflow.id,
      message: 'Workflow created successfully. Use PATCH /workflows/:id/publish to enable it.',
    };
  }

  /**
   * Get prompt logs for workspace (audit trail)
   */
  @Get('workspaces/:workspaceId/autogenx/prompt-logs')
  @ApiOperation({
    summary: 'Get prompt generation history',
    description: 'Retrieve audit log of workflow prompts for the workspace',
  })
  @ApiResponse({
    status: 200,
    description: 'Prompt logs retrieved successfully',
  })
  async getPromptLogs(
    @Param('workspaceId') workspaceId: string,
  ): Promise<any[]> {
    await this.checkAutogenxEnabled(workspaceId);
    return this.promptService.getPromptLogs(workspaceId, 50);
  }

  /**
   * Check if AutoGenX is enabled for workspace
   */
  private async checkAutogenxEnabled(workspaceId: string): Promise<void> {
    const workspace = await this.prisma.organization.findUnique({
      where: { id: workspaceId },
      select: { autogenx_enabled: true },
    });

    if (!workspace?.autogenx_enabled) {
      throw new BadRequestException(
        'AutoGenX feature is not enabled for this workspace. Please contact administrator.',
      );
    }
  }
}
