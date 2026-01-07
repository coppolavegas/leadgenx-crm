import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InboxService } from './inbox.service';
import { SlaTrackingService } from './sla-tracking.service';

@Injectable()
export class TaskEngineService {
  private readonly logger = new Logger(TaskEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inboxService: InboxService,
    private readonly slaService: SlaTrackingService,
  ) {}

  /**
   * Complete a task and create inbox item
   */
  async completeTask(
    clientId: string,
    taskId: string,
    userId: string,
    notes?: string,
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, client_id: clientId },
      include: { lead: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Update task
    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        completed_at: new Date(),
      },
    });

    // Update SLA tracking
    if (task.lead_id) {
      await this.slaService.updateLastTouch(task.lead_id);
    }

    // Create inbox item
    await this.inboxService.createInboxItem(clientId, {
      leadId: task.lead_id || undefined,
      userId,
      type: 'task_completed',
      title: `Task completed: ${task.title}`,
      body: notes || task.description || undefined,
      taskId: task.id,
    });

    return updated;
  }

  /**
   * Snooze a task
   */
  async snoozeTask(
    clientId: string,
    taskId: string,
    snoozedUntil: Date,
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, client_id: clientId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { snoozed_until: snoozedUntil },
    });
  }

  /**
   * Reassign a task
   */
  async reassignTask(
    clientId: string,
    taskId: string,
    newAssigneeId: string,
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, client_id: clientId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { assigned_to_user_id: newAssigneeId },
    });
  }

  /**
   * Get tasks for today
   */
  async getTodayTasks(clientId: string, userId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      client_id: clientId,
      status: { in: ['pending', 'in_progress'] },
      due_at: {
        gte: today,
        lt: tomorrow,
      },
    };

    if (userId) {
      where.assigned_to_user_id = userId;
    }

    return this.prisma.task.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,

          },
        },
        assigned_to: {
          select: {
            id: true,
            full_name: true,

          },
        },
      },
      orderBy: { due_at: 'asc' },
    });
  }

  /**
   * Get upcoming tasks (next 7 days)
   */
  async getUpcomingTasks(clientId: string, userId?: string) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(tomorrow);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const where: any = {
      client_id: clientId,
      status: { in: ['pending', 'in_progress'] },
      due_at: {
        gte: tomorrow,
        lt: nextWeek,
      },
    };

    if (userId) {
      where.assigned_to_user_id = userId;
    }

    return this.prisma.task.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,

          },
        },
        assigned_to: {
          select: {
            id: true,
            full_name: true,

          },
        },
      },
      orderBy: { due_at: 'asc' },
    });
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(clientId: string, userId?: string) {
    const now = new Date();

    const where: any = {
      client_id: clientId,
      status: { in: ['pending', 'in_progress'] },
      due_at: { lt: now },
    };

    if (userId) {
      where.assigned_to_user_id = userId;
    }

    return this.prisma.task.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,

          },
        },
        assigned_to: {
          select: {
            id: true,
            full_name: true,

          },
        },
      },
      orderBy: { due_at: 'asc' },
    });
  }

  /**
   * Create follow-up task (used by automation)
   */
  async createFollowUpTask(
    clientId: string,
    leadId: string,
    assigneeId: string,
    dueDate: Date,
    autoRule: string,
    relatedTaskId?: string,
  ) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { name: true },
    });

    const task = await this.prisma.task.create({
      data: {
        client_id: clientId,
        lead_id: leadId,
        assigned_to_user_id: assigneeId,
        title: `Follow up with ${lead?.name || 'lead'}`,
        description: `Automated follow-up task created by ${autoRule}`,
        type: 'follow_up',
        status: 'pending',
        priority: 'medium',
        due_at: dueDate,
        auto_created: true,
        auto_rule: autoRule,
        related_task_id: relatedTaskId,
      },
    });

    // Create inbox item
    await this.inboxService.createInboxItem(clientId, {
      leadId,
      type: 'system_event',
      title: `New follow-up task created`,
      body: `Automated follow-up task created for ${lead?.name || 'lead'}`,
      taskId: task.id,
    });

    this.logger.log(
      `Created follow-up task for lead ${leadId} via rule ${autoRule}`,
    );

    return task;
  }
}
