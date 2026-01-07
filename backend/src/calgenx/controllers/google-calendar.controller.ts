import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { GoogleOAuthService } from '../services/google-oauth.service';
import { GoogleCalendarApiService } from '../services/google-calendar-api.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GoogleCalendarStatusDto,
  GoogleCalendarListDto,
  GoogleCalendarListItemDto,
  UpdateGoogleCalendarSettingsDto,
  GoogleCalendarConnectResponseDto,
} from '../dto/google-calendar.dto';

/**
 * Google Calendar Integration Controller
 * Handles OAuth, connection status, and calendar management
 */
@ApiTags('CalGenX - Google Calendar')
@Controller('workspaces/:workspaceId/calgenx/google')
@UseGuards(SessionAuthGuard)
export class GoogleCalendarController {
  private readonly logger = new Logger(GoogleCalendarController.name);

  constructor(
    private readonly googleOAuth: GoogleOAuthService,
    private readonly googleCalendarApi: GoogleCalendarApiService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Initiate Google OAuth flow
   * Redirects user to Google consent screen
   */
  @Get('connect')
  @ApiOperation({ summary: 'Connect Google Calendar (OAuth redirect)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async connect(
    @Param('workspaceId') workspaceId: string,
    @Res() res: Response,
  ): Promise<void> {
    // Verify workspace exists and calgenx is enabled
    const workspace = await this.prisma.organization.findUnique({
      where: { id: workspaceId },
      select: { calgenx_enabled: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (!workspace.calgenx_enabled) {
      throw new NotFoundException('CalGenX not enabled for this workspace');
    }

    const authUrl = this.googleOAuth.getAuthorizationUrl(workspaceId);
    res.redirect(authUrl);
  }

  /**
   * OAuth callback endpoint
   * Exchanges code for tokens and stores them
   */
  @Get('callback')
  @ApiOperation({ summary: 'OAuth callback (internal)' })
  @ApiQuery({ name: 'code', description: 'Authorization code from Google' })
  @ApiQuery({ name: 'state', description: 'CSRF state token' })
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { workspaceId } = await this.googleOAuth.exchangeCodeForTokens(code, state);
      
      // Redirect to dashboard with success
      const dashboardUrl = `/workspaces/${workspaceId}/settings?gcal=success`;
      res.redirect(dashboardUrl);
    } catch (error) {
      this.logger.error(`OAuth callback failed: ${error.message}`, error.stack);
      // Redirect to dashboard with error
      res.redirect('/settings?gcal=error');
    }
  }

  /**
   * Get Google Calendar connection status
   */
  @Get('status')
  @ApiOperation({ summary: 'Get Google Calendar connection status' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async getStatus(
    @Param('workspaceId') workspaceId: string,
  ): Promise<GoogleCalendarStatusDto> {
    const connection = await this.prisma.google_calendar_connection.findUnique({
      where: { workspace_id: workspaceId },
    });

    if (!connection) {
      return {
        connected: false,
        enabled: false,
      };
    }

    return {
      connected: true,
      googleUserEmail: connection.google_user_email || undefined,
      calendarId: connection.calendar_id,
      enabled: connection.is_enabled,
      lastSyncedAt: connection.last_synced_at || undefined,
    };
  }

  /**
   * List available Google Calendars
   */
  @Get('calendars')
  @ApiOperation({ summary: 'List available Google Calendars' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async listCalendars(
    @Param('workspaceId') workspaceId: string,
  ): Promise<GoogleCalendarListDto> {
    const calendars = await this.googleCalendarApi.listCalendars(workspaceId);

    return {
      calendars: calendars.map((cal) => ({
        id: cal.id || '',
        summary: cal.summary || 'Untitled',
        primary: cal.primary || false,
        description: cal.description ?? undefined,
        timeZone: cal.timeZone ?? undefined,
      })),
    };
  }

  /**
   * Update Google Calendar settings
   */
  @Patch('settings')
  @ApiOperation({ summary: 'Update Google Calendar settings' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async updateSettings(
    @Param('workspaceId') workspaceId: string,
    @Body() body: UpdateGoogleCalendarSettingsDto,
  ): Promise<GoogleCalendarStatusDto> {
    await this.googleCalendarApi.updateSettings(workspaceId, body);
    return this.getStatus(workspaceId);
  }

  /**
   * Disconnect Google Calendar
   */
  @Post('disconnect')
  @ApiOperation({ summary: 'Disconnect Google Calendar' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async disconnect(
    @Param('workspaceId') workspaceId: string,
  ): Promise<{ message: string }> {
    await this.googleOAuth.disconnect(workspaceId);
    return { message: 'Google Calendar disconnected successfully' };
  }
}
