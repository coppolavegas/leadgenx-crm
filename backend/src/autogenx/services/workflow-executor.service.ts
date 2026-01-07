import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NoReplyTrackerService } from './no-reply-tracker.service';
import { WorkflowResumeService } from './workflow-resume.service';
import { MessagingService } from './messaging.service';

@Injectable()
export class WorkflowExecutorService {
  private readonly logger = new Logger(WorkflowExecutorService.name);
  private readonly MAX_STEPS_PER_ENROLLMENT = 50; // Prevent infinite loops

  constructor(
    private readonly prisma: PrismaService,
    private readonly noReplyTracker: NoReplyTrackerService,
    private readonly resumeService: WorkflowResumeService,
    private readonly messagingService: MessagingService,
  ) {}

  /**
   * Execute workflows for a processed event.
   * This is the main entry point called by the worker.
   */
  async executeWorkflowsForEvent(eventId: string): Promise<void> {
    // Fetch the event
    const event = await this.prisma.automation_event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      this.logger.warn(`Event ${eventId} not found, skipping workflow execution`);
      return;
    }

    if (!event.workspace_id) {
      this.logger.log(
        `Event ${eventId} has no workspace_id, skipping workflow execution`,
      );
      return;
    }

    // Check if workspace has autogenx enabled (feature flag)
    const organization = await this.prisma.organization.findUnique({
      where: { id: event.workspace_id },
    });

    // TODO: Add feature_autogenx flag to organization model
    // For now, assume it's enabled for all workspaces
    // if (!organization?.feature_autogenx) {
    //   this.logger.log(
    //     `Workspace ${event.workspace_id} does not have autogenx enabled, skipping`,
    //   );
    //   return;
    // }

    // Find all enabled workflows matching this event type
    const workflows = await this.prisma.automation_workflow.findMany({
      where: {
        workspace_id: event.workspace_id,
        trigger_event_type: event.event_type,
        is_enabled: true,
      },
      include: {
        steps: {
          orderBy: { step_order: 'asc' },
        },
      },
    });

    if (workflows.length === 0) {
      this.logger.log(
        `No enabled workflows found for event type '${event.event_type}' in workspace ${event.workspace_id}`,
      );
      return;
    }

    this.logger.log(
      `Found ${workflows.length} workflow(s) to execute for event ${eventId}`,
    );

