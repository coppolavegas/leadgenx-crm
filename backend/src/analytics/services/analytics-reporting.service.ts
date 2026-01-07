import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OverviewMetricsDto,
  OverviewComparisonDto,
} from '../dto/overview-response.dto';
import { FunnelResponseDto, FunnelStageDto } from '../dto/funnel-response.dto';
import {
  AttributionResponseDto,
  SourceAttributionDto,
  CampaignAttributionDto,
} from '../dto/attribution-response.dto';
import {
  TemplateResponseDto,
  TemplatePerformanceDto,
} from '../dto/template-response.dto';

/**
 * Phase 16: Analytics Reporting Service
 * Queries aggregated metrics and generates reports
 */
@Injectable()
export class AnalyticsReportingService {
  private readonly logger = new Logger(AnalyticsReportingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get overview metrics for dashboard
   */
  async getOverviewMetrics(
    organizationId: string,
    clientId: string | null,
    startDate: Date,
    endDate: Date,
    includeComparison = false,
  ): Promise<OverviewComparisonDto> {
    this.logger.log(
      `Fetching overview metrics for org ${organizationId}, client ${clientId || 'all'}`,
    );

    const current = await this.computeOverviewMetrics(
      organizationId,
      clientId,
      startDate,
      endDate,
    );

    if (!includeComparison) {
      return { current };
    }

    // Calculate previous period
    const periodDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(
      startDate.getTime() - periodDays * 24 * 60 * 60 * 1000,
    );

    const previous = await this.computeOverviewMetrics(
      organizationId,
      clientId,
      prevStartDate,
      prevEndDate,
    );

    // Calculate growth rates
    const growthRates = this.calculateGrowthRates(current, previous);

    return { current, previous, growth_rates: growthRates };
  }

  /**
   * Compute overview metrics for a date range
   */
  private async computeOverviewMetrics(
    organizationId: string,
    clientId: string | null,
    startDate: Date,
    endDate: Date,
  ): Promise<OverviewMetricsDto> {
    // Query attribution records for this period
    const attributions = await this.prisma.analytics_attribution.findMany({
      where: {
        organization_id: organizationId,
        ...(clientId && { client_id: clientId }),
        created_at: { gte: startDate, lte: endDate },
      },
    });

    const total = attributions.length;
    const contacted = attributions.filter((a) => a.was_contacted).length;
    const replied = attributions.filter((a) => a.replied).length;
    const meetingsBooked = attributions.filter((a) => a.meeting_booked).length;
    const converted = attributions.filter((a) => a.converted).length;

    // Calculate average response times
    const replyTimes = attributions
      .filter((a) => a.reply_time_hours !== null)
      .map((a) => a.reply_time_hours as number);
    const avgReplyTime =
      replyTimes.length > 0
        ? replyTimes.reduce((sum, t) => sum + t, 0) / replyTimes.length
        : 0;

    const meetingTimes = attributions
      .filter((a) => a.meeting_time_hours !== null)
      .map((a) => a.meeting_time_hours as number);
    const avgMeetingTime =
      meetingTimes.length > 0
        ? meetingTimes.reduce((sum, t) => sum + t, 0) / meetingTimes.length
        : 0;

    // Query outreach metrics
    const emailMetrics = await this.getEmailMetrics(
      organizationId,
      clientId,
      startDate,
      endDate,
    );

    const daysInPeriod = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      leads_discovered: total,
      leads_verified: total, // Assuming all discovered leads are verified
      leads_contacted: contacted,
      leads_replied: replied,
      meetings_booked: meetingsBooked,
      leads_converted: converted,
      verification_rate: total > 0 ? 100 : 0,
      contact_rate: total > 0 ? (contacted / total) * 100 : 0,
      reply_rate: contacted > 0 ? (replied / contacted) * 100 : 0,
      meeting_rate: replied > 0 ? (meetingsBooked / replied) * 100 : 0,
      conversion_rate:
        meetingsBooked > 0 ? (converted / meetingsBooked) * 100 : 0,
      avg_reply_time_hours: avgReplyTime,
      avg_meeting_time_hours: avgMeetingTime,
      emails_sent: emailMetrics.sent,
      emails_opened: emailMetrics.opened,
      emails_clicked: emailMetrics.clicked,
      bounce_rate: emailMetrics.bounceRate,
      period_start: startDate.toISOString(),
      period_end: endDate.toISOString(),
      days_in_period: daysInPeriod,
    };
  }

