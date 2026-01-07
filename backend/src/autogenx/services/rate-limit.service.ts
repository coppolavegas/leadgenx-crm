import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * RateLimitService
 * Enforces daily send limits per workspace per channel
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if sending a message would exceed daily limit
   * Returns: { allowed: boolean, remaining?: number, limit?: number }
   */
  async checkLimit(
    workspaceId: string,
    channel: 'sms' | 'email',
  ): Promise<{
    allowed: boolean;
    remaining?: number;
    limit?: number;
    reason?: string;
  }> {
    try {
      // Get workspace settings
      const settings = await this.prisma.messaging_settings.findUnique({
        where: { workspace_id: workspaceId },
        select: {
          sms_daily_limit: true,
          email_daily_limit: true,
        },
      });

      if (!settings) {
        this.logger.warn(
          `No messaging settings found for workspace ${workspaceId}`,
        );
        // Default limits
        return {
          allowed: true,
          remaining: channel === 'sms' ? 100 : 500,
          limit: channel === 'sms' ? 100 : 500,
        };
      }

      const limit =
        channel === 'sms'
          ? settings.sms_daily_limit
          : settings.email_daily_limit;

      // Get today's usage
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const usage = await this.prisma.messaging_daily_usage.findFirst({
        where: {
          workspace_id: workspaceId,
          channel,
          date: today,
        },
        select: { count: true },
      });

      const currentCount = usage?.count ?? 0;
      const remaining = Math.max(0, limit - currentCount);

      if (currentCount >= limit) {
        return {
          allowed: false,
          remaining: 0,
          limit,
          reason: `Daily ${channel.toUpperCase()} limit of ${limit} reached`,
        };
      }

      return {
        allowed: true,
        remaining,
        limit,
      };
    } catch (error) {
      this.logger.error(
        `Failed to check rate limit for workspace ${workspaceId} channel ${channel}`,
        error,
      );
      // Fail open - allow sending if we can't check limits
      return { allowed: true };
    }
  }

  /**
   * Increment usage counter for a workspace/channel/date
   */
  async incrementUsage(
    workspaceId: string,
    channel: 'sms' | 'email',
  ): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Upsert usage record
      await this.prisma.messaging_daily_usage.upsert({
        where: {
          workspace_id_date_channel: {
            workspace_id: workspaceId,
            date: today,
            channel,
          },
        },
        create: {
          workspace_id: workspaceId,
          channel,
          date: today,
          count: 1,
        },
        update: {
          count: {
            increment: 1,
          },
        },
      });

      this.logger.debug(
        `Incremented ${channel} usage for workspace ${workspaceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to increment usage for workspace ${workspaceId} channel ${channel}`,
        error,
      );
      // Don't throw - usage tracking failure shouldn't block sending
    }
  }

  /**
   * Get current usage for a workspace/channel
   */
  async getCurrentUsage(
    workspaceId: string,
    channel: 'sms' | 'email',
  ): Promise<{
    count: number;
    limit: number;
    remaining: number;
    date: Date;
  }> {
    const settings = await this.prisma.messaging_settings.findUnique({
      where: { workspace_id: workspaceId },
      select: {
        sms_daily_limit: true,
        email_daily_limit: true,
      },
    });

    const limit =
      channel === 'sms'
        ? settings?.sms_daily_limit ?? 100
        : settings?.email_daily_limit ?? 500;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.prisma.messaging_daily_usage.findFirst({
      where: {
        workspace_id: workspaceId,
        channel,
        date: today,
      },
      select: { count: true },
    });

    const count = usage?.count ?? 0;
    const remaining = Math.max(0, limit - count);

    return {
      count,
      limit,
      remaining,
      date: today,
    };
  }

  /**
   * Get usage stats for a workspace across all channels
   */
  async getWorkspaceUsage(workspaceId: string): Promise<{
    sms: { count: number; limit: number; remaining: number };
    email: { count: number; limit: number; remaining: number };
  }> {
    const [smsUsage, emailUsage] = await Promise.all([
      this.getCurrentUsage(workspaceId, 'sms'),
      this.getCurrentUsage(workspaceId, 'email'),
    ]);

    return {
      sms: {
        count: smsUsage.count,
        limit: smsUsage.limit,
        remaining: smsUsage.remaining,
      },
      email: {
        count: emailUsage.count,
        limit: emailUsage.limit,
        remaining: emailUsage.remaining,
      },
    };
  }
}
