import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * QuietHoursService
 * Enforces workspace-specific quiet hours for messaging
 */
@Injectable()
export class QuietHoursService {
  private readonly logger = new Logger(QuietHoursService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if current time is within quiet hours for a workspace
   * Returns: { isQuietHours: boolean, nextAllowedTime?: Date }
   */
  async isQuietHours(workspaceId: string): Promise<{
    isQuietHours: boolean;
    nextAllowedTime?: Date;
    reason?: string;
  }> {
    try {
      const settings = await this.prisma.messaging_settings.findUnique({
        where: { workspace_id: workspaceId },
        select: {
          quiet_hours_enabled: true,
          quiet_hours_start: true,
          quiet_hours_end: true,
          quiet_hours_timezone: true,
        },
      });

      // If quiet hours not enabled, allow sending
      if (!settings || !settings.quiet_hours_enabled) {
        return { isQuietHours: false };
      }

      const timezone = settings.quiet_hours_timezone || 'America/New_York';
      const startHour = settings.quiet_hours_start ?? 21; // 9 PM
      const endHour = settings.quiet_hours_end ?? 8; // 8 AM

      // Get current time in workspace timezone
      const now = new Date();
      const currentHourInTimezone = this.getHourInTimezone(now, timezone);

      const isInQuietHours = this.isInQuietHoursRange(
        currentHourInTimezone,
        startHour,
        endHour,
      );

      if (isInQuietHours) {
        const nextAllowedTime = this.calculateNextAllowedTime(
          now,
          timezone,
          endHour,
        );

        return {
          isQuietHours: true,
          nextAllowedTime,
          reason: `Quiet hours (${startHour}:00 - ${endHour}:00 ${timezone})`,
        };
      }

      return { isQuietHours: false };
    } catch (error) {
      this.logger.error(
        `Failed to check quiet hours for workspace ${workspaceId}`,
        error,
      );
      // Fail open - allow sending if we can't check quiet hours
      return { isQuietHours: false };
    }
  }

  /**
   * Get current hour in a specific timezone (0-23)
   */
  private getHourInTimezone(date: Date, timezone: string): number {
    try {
      const dateInTimezone = new Date(
        date.toLocaleString('en-US', { timeZone: timezone }),
      );
      return dateInTimezone.getHours();
    } catch (error) {
      this.logger.error(
        `Invalid timezone ${timezone}, falling back to UTC`,
        error,
      );
      return date.getUTCHours();
    }
  }

  /**
   * Check if current hour is in quiet hours range
   * Handles ranges that cross midnight (e.g., 21:00 - 08:00)
   */
  private isInQuietHoursRange(
    currentHour: number,
    startHour: number,
    endHour: number,
  ): boolean {
    if (startHour < endHour) {
      // Range within same day (e.g., 13:00 - 17:00)
      return currentHour >= startHour && currentHour < endHour;
    } else {
      // Range crosses midnight (e.g., 21:00 - 08:00)
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  /**
   * Calculate next allowed time after quiet hours
   */
  private calculateNextAllowedTime(
    now: Date,
    timezone: string,
    endHour: number,
  ): Date {
    try {
      // Get current time in workspace timezone
      const dateInTimezone = new Date(
        now.toLocaleString('en-US', { timeZone: timezone }),
      );
      const currentHour = dateInTimezone.getHours();

      // Calculate hours until end of quiet hours
      let hoursUntilEnd: number;

      if (currentHour < endHour) {
        // Same day
        hoursUntilEnd = endHour - currentHour;
      } else {
        // Next day
        hoursUntilEnd = 24 - currentHour + endHour;
      }

      // Add buffer minutes to ensure we're past quiet hours
      const nextAllowedTime = new Date(
        now.getTime() + hoursUntilEnd * 60 * 60 * 1000 + 5 * 60 * 1000,
      );

      return nextAllowedTime;
    } catch (error) {
      this.logger.error('Failed to calculate next allowed time', error);
      // Default to 1 hour from now
      return new Date(now.getTime() + 60 * 60 * 1000);
    }
  }

  /**
   * Get quiet hours settings for a workspace
   */
  async getQuietHoursSettings(workspaceId: string): Promise<{
    enabled: boolean;
    startHour: number;
    endHour: number;
    timezone: string;
  } | null> {
    const settings = await this.prisma.messaging_settings.findUnique({
      where: { workspace_id: workspaceId },
      select: {
        quiet_hours_enabled: true,
        quiet_hours_start: true,
        quiet_hours_end: true,
        quiet_hours_timezone: true,
      },
    });

    if (!settings) {
      return null;
    }

    return {
      enabled: settings.quiet_hours_enabled,
      startHour: settings.quiet_hours_start ?? 21,
      endHour: settings.quiet_hours_end ?? 8,
      timezone: settings.quiet_hours_timezone || 'America/New_York',
    };
  }
}
