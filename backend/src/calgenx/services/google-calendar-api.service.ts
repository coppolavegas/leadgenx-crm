import { Injectable, Logger, Inject } from '@nestjs/common';
import { google, calendar_v3 } from 'googleapis';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleOAuthService } from './google-oauth.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

interface BusyTimeSlot {
  start: Date;
  end: Date;
}

/**
 * Google Calendar API Service
 * Handles FreeBusy queries, event creation, and cancellation
 */
@Injectable()
export class GoogleCalendarApiService {
  private readonly logger = new Logger(GoogleCalendarApiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleOAuth: GoogleOAuthService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Get busy time slots from Google Calendar
   * Returns time ranges where the calendar is busy
   */
  async getBusyTimes(
    workspaceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BusyTimeSlot[]> {
    try {
      // Check cache first (60-second TTL)
      const cacheKey = `gcal:busy:${workspaceId}:${startDate.getTime()}:${endDate.getTime()}`;
      const cached = await this.cacheManager.get<BusyTimeSlot[]>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for busy times: ${workspaceId}`);
        return cached;
      }

      // Get authenticated client
      const auth = await this.googleOAuth.getAuthenticatedClient(workspaceId);
      if (!auth) {
        this.logger.warn(`No Google Calendar connection for workspace ${workspaceId}`);
        return [];
      }

      // Get calendar ID
      const connection = await this.prisma.google_calendar_connection.findUnique({
        where: { workspace_id: workspaceId },
      });

      const calendarId = connection?.calendar_id || 'primary';

      // Query FreeBusy
      const calendar = google.calendar({ version: 'v3', auth });
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          items: [{ id: calendarId }],
        },
      });

      const busySlots: BusyTimeSlot[] = [];
      const calendarBusy = response.data.calendars?.[calendarId]?.busy || [];

      for (const slot of calendarBusy) {
        if (slot.start && slot.end) {
          busySlots.push({
            start: new Date(slot.start),
            end: new Date(slot.end),
          });
        }
      }

      // Cache for 60 seconds
      await this.cacheManager.set(cacheKey, busySlots, 60000);

      // Update last_synced_at
      await this.prisma.google_calendar_connection.update({
        where: { workspace_id: workspaceId },
        data: { last_synced_at: new Date() },
      }).catch(() => {});

      this.logger.log(`Retrieved ${busySlots.length} busy slots for workspace ${workspaceId}`);
      return busySlots;
    } catch (error) {
      this.logger.error(
        `Failed to get busy times for workspace ${workspaceId}: ${error.message}`,
        error.stack,
      );
      // Return empty array on failure (graceful degradation)
      return [];
    }
  }

  /**
   * Create an event in Google Calendar
   */
  async createEvent(
    workspaceId: string,
    event: {
      summary: string;
      description?: string;
      start: Date;
      end: Date;
      timezone: string;
      location?: string;
    },
  ): Promise<string | null> {
    try {
      const auth = await this.googleOAuth.getAuthenticatedClient(workspaceId);
      if (!auth) {
        this.logger.warn(`No Google Calendar connection for workspace ${workspaceId}`);
        return null;
      }

      const connection = await this.prisma.google_calendar_connection.findUnique({
        where: { workspace_id: workspaceId },
      });

      const calendarId = connection?.calendar_id || 'primary';

      const calendar = google.calendar({ version: 'v3', auth });
      const response = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: event.summary,
          description: event.description,
          location: event.location,
          start: {
            dateTime: event.start.toISOString(),
            timeZone: event.timezone,
          },
          end: {
            dateTime: event.end.toISOString(),
            timeZone: event.timezone,
          },
        },
      });

      const eventId = response.data.id;
      this.logger.log(`Created Google Calendar event ${eventId} for workspace ${workspaceId}`);
      return eventId || null;
    } catch (error) {
      this.logger.error(
        `Failed to create Google Calendar event for workspace ${workspaceId}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Cancel/delete an event in Google Calendar
   */
  async cancelEvent(
    workspaceId: string,
    eventId: string,
    calendarId?: string,
  ): Promise<boolean> {
    try {
      const auth = await this.googleOAuth.getAuthenticatedClient(workspaceId);
      if (!auth) {
        this.logger.warn(`No Google Calendar connection for workspace ${workspaceId}`);
        return false;
      }

      const connection = await this.prisma.google_calendar_connection.findUnique({
        where: { workspace_id: workspaceId },
      });

      const effectiveCalendarId = calendarId || connection?.calendar_id || 'primary';

      const calendar = google.calendar({ version: 'v3', auth });
      
      // Try to delete the event (safest approach)
      await calendar.events.delete({
        calendarId: effectiveCalendarId,
        eventId,
      });

      this.logger.log(`Deleted Google Calendar event ${eventId} for workspace ${workspaceId}`);
      return true;
    } catch (error) {
      // If event doesn't exist, consider it a success
      if (error.code === 404 || error.message?.includes('Not Found')) {
        this.logger.log(`Google Calendar event ${eventId} not found (may already be deleted)`);
        return true;
      }

      this.logger.error(
        `Failed to cancel Google Calendar event ${eventId} for workspace ${workspaceId}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * List available calendars for the connected account
   */
  async listCalendars(workspaceId: string): Promise<calendar_v3.Schema$CalendarListEntry[]> {
    try {
      const auth = await this.googleOAuth.getAuthenticatedClient(workspaceId);
      if (!auth) {
        throw new Error('Not connected to Google Calendar');
      }

      const calendar = google.calendar({ version: 'v3', auth });
      const response = await calendar.calendarList.list();

      return response.data.items || [];
    } catch (error) {
      this.logger.error(
        `Failed to list calendars for workspace ${workspaceId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update calendar settings (calendar ID, enabled status)
   */
  async updateSettings(
    workspaceId: string,
    settings: { calendarId?: string; isEnabled?: boolean },
  ): Promise<void> {
    const updateData: any = { updated_at: new Date() };

    if (settings.calendarId !== undefined) {
      updateData.calendar_id = settings.calendarId;
    }
    if (settings.isEnabled !== undefined) {
      updateData.is_enabled = settings.isEnabled;
    }

    await this.prisma.google_calendar_connection.update({
      where: { workspace_id: workspaceId },
      data: updateData,
    });

    this.logger.log(`Updated Google Calendar settings for workspace ${workspaceId}`);
  }
}
