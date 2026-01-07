import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkflowDto } from '../dto/create-workflow.dto';
import { UpdateWorkflowDto } from '../dto/update-workflow.dto';
import { UpdateStepsDto } from '../dto/update-steps.dto';
import { WorkflowResponse, StepResponse } from '../dto/workflow-response.dto';
import { EnrollmentResponse } from '../dto/enrollment-response.dto';
import { RunResponse } from '../dto/run-response.dto';
import { LeadHistoryResponse } from '../dto/lead-history-response.dto';

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== WORKFLOW CRUD =====

  async createWorkflow(
    workspaceId: string,
    dto: CreateWorkflowDto,
  ): Promise<WorkflowResponse> {
    const workflow = await this.prisma.automation_workflow.create({
      data: {
        workspace_id: workspaceId,
        name: dto.name,
        trigger_event_type: dto.triggerEventType,
        is_enabled: dto.isEnabled ?? true,
      },
    });

    return this.mapWorkflowToResponse(workflow);
  }

  async listWorkflows(
    workspaceId: string,
    includeSteps = false,
  ): Promise<WorkflowResponse[]> {
    const workflows = await this.prisma.automation_workflow.findMany({
      where: { workspace_id: workspaceId },
      include: { steps: includeSteps },
      orderBy: { created_at: 'desc' },
    });

    return workflows.map((w) => this.mapWorkflowToResponse(w));
  }

  async getWorkflow(
    workspaceId: string,
    workflowId: string,
  ): Promise<WorkflowResponse> {
    const workflow = await this.prisma.automation_workflow.findUnique({
      where: { id: workflowId },
      include: { steps: true },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }

    if (workflow.workspace_id !== workspaceId) {
      throw new ForbiddenException(
        'You do not have access to this workflow',
      );
    }

    return this.mapWorkflowToResponse(workflow);
  }

  async updateWorkflow(
    workspaceId: string,
    workflowId: string,
    dto: UpdateWorkflowDto,
  ): Promise<WorkflowResponse> {
    // Verify ownership
    await this.getWorkflow(workspaceId, workflowId);

    const workflow = await this.prisma.automation_workflow.update({
      where: { id: workflowId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.triggerEventType && {
          trigger_event_type: dto.triggerEventType,
        }),
        ...(dto.isEnabled !== undefined && { is_enabled: dto.isEnabled }),
      },
      include: { steps: true },
    });

    return this.mapWorkflowToResponse(workflow);
  }

  async deleteWorkflow(
    workspaceId: string,
    workflowId: string,
  ): Promise<void> {
    // Verify ownership
    await this.getWorkflow(workspaceId, workflowId);

    await this.prisma.automation_workflow.delete({
      where: { id: workflowId },
    });
  }

  // ===== STEP MANAGEMENT =====

  async updateWorkflowSteps(
    workspaceId: string,
    workflowId: string,
    dto: UpdateStepsDto,
  ): Promise<WorkflowResponse> {
    // Verify ownership
    await this.getWorkflow(workspaceId, workflowId);

    // Delete existing steps and create new ones in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete all existing steps
      await tx.automation_step.deleteMany({
        where: { workflow_id: workflowId },
      });

      // Create new steps
      if (dto.steps && dto.steps.length > 0) {
        await tx.automation_step.createMany({
          data: dto.steps.map((step) => ({
            workflow_id: workflowId,
            step_order: step.stepOrder,
            action_type: step.actionType,
            action_config: step.actionConfig as any,
          })),
        });
      }
    });

    // Return updated workflow with steps
    return this.getWorkflow(workspaceId, workflowId);
  }

  // ===== SUPERADMIN QUERIES =====

  async listAllWorkflows(workspaceId?: string): Promise<WorkflowResponse[]> {
    const workflows = await this.prisma.automation_workflow.findMany({
      where: workspaceId ? { workspace_id: workspaceId } : undefined,
      include: { steps: true },
      orderBy: { created_at: 'desc' },
    });

    return workflows.map((w) => this.mapWorkflowToResponse(w));
  }

  async listEnrollments(
    workspaceId?: string,
    leadId?: string,
  ): Promise<EnrollmentResponse[]> {
    const enrollments = await this.prisma.automation_enrollment.findMany({
      where: {
        ...(workspaceId && { workspace_id: workspaceId }),
        ...(leadId && { lead_id: leadId }),
      },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            trigger_event_type: true,
          },
        },
      },
      orderBy: { enrolled_at: 'desc' },
      take: 100,
    });

    return enrollments.map((e) => ({
      id: e.id,
      workflowId: e.workflow_id,
      workspaceId: e.workspace_id,
      leadId: e.lead_id,
      eventId: e.event_id,
      status: e.status,
      enrolledAt: e.enrolled_at,
      completedAt: e.completed_at,
      lastError: e.last_error,
      workflow: {
        id: e.workflow.id,
        name: e.workflow.name,
        triggerEventType: e.workflow.trigger_event_type,
      },
    }));
  }

  async listRuns(
    workspaceId?: string,
    enrollmentId?: string,
  ): Promise<RunResponse[]> {
    const runs = await this.prisma.automation_run.findMany({
      where: {
        ...(enrollmentId && { enrollment_id: enrollmentId }),
        ...(workspaceId && {
          enrollment: { workspace_id: workspaceId },
        }),
      },
      include: {
        step: {
          select: {
            id: true,
            step_order: true,
            action_type: true,
            action_config: true,
          },
        },
      },
      orderBy: { started_at: 'desc' },
      take: 100,
    });

    return runs.map((r) => ({
      id: r.id,
      enrollmentId: r.enrollment_id,
      stepId: r.step_id,
      status: r.status,
      startedAt: r.started_at,
      finishedAt: r.finished_at,
      error: r.error,
      step: {
        id: r.step.id,
        stepOrder: r.step.step_order,
        actionType: r.step.action_type,
        actionConfig: r.step.action_config as Record<string, any>,
      },
    }));
  }

  // ===== LEAD HISTORY =====

  async getLeadHistory(
    workspaceId: string,
    leadId: string,
  ): Promise<LeadHistoryResponse> {
    // Fetch events
    const events = await this.prisma.automation_event.findMany({
      where: {
        workspace_id: workspaceId,
        lead_id: leadId,
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    // Fetch enrollments
    const enrollments = await this.prisma.automation_enrollment.findMany({
      where: {
        workspace_id: workspaceId,
        lead_id: leadId,
      },
      include: {
        workflow: {
          select: { name: true },
        },
      },
      orderBy: { enrolled_at: 'desc' },
      take: 50,
    });

    // Fetch runs for these enrollments
    const enrollmentIds = enrollments.map((e) => e.id);
    const runs = await this.prisma.automation_run.findMany({
      where: {
        enrollment_id: { in: enrollmentIds },
      },
      include: {
        step: {
          select: {
            step_order: true,
            action_type: true,
          },
        },
      },
      orderBy: { started_at: 'desc' },
      take: 100,
    });

    return {
      events: events.map((e) => ({
        id: e.id,
        eventType: e.event_type,
        payload: e.payload as any,
        status: e.status,
        createdAt: e.created_at,
        processedAt: e.processed_at,
      })),
      enrollments: enrollments.map((e) => ({
        id: e.id,
        workflowId: e.workflow_id,
        workflowName: e.workflow.name,
        status: e.status,
        enrolledAt: e.enrolled_at,
        completedAt: e.completed_at,
      })),
      runs: runs.map((r) => ({
        id: r.id,
        enrollmentId: r.enrollment_id,
        stepOrder: r.step.step_order,
        actionType: r.step.action_type,
        status: r.status,
        startedAt: r.started_at,
        finishedAt: r.finished_at,
        error: r.error,
      })),
    };
  }

  // ===== ENROLLMENT DETAIL (Phase 2.5) =====

  async getEnrollmentDetail(
    workspaceId: string,
    enrollmentId: string,
  ): Promise<any> {
    const enrollment = await this.prisma.automation_enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            trigger_event_type: true,
            is_enabled: true,
          },
        },
        runs: {
          include: {
            step: {
              select: {
                id: true,
                step_order: true,
                action_type: true,
                action_config: true,
              },
            },
          },
          orderBy: { started_at: 'desc' },
          take: 20, // Last 20 runs
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment ${enrollmentId} not found`);
    }

    if (enrollment.workspace_id !== workspaceId) {
      throw new ForbiddenException(
        'You do not have access to this enrollment',
      );
    }

    return {
      id: enrollment.id,
      workflowId: enrollment.workflow_id,
      workspaceId: enrollment.workspace_id,
      leadId: enrollment.lead_id,
      eventId: enrollment.event_id,
      status: enrollment.status,
      enrolledAt: enrollment.enrolled_at,
      completedAt: enrollment.completed_at,
      lastError: enrollment.last_error,
      contextJson: enrollment.context_json as Record<string, any>,
      currentStepOrder: enrollment.current_step_order,
      nextRunAt: enrollment.next_run_at,
      lockedAt: enrollment.locked_at,
      lockOwner: enrollment.lock_owner,
      workflow: {
        id: enrollment.workflow.id,
        name: enrollment.workflow.name,
        triggerEventType: enrollment.workflow.trigger_event_type,
        isEnabled: enrollment.workflow.is_enabled,
      },
      runs: enrollment.runs.map((r) => ({
        id: r.id,
        stepId: r.step_id,
        status: r.status,
        startedAt: r.started_at,
        finishedAt: r.finished_at,
        error: r.error,
        step: {
          stepOrder: r.step.step_order,
          actionType: r.step.action_type,
          actionConfig: r.step.action_config as Record<string, any>,
        },
      })),
    };
  }

  // ===== HELPERS =====

  private mapWorkflowToResponse(workflow: any): WorkflowResponse {
    return {
      id: workflow.id,
      workspaceId: workflow.workspace_id,
      name: workflow.name,
      triggerEventType: workflow.trigger_event_type,
      isEnabled: workflow.is_enabled,
      createdAt: workflow.created_at,
      updatedAt: workflow.updated_at,
      ...(workflow.steps && {
        steps: workflow.steps.map((s: any) => ({
          id: s.id,
          workflowId: s.workflow_id,
          stepOrder: s.step_order,
          actionType: s.action_type,
          actionConfig: s.action_config as Record<string, any>,
          createdAt: s.created_at,
        })),
      }),
    };
  }
}
