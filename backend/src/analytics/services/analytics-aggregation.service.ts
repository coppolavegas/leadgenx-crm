import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Phase 16: Analytics Aggregation Service
 * Computes metrics from raw data and stores in analytics tables
 */
@Injectable()
export class AnalyticsAggregationService {
  private readonly logger = new Logger(AnalyticsAggregationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Aggregate all metrics for a given date range
   */
  async aggregateMetrics(
    organizationId: string,
    clientId: string | null,
    startDate: Date,
    endDate: Date,
    granularity: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<void> {
    this.logger.log(
      `Aggregating ${granularity} metrics for org ${organizationId}, client ${clientId || 'all'} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    try {
      // 1. Aggregate lead discovery metrics
      await this.aggregateLeadMetrics(
        organizationId,
        clientId,
        startDate,
        endDate,
        granularity,
      );

      // 2. Aggregate outreach metrics (if outreach data exists)
      await this.aggregateOutreachMetrics(
        organizationId,
        clientId,
        startDate,
        endDate,
        granularity,
      );

      // 3. Update attribution records
      await this.updateAttributionRecords(organizationId, clientId);

      // 4. Update funnel stage progression
      await this.updateFunnelStages(organizationId, clientId);

      this.logger.log('Metrics aggregation completed successfully');
    } catch (error) {
      this.logger.error('Failed to aggregate metrics', error.stack);
      throw error;
    }
  }

  /**
   * Aggregate lead discovery and status metrics
   */
  private async aggregateLeadMetrics(
    organizationId: string,
    clientId: string | null,
    startDate: Date,
    endDate: Date,
    granularity: 'daily' | 'weekly' | 'monthly',
  ): Promise<void> {
    // Get all campaigns for this org/client
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        organization_id: organizationId,
        ...(clientId && { client_id: clientId }),
      },
    });

    for (const campaign of campaigns) {
      // Count leads discovered in this period
      const leadsDiscovered = await this.prisma.lead.count({
        where: {
          campaign_leads: {
            some: {
              campaign_id: campaign.id,
              created_at: { gte: startDate, lte: endDate },
            },
          },
        },
      });

      // Count leads by status
      const statuses = ['new', 'contacted', 'qualified', 'converted', 'disqualified'];
      for (const status of statuses) {
        const count = await this.prisma.lead.count({
          where: {
            campaign_leads: {
              some: { campaign_id: campaign.id },
            },
            status,
            discovered_at: { gte: startDate, lte: endDate },
          },
        });

        if (count > 0) {
          await this.upsertMetric({
            organizationId,
            clientId,
            campaignId: campaign.id,
            metricName: `leads_${status}`,
            metricValue: count,
            date: startDate,
            granularity,
            source: null,
          });
        }
      }

      // Store total discovered
      if (leadsDiscovered > 0) {
        await this.upsertMetric({
          organizationId,
          clientId,
          campaignId: campaign.id,
          metricName: 'leads_discovered',
          metricValue: leadsDiscovered,
          date: startDate,
          granularity,
          source: null,
        });
      }
    }
  }

  /**
   * Aggregate outreach performance metrics
   */
  private async aggregateOutreachMetrics(
    organizationId: string,
    clientId: string | null,
    startDate: Date,
    endDate: Date,
    granularity: 'daily' | 'weekly' | 'monthly',
  ): Promise<void> {
    // Count messages sent
    const messagesSent = await this.prisma.message_log.count({
      where: {
        enrollment: {
          sequence: {
            ...(clientId
              ? { client_id: clientId }
              : {
                  client: {
                    organization_id: organizationId,
                  },
                }),
          },
        },
        sent_at: { gte: startDate, lte: endDate },
      },
    });

    if (messagesSent > 0) {
      await this.upsertMetric({
        organizationId,
        clientId,
        campaignId: null,
        metricName: 'emails_sent',
        metricValue: messagesSent,
        date: startDate,
        granularity,
        source: null,
      });
    }

    // Count replies received
    const repliesReceived = await this.prisma.message_log.count({
      where: {
        enrollment: {
          sequence: {
            ...(clientId
              ? { client_id: clientId }
              : {
                  client: {
                    organization_id: organizationId,
                  },
                }),
          },
        },
        replied_at: { not: null, gte: startDate, lte: endDate },
      },
    });

    if (repliesReceived > 0) {
      await this.upsertMetric({
        organizationId,
        clientId,
        campaignId: null,
        metricName: 'replies_received',
        metricValue: repliesReceived,
        date: startDate,
        granularity,
        source: null,
      });
    }
  }

  /**
   * Update attribution records with latest outcomes
   */
  private async updateAttributionRecords(
    organizationId: string,
    clientId: string | null,
  ): Promise<void> {
    // Find all leads that don't have attribution records yet
    const leadsWithoutAttribution = await this.prisma.lead.findMany({
      where: {
        campaign_leads: {
          some: {
            campaign: {
              organization_id: organizationId,
              ...(clientId && { client_id: clientId }),
            },
          },
        },
        analytics_attributions: {
          none: {},
        },
      },
      include: {
        campaign_leads: {
          include: {
            campaign: true,
          },
        },
        outreach_enrollments: {
          include: {
            message_logs: true,
          },
        },
      },
      take: 100, // Process in batches
    });

    for (const lead of leadsWithoutAttribution) {
      const campaignLead = lead.campaign_leads[0];
      if (!campaignLead) continue;

      const enrollment = lead.outreach_enrollments[0];
      const firstMessage = enrollment?.message_logs?.[0];
      const firstReply = enrollment?.message_logs?.find((m) => m.replied_at);

      // Calculate time metrics
      const replyTimeHours =
        firstMessage && firstMessage.sent_at && firstReply && firstReply.replied_at
          ? (firstReply.replied_at.getTime() -
              firstMessage.sent_at.getTime()) /
            (1000 * 60 * 60)
          : null;

      // Create attribution record
      await this.prisma.analytics_attribution.create({
        data: {
          organization_id: organizationId,
          client_id: clientId,
          lead_id: lead.id,
          discovery_source: lead.source,
          campaign_id: campaignLead.campaign_id,
          template_id: null,
          template_name: null,
          was_contacted: lead.status === 'contacted' || lead.status === 'qualified' || lead.status === 'converted',
          first_contact_at: firstMessage?.sent_at || null,
          replied: !!firstReply,
          first_reply_at: firstReply?.replied_at || null,
          reply_time_hours: replyTimeHours,
          meeting_booked: false, // TODO: Track from CRM data
          meeting_booked_at: null,
          meeting_time_hours: null,
          converted: lead.status === 'converted',
          converted_at: lead.status === 'converted' ? new Date() : null,
          conversion_value: null, // TODO: Track from CRM pipeline value
        },
      });
    }
  }

  /**
   * Update funnel stage progression records
   */
  private async updateFunnelStages(
    organizationId: string,
    clientId: string | null,
  ): Promise<void> {
    // Get all leads
    const leads = await this.prisma.lead.findMany({
      where: {
        campaign_leads: {
          some: {
            campaign: {
              organization_id: organizationId,
              ...(clientId && { client_id: clientId }),
            },
          },
        },
      },
      include: {
        campaign_leads: true,
        analytics_funnel_stages: true,
      },
    });

    const stageMapping: Record<string, { name: string; order: number }> = {
      new: { name: 'discovered', order: 1 },
      contacted: { name: 'contacted', order: 2 },
      qualified: { name: 'qualified', order: 3 },
      converted: { name: 'converted', order: 4 },
    };

    for (const lead of leads) {
      const currentStage = stageMapping[lead.status];
      if (!currentStage) continue;

      // Check if funnel stage record exists
      const existingStage = lead.analytics_funnel_stages.find(
        (s) => s.stage_name === currentStage.name,
      );

      if (!existingStage) {
        // Create new funnel stage record
        await this.prisma.analytics_funnel_stage.create({
          data: {
            organization_id: organizationId,
            client_id: clientId,
            lead_id: lead.id,
            stage_name: currentStage.name,
            stage_order: currentStage.order,
            campaign_id: lead.campaign_leads[0]?.campaign_id || null,
            entered_at: new Date(),
          },
        });
      }
    }
  }

  /**
   * Upsert a metric (create or update if exists)
   */
  private async upsertMetric(params: {
    organizationId: string;
    clientId: string | null;
    campaignId: string | null;
    metricName: string;
    metricValue: number;
    date: Date;
    granularity: string;
    source: string | null;
  }): Promise<void> {
    // For Prisma unique constraints, we need to use undefined instead of null
    const whereClause = {
      organization_id: params.organizationId,
      client_id: params.clientId === null ? (undefined as any) : params.clientId,
      metric_name: params.metricName,
      date: params.date,
      granularity: params.granularity,
      campaign_id: params.campaignId === null ? (undefined as any) : params.campaignId,
      source: params.source === null ? (undefined as any) : params.source,
    };

    await this.prisma.analytics_metric.upsert({
      where: {
        organization_id_client_id_metric_name_date_granularity_campaign_id_source:
          whereClause,
      },
      update: {
        metric_value: params.metricValue,
      },
      create: {
        organization_id: params.organizationId,
        client_id: params.clientId,
        campaign_id: params.campaignId,
        metric_name: params.metricName,
        metric_value: params.metricValue,
        date: params.date,
        granularity: params.granularity,
        source: params.source,
      },
    });
  }
}
