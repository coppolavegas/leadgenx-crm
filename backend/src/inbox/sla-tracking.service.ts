import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SlaTrackingService {
  private readonly logger = new Logger(SlaTrackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update last_touch_at for a lead when meaningful interaction occurs
   */
  async updateLastTouch(leadId: string) {
    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        last_touch_at: new Date(),
        is_overdue: false,
        overdue_since: null,
      },
    });
  }

  /**
   * Check for overdue leads across a client
   * Returns leads that haven't been touched within their threshold
   */
  async detectOverdueLeads(clientId: string) {
    const leads = await this.prisma.lead.findMany({
      where: {
        campaign_leads: {
          some: {
            campaign: {
              client_id: clientId,
            },
          },
        },
        is_overdue: false,
        last_touch_at: { not: null },
      },
      select: {
        id: true,
        name: true,
        last_touch_at: true,
        overdue_threshold_hours: true,
        owner_user_id: true,
      },
    });

    const now = new Date();
    const overdueLeads = [];

    for (const lead of leads) {
      if (!lead.last_touch_at) continue;

      const hoursSinceTouch =
        (now.getTime() - lead.last_touch_at.getTime()) / (1000 * 60 * 60);

      if (hoursSinceTouch > lead.overdue_threshold_hours) {
        overdueLeads.push(lead);

        // Mark as overdue
        await this.prisma.lead.update({
          where: { id: lead.id },
          data: {
            is_overdue: true,
            overdue_since: lead.last_touch_at,
          },
        });
      }
    }

    this.logger.log(
      `Detected ${overdueLeads.length} overdue leads for client ${clientId}`,
    );

    return overdueLeads;
  }

  /**
   * Get SLA metrics for a client
   */
  async getSlaMetrics(clientId: string) {
    const [totalLeads, overdueLeads, atRiskLeads] = await Promise.all([
      // Total active leads
      this.prisma.lead.count({
        where: {
          campaign_leads: {
            some: {
              campaign: {
                client_id: clientId,
              },
            },
          },
          status: { not: 'disqualified' },
        },
      }),

      // Overdue leads
      this.prisma.lead.count({
        where: {
          campaign_leads: {
            some: {
              campaign: {
                client_id: clientId,
              },
            },
          },
          is_overdue: true,
        },
      }),

      // At-risk leads (80% of threshold)
      this.prisma.lead.findMany({
        where: {
          campaign_leads: {
            some: {
              campaign: {
                client_id: clientId,
              },
            },
          },
          is_overdue: false,
          last_touch_at: { not: null },
        },
        select: {
          id: true,
          last_touch_at: true,
          overdue_threshold_hours: true,
        },
      }),
    ]);

    const now = new Date();
    const atRiskCount = atRiskLeads.filter((lead) => {
      if (!lead.last_touch_at) return false;
      const hoursSinceTouch =
        (now.getTime() - lead.last_touch_at.getTime()) / (1000 * 60 * 60);
      return hoursSinceTouch > lead.overdue_threshold_hours * 0.8;
    }).length;

    return {
      total_leads: totalLeads,
      overdue_leads: overdueLeads,
      at_risk_leads: atRiskCount,
      health_percentage:
        totalLeads > 0
          ? Math.round(
              ((totalLeads - overdueLeads - atRiskCount) / totalLeads) * 100,
            )
          : 100,
    };
  }

  /**
   * Get overdue leads list
   */
  async getOverdueLeads(clientId: string) {
    return this.prisma.lead.findMany({
      where: {
        campaign_leads: {
          some: {
            campaign: {
              client_id: clientId,
            },
          },
        },
        is_overdue: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        crm_stage: true,
      },
      orderBy: { overdue_since: 'asc' },
    });
  }
}
