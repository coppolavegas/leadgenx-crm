import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskEngineService } from './task-engine.service';
import { SlaTrackingService } from './sla-tracking.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly taskEngine: TaskEngineService,
    private readonly slaService: SlaTrackingService,
  ) {}

  /**
   * Run 48-hour follow-up automation for a client
   * Creates follow-up tasks for leads with no activity in 48h
   */
  async run48HourFollowUp(clientId: string) {
    this.logger.log(`Running 48h follow-up automation for client ${clientId}`);

    const threshold = new Date();
    threshold.setHours(threshold.getHours() - 48);

    // Find leads with last_touch_at > 48h ago and no pending follow-up task
    const leads = await this.prisma.lead.findMany({
      where: {
        campaign_leads: {
          some: {
            campaign: {
              client_id: clientId,
              status: 'active',
            },
          },
        },
        last_touch_at: {
          not: null,
          lt: threshold,
        },
        status: { not: 'disqualified' },
        // Exclude leads that already have a pending auto-follow-up task
        tasks: {
          none: {
            status: { in: ['pending', 'in_progress'] },
            auto_rule: '48h_followup',
          },
        },
      },
      select: {
        id: true,
        name: true,
        owner_user_id: true,
        last_touch_at: true,
      },
    });

    this.logger.log(
      `Found ${leads.length} leads needing 48h follow-up for client ${clientId}`,
    );

    const tasksCreated = [];

    for (const lead of leads) {
      if (!lead.owner_user_id) {
        this.logger.warn(`Lead ${lead.id} has no owner, skipping automation`);
        continue;
      }

      // Create task due tomorrow
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);
      dueDate.setHours(9, 0, 0, 0); // 9 AM

      try {
        const task = await this.taskEngine.createFollowUpTask(
          clientId,
          lead.id,
          lead.owner_user_id,
          dueDate,
          '48h_followup',
        );
        tasksCreated.push(task);
      } catch (error) {
        this.logger.error(
          `Failed to create follow-up task for lead ${lead.id}: ${error.message}`,
        );
      }
    }

    return {
      client_id: clientId,
      leads_checked: leads.length,
      tasks_created: tasksCreated.length,
      tasks: tasksCreated,
    };
  }

  /**
   * Auto-complete reply follow-up tasks when a reply is received
   */
  async autoCompleteReplyTasks(clientId: string, leadId: string) {
    this.logger.log(
      `Auto-completing reply tasks for lead ${leadId} in client ${clientId}`,
    );

    // Find all pending follow-up tasks for this lead
    const tasks = await this.prisma.task.findMany({
      where: {
        client_id: clientId,
        lead_id: leadId,
        type: 'follow_up',
        status: { in: ['pending', 'in_progress'] },
      },
    });

    this.logger.log(`Found ${tasks.length} pending follow-up tasks to complete`);

    for (const task of tasks) {
      await this.prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'completed',
          completed_at: new Date(),
        },
      });
    }

    return {
      lead_id: leadId,
      tasks_completed: tasks.length,
    };
  }

  /**
   * Run overdue detection and create overdue alerts
   */
  async runOverdueDetection(clientId: string) {
    this.logger.log(`Running overdue detection for client ${clientId}`);

    const overdueLeads = await this.slaService.detectOverdueLeads(clientId);

    // Create tasks for overdue leads (if they don't already exist)
    const tasksCreated = [];

    for (const lead of overdueLeads) {
      if (!lead.owner_user_id) continue;

      // Check if there's already an overdue task
      const existingTask = await this.prisma.task.findFirst({
        where: {
          lead_id: lead.id,
          auto_rule: 'overdue_check',
          status: { in: ['pending', 'in_progress'] },
        },
      });

      if (existingTask) continue;

      // Create urgent task due today
      const dueDate = new Date();
      dueDate.setHours(23, 59, 0, 0); // End of today

      try {
        const task = await this.prisma.task.create({
          data: {
            client_id: clientId,
            lead_id: lead.id,
            assigned_to_user_id: lead.owner_user_id,
            title: `URGENT: Overdue lead - ${lead.name}`,
            description: `This lead hasn't been touched in over ${lead.overdue_threshold_hours} hours and is now overdue.`,
            type: 'follow_up',
            status: 'pending',
            priority: 'urgent',
            due_at: dueDate,
            auto_created: true,
            auto_rule: 'overdue_check',
          },
        });
        tasksCreated.push(task);
      } catch (error) {
        this.logger.error(
          `Failed to create overdue task for lead ${lead.id}: ${error.message}`,
        );
      }
    }

    return {
      client_id: clientId,
      overdue_leads: overdueLeads.length,
      tasks_created: tasksCreated.length,
    };
  }

  /**
   * Run all automations for a client
   */
  async runAllAutomations(clientId: string) {
    this.logger.log(`Running all automations for client ${clientId}`);

    const results = await Promise.allSettled([
      this.run48HourFollowUp(clientId),
      this.runOverdueDetection(clientId),
    ]);

    return {
      client_id: clientId,
      follow_up_48h: results[0].status === 'fulfilled' ? results[0].value : null,
      overdue_detection: results[1].status === 'fulfilled' ? results[1].value : null,
      timestamp: new Date(),
    };
  }
}
