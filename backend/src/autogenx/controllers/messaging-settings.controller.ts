import { Controller, Get, Put, Body, UseGuards, Req, Logger } from '@nestjs/common';
import { MessagingSettingsService } from '../services/messaging-settings.service';
import { RateLimitService } from '../services/rate-limit.service';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

/**
 * MessagingSettingsController
 * Manage messaging settings and view usage stats.
 * Phase 4.5: AutoGenX Messaging, Compliance & Inbound
 */
@ApiTags('AutoGenX - Messaging Settings')
@Controller('api/autogenx/messaging-settings')
@UseGuards(SessionAuthGuard)
@ApiBearerAuth()
export class MessagingSettingsController {
  private readonly logger = new Logger(MessagingSettingsController.name);

  constructor(
    private readonly settingsService: MessagingSettingsService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  /**
   * Get messaging settings for current workspace.
   */
  @Get()
  @ApiOperation({ summary: 'Get messaging settings' })
  async getSettings(@Req() req: any) {
    const workspaceId = req.user.organization_id;
    const settings = await this.settingsService.getOrCreateSettings(workspaceId);

    // Don't expose sensitive credentials in response
    const { twilio_auth_token, sendgrid_api_key, ...safeSettings } = settings;

    return {
      ...safeSettings,
      twilioConfigured: !!twilio_auth_token,
      sendgridConfigured: !!sendgrid_api_key,
    };
  }

  /**
   * Update messaging settings.
   */
  @Put()
  @ApiOperation({ summary: 'Update messaging settings' })
  async updateSettings(@Req() req: any, @Body() body: any) {
    const workspaceId = req.user.organization_id;

    // Only allow updating specific fields
    const allowedFields = [
      'sms_enabled',
      'email_enabled',
      'sms_daily_limit',
      'email_daily_limit',
      'quiet_hours_enabled',
      'quiet_hours_start',
      'quiet_hours_end',
      'quiet_hours_timezone',
      'respect_opt_outs',
      'twilio_account_sid',
      'twilio_auth_token',
      'twilio_from_phone',
      'sendgrid_api_key',
      'sendgrid_from_email',
      'sendgrid_from_name',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updated = await this.settingsService.updateSettings(workspaceId, updateData);

    this.logger.log(`Updated messaging settings for workspace ${workspaceId}`);

    // Don't expose sensitive credentials
    const { twilio_auth_token, sendgrid_api_key, ...safeSettings } = updated;

    return {
      ...safeSettings,
      twilioConfigured: !!twilio_auth_token,
      sendgridConfigured: !!sendgrid_api_key,
    };
  }

  /**
   * Get current usage stats.
   */
  @Get('usage')
  @ApiOperation({ summary: 'Get messaging usage stats' })
  async getUsage(@Req() req: any) {
    const workspaceId = req.user.organization_id;

    const smsUsage = await this.rateLimitService.getCurrentUsage(workspaceId, 'sms');
    const emailUsage = await this.rateLimitService.getCurrentUsage(workspaceId, 'email');

    return {
      sms: smsUsage,
      email: emailUsage,
    };
  }
}