    // Execute each workflow
    for (const workflow of workflows) {
      try {
        await this.executeWorkflow(workflow, event);
      } catch (error) {
        this.logger.error(
          `Failed to execute workflow ${workflow.id} for event ${eventId}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Execute a single workflow for an event.
   */
  private async executeWorkflow(workflow: any, event: any): Promise<void> {
    // Check for existing enrollment (idempotency)
    const existingEnrollment =
      await this.prisma.automation_enrollment.findUnique({
        where: {
          event_id_workflow_id: {
            event_id: event.id,
            workflow_id: workflow.id,
          },
        },
      });

    if (existingEnrollment) {
      this.logger.log(
        `Enrollment already exists for event ${event.id} + workflow ${workflow.id}, skipping`,
      );
      return;
    }

    // Create enrollment with empty context
    const enrollment = await this.prisma.automation_enrollment.create({
      data: {
        workflow_id: workflow.id,
        workspace_id: event.workspace_id,
        lead_id: event.lead_id,
        event_id: event.id,
        status: 'active',
        context_json: {}, // Phase 2.5: Initialize empty context
        current_step_order: 1, // Phase 2.5: Start at step 1
      },
    });

    this.logger.log(
      `Created enrollment ${enrollment.id} for workflow '${workflow.name}' (${workflow.id})`,
    );

    // Phase 2.5: Execute steps with support for branching and pausing
    await this.continueWorkflowExecution(enrollment.id, workflow, event);
  }

  /**
   * Continue workflow execution from current step.
   * Phase 2.5: Supports branching, pausing, and resuming.
   */
  async continueWorkflowExecution(
    enrollmentId: string,
    workflow: any,
    event: any,
  ): Promise<void> {
    try {
      // Fetch current enrollment state
      let enrollment = await this.prisma.automation_enrollment.findUnique({
        where: { id: enrollmentId },
      });

      if (!enrollment) {
        throw new Error(`Enrollment ${enrollmentId} not found`);
      }

      const steps = workflow.steps;
      let currentStepOrder = enrollment.current_step_order || 1;
      let stepsExecuted = 0;

      // Execute steps sequentially (with support for jumps from branch)
      while (currentStepOrder && stepsExecuted < this.MAX_STEPS_PER_ENROLLMENT) {
        const step = steps.find((s: any) => s.step_order === currentStepOrder);

        if (!step) {
          this.logger.warn(
            `Step ${currentStepOrder} not found in workflow, completing enrollment`,
          );
          break;
        }

        // Execute the step with context awareness
        const result = await this.executeStepWithContext(
          enrollmentId,
          step,
          event,
        );

        stepsExecuted++;

        // Check result
        if (result.paused) {
          // Step requested pause (wait_hours)
          this.logger.log(
            `Enrollment ${enrollmentId} paused at step ${currentStepOrder}`,
          );
          return; // Exit - will be resumed later by scheduler
        }

        if (result.nextStepOrder !== undefined) {
          // Step requested jump (branch)
          currentStepOrder = result.nextStepOrder;
          this.logger.log(
            `Enrollment ${enrollmentId} jumping to step ${currentStepOrder}`,
          );
        } else {
          // Move to next step
          currentStepOrder++;
        }

        // Update current step in enrollment
        await this.prisma.automation_enrollment.update({
          where: { id: enrollmentId },
          data: { current_step_order: currentStepOrder },
        });
      }

      // Check if we hit max steps (infinite loop protection)
      if (stepsExecuted >= this.MAX_STEPS_PER_ENROLLMENT) {
        throw new Error(
          `Exceeded maximum steps (${this.MAX_STEPS_PER_ENROLLMENT}) - possible infinite loop`,
        );
      }

      // Mark enrollment as completed
      await this.prisma.automation_enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: 'completed',
          completed_at: new Date(),
          current_step_order: null,
        },
      });

      this.logger.log(
        `Enrollment ${enrollmentId} completed successfully (${stepsExecuted} steps executed)`,
      );
    } catch (error) {
      // Mark enrollment as failed
      await this.prisma.automation_enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: 'failed',
          last_error: error.message,
        },
      });

      this.logger.error(
        `Enrollment ${enrollmentId} failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Execute a single step with context awareness.
   * Phase 2.5: Returns { paused, nextStepOrder } to support wait_hours and branch.
   */
  private async executeStepWithContext(
    enrollmentId: string,
    step: any,
    event: any,
  ): Promise<{ paused: boolean; nextStepOrder?: number }> {
    // Create run record
    const run = await this.prisma.automation_run.create({
      data: {
        enrollment_id: enrollmentId,
        step_id: step.id,
        status: 'started',
      },
    });

    this.logger.log(
      `Executing step ${step.step_order}: ${step.action_type} (run ${run.id})`,
    );

    try {
      // Execute the action with context
      const result = await this.executeActionWithContext(
        enrollmentId,
        step.action_type,
        step.action_config,
        event,
      );

      // Mark run as successful
      await this.prisma.automation_run.update({
        where: { id: run.id },
        data: {
          status: 'success',
          finished_at: new Date(),
        },
      });

      this.logger.log(`Step ${step.step_order} completed successfully`);

      return result;
    } catch (error) {
      // Mark run as failed
      await this.prisma.automation_run.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          finished_at: new Date(),
          error: error.message,
        },
      });

      this.logger.error(
        `Step ${step.step_order} failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Execute an action with context awareness.
   * Phase 2.5: Returns { paused, nextStepOrder } to control execution flow.
   */
  private async executeActionWithContext(
    enrollmentId: string,
    actionType: string,
    actionConfig: any,
    event: any,
  ): Promise<{ paused: boolean; nextStepOrder?: number }> {
    // Get current context
    const enrollment = await this.prisma.automation_enrollment.findUnique({
      where: { id: enrollmentId },
    });
    const context = this.resumeService.getContext(enrollment);

    switch (actionType) {
      case 'update_lead_status':
        await this.updateLeadStatus(event.lead_id, actionConfig.status);
        return { paused: false };

      case 'add_lead_tag':
        await this.addLeadTag(event.lead_id, actionConfig.tag);
        return { paused: false };

      case 'create_task':
        await this.createTask(
          event.workspace_id,
          event.lead_id,
          actionConfig.title,
          actionConfig.dueInHours,
        );
        return { paused: false };

      case 'notify_user':
        await this.notifyUser(
          event.workspace_id,
          event.lead_id,
          actionConfig.message,
        );
        return { paused: false };

      case 'wait_hours':
        // Phase 2.5: Pause enrollment and schedule resume
        const hours = actionConfig.hours || 1;
        const resumeAt = new Date(Date.now() + hours * 60 * 60 * 1000);

        await this.prisma.automation_enrollment.update({
          where: { id: enrollmentId },
          data: {
            status: 'paused',
            next_run_at: resumeAt,
          },
        });

        this.logger.log(
          `Pausing enrollment ${enrollmentId} for ${hours} hours (resume at ${resumeAt.toISOString()})`,
        );

        return { paused: true }; // Signal to stop execution

      case 'condition_contains_text':
        // Phase 2.5: Check if last inbound message contains text
        const field = actionConfig.field || 'lastInboundMessageText';
        const contains = actionConfig.contains || [];
        const caseInsensitive = actionConfig.caseInsensitive !== false;

        const matches = await this.noReplyTracker.checkMessageContainsText(
          event.lead_id,
          contains,
          caseInsensitive,
        );

        // Store result in context
        context.lastConditionResult = matches;
        await this.resumeService.updateContext(enrollmentId, context);

        this.logger.log(
          `Condition check: lead ${event.lead_id} message contains [${contains.join(', ')}] = ${matches}`,
        );

        return { paused: false };

      case 'branch':
        // Phase 2.5: Jump to different step based on last condition result
        const conditionResult = context.lastConditionResult || false;
        const ifTrueStepOrder = actionConfig.ifTrueStepOrder;
        const ifFalseStepOrder = actionConfig.ifFalseStepOrder;

        const nextStep = conditionResult ? ifTrueStepOrder : ifFalseStepOrder;

        this.logger.log(
          `Branch: condition=${conditionResult}, jumping to step ${nextStep}`,
        );

        return { paused: false, nextStepOrder: nextStep };

      case 'send_sms':
        // Phase 4.5: Send SMS via messaging service
        await this.sendSms(
          enrollmentId,
          event.workspace_id,
          event.lead_id,
          actionConfig.to || actionConfig.phone,
          actionConfig.body || actionConfig.message,
        );
        return { paused: false };

      case 'send_email':
        // Phase 4.5: Send Email via messaging service
        await this.sendEmail(
          enrollmentId,
          event.workspace_id,
          event.lead_id,
          actionConfig.to || actionConfig.email,
          actionConfig.subject,
          actionConfig.body || actionConfig.message,
        );
        return { paused: false };

      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  // ===== ACTION IMPLEMENTATIONS =====

  private async updateLeadStatus(
    leadId: string,
    newStatus: string,
  ): Promise<void> {
    if (!leadId) {
      this.logger.warn('No lead_id provided, skipping update_lead_status');
      return;
    }

    await this.prisma.lead.update({
      where: { id: leadId },
      data: { status: newStatus },
    });

    this.logger.log(`Updated lead ${leadId} status to '${newStatus}'`);
  }

  private async addLeadTag(leadId: string, tag: string): Promise<void> {
    if (!leadId) {
      this.logger.warn('No lead_id provided, skipping add_lead_tag');
      return;
    }

    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }

    // Tags are stored as JSON array
    const currentTags = (lead.tags as string[]) || [];
    if (!currentTags.includes(tag)) {
      const updatedTags = [...currentTags, tag];
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { tags: updatedTags as any },
      });

      this.logger.log(`Added tag '${tag}' to lead ${leadId}`);
    } else {
      this.logger.log(`Tag '${tag}' already exists on lead ${leadId}`);
    }
  }

  private async createTask(
    workspaceId: string,
    leadId: string,
    title: string,
    dueInHours: number,
  ): Promise<void> {
    if (!leadId) {
      this.logger.warn('No lead_id provided, skipping create_task');
      return;
    }

    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + (dueInHours || 24));

    // Find a default assignee (first user in workspace)
    const firstUser = await this.prisma.user.findFirst({
      where: { organization_id: workspaceId },
    });

    if (!firstUser) {
      this.logger.warn(
        `No users found in workspace ${workspaceId}, cannot create task`,
      );
      return;
    }

    // Find the first client in the workspace (tasks require a client_id)
    const firstClient = await this.prisma.client.findFirst({
      where: { organization_id: workspaceId },
    });

    if (!firstClient) {
      this.logger.warn(
        `No clients found in workspace ${workspaceId}, cannot create task`,
      );
      return;
    }

    const task = await this.prisma.task.create({
      data: {
        client_id: firstClient.id,
        lead_id: leadId,
        assigned_to_user_id: firstUser.id,
        title: title,
        description: 'Auto-generated by AutoGenX workflow',
        due_at: dueDate,
        status: 'pending',
        priority: 'medium',
        type: 'general',
        auto_created: true,
        auto_rule: 'autogenx_workflow',
      },
    });

    this.logger.log(
      `Created task '${title}' (${task.id}) for lead ${leadId}, due in ${dueInHours}h`,
    );
  }

  private async notifyUser(
    workspaceId: string,
    leadId: string,
    message: string,
  ): Promise<void> {
    // Find first user in workspace to notify
    const firstUser = await this.prisma.user.findFirst({
      where: { organization_id: workspaceId },
    });

    if (!firstUser) {
      this.logger.warn(
        `No users found in workspace ${workspaceId}, cannot notify`,
      );
      return;
    }

    // Find the first client in the workspace (inbox items require a client_id)
    const firstClient = await this.prisma.client.findFirst({
      where: { organization_id: workspaceId },
    });

    if (!firstClient) {
      this.logger.warn(
        `No clients found in workspace ${workspaceId}, cannot create notification`,
      );
      return;
    }

    // Create an inbox item as notification
    const inboxItem = await this.prisma.inbox_item.create({
      data: {
        client_id: firstClient.id,
        lead_id: leadId,
        user_id: firstUser.id,
        type: 'system_event',
        title: 'AutoGenX Notification',
        body: message,
      },
    });

    this.logger.log(
      `Created notification (inbox item ${inboxItem.id}) for user ${firstUser.email}: ${message}`,
    );
  }

  /**
   * Send SMS (Phase 4.5)
   */
  private async sendSms(
    enrollmentId: string,
    workspaceId: string,
    leadId: string,
    to: string,
    body: string,
  ): Promise<void> {
    if (!leadId) {
      this.logger.warn('No lead_id provided, skipping send_sms');
      return;
    }

    // Fetch lead to get phone if 'to' is not provided
    let phone = to;
    if (!phone) {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead || !lead.phone) {
        this.logger.warn(`Lead ${leadId} has no phone number, cannot send SMS`);
        return;
      }

      phone = lead.phone;
    }

    // Enqueue message via messaging service (with compliance checks)
    const result = await this.messagingService.enqueueMessage({
      workspaceId,
      enrollmentId,
      leadId,
      channel: 'sms',
      to: phone,
      body,
    });

    if (!result.success) {
      this.logger.error(`Failed to enqueue SMS: ${result.message}`);
      throw new Error(`SMS send failed: ${result.message}`);
    }

    this.logger.log(`SMS enqueued for lead ${leadId} (message ${result.messageId})`);
  }

  /**
   * Send Email (Phase 4.5)
   * Note: Lead model doesn't have email field - 'to' parameter must be provided.
   */
  private async sendEmail(
    enrollmentId: string,
    workspaceId: string,
    leadId: string,
    to: string,
    subject: string,
    body: string,
  ): Promise<void> {
    if (!leadId) {
      this.logger.warn('No lead_id provided, skipping send_email');
      return;
    }

    if (!to) {
      this.logger.warn(
        `No email address provided for lead ${leadId} and lead model does not have email field`,
      );
      return;
    }

    // Enqueue message via messaging service (with compliance checks)
    const result = await this.messagingService.enqueueMessage({
      workspaceId,
      enrollmentId,
      leadId,
      channel: 'email',
      to,
      subject: subject || 'Message from LeadGenX',
      body,
    });

    if (!result.success) {
      this.logger.error(`Failed to enqueue email: ${result.message}`);
      throw new Error(`Email send failed: ${result.message}`);
    }

    this.logger.log(`Email enqueued for lead ${leadId} (message ${result.messageId})`);
  }
}
