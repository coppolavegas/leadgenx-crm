import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import type { Response } from 'express';
import { IcalFeedService } from './services/ical-feed.service';
import { IcalGeneratorService } from './services/ical-generator.service';

/**
 * PublicIcalController
 * 
 * Public endpoints for iCalendar subscription feeds.
 * NO AUTHENTICATION REQUIRED - Security via unguessable tokens.
 */
@ApiTags('Public - iCalendar Feeds')
@Controller('public/ical')
export class PublicIcalController {
  private readonly logger = new Logger(PublicIcalController.name);

  constructor(
    private readonly icalFeedService: IcalFeedService,
    private readonly icalGeneratorService: IcalGeneratorService,
  ) {}

  /**
   * GET /public/ical/:token.ics
   * 
   * Public iCalendar subscription endpoint.
   * Returns .ics file with appointments for the workspace.
   */
  @Get(':token.ics')
  @ApiOperation({
    summary: 'Get iCalendar subscription feed',
    description:
      'Returns a valid .ics calendar file for subscribing in Apple Calendar, Google Calendar, Outlook, etc. ' +
      'Includes scheduled and canceled appointments within 30 days past to 180 days future.',
  })
  @ApiParam({
    name: 'token',
    description: 'Secure feed token (obtained from workspace admin)',
    example: 'a1b2c3d4e5f6...',
  })
  async getIcalFeed(
    @Param('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Look up feed by token (throws if not found or disabled)
      const feed = await this.icalFeedService.getFeedByToken(token);

      // Generate .ics content
      const icsContent = await this.icalGeneratorService.generateIcalForWorkspace(
        feed.workspace_id,
      );

      // Set proper headers for .ics file
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'inline; filename="leadgenx-calendar.ics"');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      this.logger.log(
        `Served iCal feed for workspace ${feed.workspace_id} (token: ${token.substring(0, 8)}...)`,
      );

      res.send(icsContent);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`iCal feed not found or disabled: ${token.substring(0, 8)}...`);
        throw error;
      }
      this.logger.error(`Error generating iCal feed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