  /**
   * Get email metrics
   */
  private async getEmailMetrics(
    organizationId: string,
    clientId: string | null,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    sent: number;
    opened: number;
    clicked: number;
    bounceRate: number;
  }> {
    const messages = await this.prisma.message_log.findMany({
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

    const sent = messages.length;
    const opened = 0; // TODO: Track opens when email tracking is implemented
    const clicked = 0; // TODO: Track clicks when email tracking is implemented
    const bounced = 0; // TODO: Track bounces

    return {
      sent,
      opened,
      clicked,
      bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
    };
  }

  /**
   * Calculate growth rates between two periods
   */
  private calculateGrowthRates(
    current: OverviewMetricsDto,
    previous: OverviewMetricsDto,
  ): { [key: string]: number } {
    const rates: { [key: string]: number } = {};

    const metrics: (keyof OverviewMetricsDto)[] = [
      'leads_discovered',
      'leads_contacted',
      'leads_replied',
      'meetings_booked',
      'leads_converted',
    ];

    for (const metric of metrics) {
      const curr = current[metric] as number;
      const prev = previous[metric] as number;
      if (prev > 0) {
        rates[metric] = ((curr - prev) / prev) * 100;
      } else {
        rates[metric] = curr > 0 ? 100 : 0;
      }
    }

    return rates;
  }

  /**
   * Get conversion funnel data
   */
  async getFunnelData(
    organizationId: string,
    clientId: string | null,
    startDate: Date,
    endDate: Date,
  ): Promise<FunnelResponseDto> {
    this.logger.log(
      `Fetching funnel data for org ${organizationId}, client ${clientId || 'all'}`,
    );

    // Get funnel stages
    const stages = await this.prisma.analytics_funnel_stage.findMany({
      where: {
        organization_id: organizationId,
        ...(clientId && { client_id: clientId }),
        entered_at: { gte: startDate, lte: endDate },
      },
      orderBy: {
        stage_order: 'asc',
      },
    });

    // Group by stage
    const stageGroups = stages.reduce((acc, stage) => {
      if (!acc[stage.stage_name]) {
        acc[stage.stage_name] = {
          stage_name: stage.stage_name,
          stage_order: stage.stage_order,
          count: 0,
          total_time: 0,
        };
      }
      acc[stage.stage_name].count++;
      if (stage.time_in_stage_hours) {
        acc[stage.stage_name].total_time += stage.time_in_stage_hours;
      }
      return acc;
    }, {} as Record<string, any>);

    const totalEntered = stages.filter((s) => s.stage_order === 1).length;
    const totalConverted = stages.filter((s) => s.stage_name === 'converted')
      .length;

    // Build funnel stages array
    const funnelStages: FunnelStageDto[] = Object.values(stageGroups).map(
      (group: any) => ({
        stage_name: group.stage_name,
        stage_order: group.stage_order,
        count: group.count,
        percentage: totalEntered > 0 ? (group.count / totalEntered) * 100 : 0,
        drop_off_rate: 0, // TODO: Calculate based on next stage
        avg_time_in_stage_hours:
          group.count > 0 ? group.total_time / group.count : 0,
      }),
    );

    // Sort by stage order
    funnelStages.sort((a, b) => a.stage_order - b.stage_order);

    return {
      stages: funnelStages,
      total_entered: totalEntered,
      total_converted: totalConverted,
      overall_conversion_rate:
        totalEntered > 0 ? (totalConverted / totalEntered) * 100 : 0,
      period_start: startDate.toISOString(),
      period_end: endDate.toISOString(),
    };
  }

  /**
   * Get attribution data (source and campaign performance)
   */
  async getAttributionData(
    organizationId: string,
    clientId: string | null,
    startDate: Date,
    endDate: Date,
  ): Promise<AttributionResponseDto> {
    this.logger.log(
      `Fetching attribution data for org ${organizationId}, client ${clientId || 'all'}`,
    );

    const attributions = await this.prisma.analytics_attribution.findMany({
      where: {
        organization_id: organizationId,
        ...(clientId && { client_id: clientId }),
        created_at: { gte: startDate, lte: endDate },
      },
      include: {
        campaign: true,
      },
    });

    // Group by source
    const sourceGroups = attributions.reduce((acc, attr) => {
      const source = attr.discovery_source || 'unknown';
      if (!acc[source]) {
        acc[source] = [];
      }
      acc[source].push(attr);
      return acc;
    }, {} as Record<string, any[]>);

    const sources: SourceAttributionDto[] = Object.entries(sourceGroups).map(
      ([source, attrs]) => {
        const contacted = attrs.filter((a) => a.was_contacted).length;
        const replied = attrs.filter((a) => a.replied).length;
        const meetings = attrs.filter((a) => a.meeting_booked).length;
        const conversions = attrs.filter((a) => a.converted).length;

        const replyTimes = attrs
          .filter((a) => a.reply_time_hours !== null)
          .map((a) => a.reply_time_hours);
        const avgReplyTime =
          replyTimes.length > 0
            ? replyTimes.reduce((sum, t) => sum + t, 0) / replyTimes.length
            : 0;

        return {
          source,
          leads_discovered: attrs.length,
          leads_contacted: contacted,
          replies_received: replied,
          meetings_booked: meetings,
          conversions,
          reply_rate: contacted > 0 ? (replied / contacted) * 100 : 0,
          meeting_rate: replied > 0 ? (meetings / replied) * 100 : 0,
          conversion_rate: meetings > 0 ? (conversions / meetings) * 100 : 0,
          avg_reply_time_hours: avgReplyTime,
        };
      },
    );

    // Group by campaign
    const campaignGroups = attributions.reduce((acc, attr) => {
      if (!attr.campaign_id) return acc;
      if (!acc[attr.campaign_id]) {
        acc[attr.campaign_id] = {
          campaign: attr.campaign,
          attributions: [],
        };
      }
      acc[attr.campaign_id].attributions.push(attr);
      return acc;
    }, {} as Record<string, any>);

    const campaigns: CampaignAttributionDto[] = Object.values(
      campaignGroups,
    ).map((group: any) => {
      const attrs = group.attributions;
      const contacted = attrs.filter((a: any) => a.was_contacted).length;
      const replied = attrs.filter((a: any) => a.replied).length;
      const meetings = attrs.filter((a: any) => a.meeting_booked).length;
      const conversions = attrs.filter((a: any) => a.converted).length;

      return {
        campaign_id: group.campaign.id,
        campaign_name: group.campaign.name,
        leads_discovered: attrs.length,
        leads_contacted: contacted,
        replies_received: replied,
        meetings_booked: meetings,
        conversions,
        reply_rate: contacted > 0 ? (replied / contacted) * 100 : 0,
        meeting_rate: replied > 0 ? (meetings / replied) * 100 : 0,
        conversion_rate: meetings > 0 ? (conversions / meetings) * 100 : 0,
        total_cost: undefined,
        cost_per_lead: undefined,
        cost_per_meeting: undefined,
      };
    });

    return {
      sources,
      campaigns,
      period_start: startDate.toISOString(),
      period_end: endDate.toISOString(),
    };
  }

  /**
   * Get template performance data
   */
  async getTemplatePerformance(
    organizationId: string,
    clientId: string | null,
    startDate: Date,
    endDate: Date,
  ): Promise<TemplateResponseDto> {
    this.logger.log(
      `Fetching template performance for org ${organizationId}, client ${clientId || 'all'}`,
    );

    const templates = await this.prisma.analytics_template_performance.findMany(
      {
        where: {
          organization_id: organizationId,
          ...(clientId && { client_id: clientId }),
          period_start: { gte: startDate },
          period_end: { lte: endDate },
        },
      },
    );

    const templateData: TemplatePerformanceDto[] = templates.map((t) => ({
      template_id: t.template_id || undefined,
      template_name: t.template_name,
      template_type: t.template_type,
      sends_count: t.sends_count,
      opens_count: t.opens_count,
      clicks_count: t.clicks_count,
      replies_count: t.replies_count,
      bounces_count: t.bounces_count,
      open_rate: t.open_rate || 0,
      click_rate: t.click_rate || 0,
      reply_rate: t.reply_rate || 0,
      bounce_rate: t.bounce_rate || 0,
    }));

    return {
      templates: templateData,
      period_start: startDate.toISOString(),
      period_end: endDate.toISOString(),
    };
  }
}
