import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CalGenXFeatureGuard } from './guards/calgenx-feature.guard';
import { AppointmentTypeService } from './services/appointment-type.service';
import { AvailabilityService } from './services/availability.service';
import { AppointmentService } from './services/appointment.service';
import { BookingLinkService } from './services/booking-link.service';
import { IcalFeedService } from './services/ical-feed.service';
import {
  CreateAppointmentTypeDto,
  UpdateAppointmentTypeDto,
} from './dto/appointment-type.dto';
import {
  CreateAvailabilityRuleDto,
  UpdateAvailabilityRuleDto,
} from './dto/availability.dto';
import {
  UpdateAppointmentDto,
  AppointmentQueryDto,
} from './dto/appointment.dto';
import {
  IcalFeedResponseDto,
  UpdateIcalFeedDto,
} from './dto/ical-feed.dto';
import {
  CreateBookingLinkDto,
  UpdateBookingLinkDto,
} from './dto/booking-link.dto';

@ApiTags('CalGenX - Appointment Scheduling')
@Controller('workspaces/:workspaceId/calgenx')
@UseGuards(CalGenXFeatureGuard)
export class CalGenXController {
  constructor(
    private appointmentTypeService: AppointmentTypeService,
    private availabilityService: AvailabilityService,
    private appointmentService: AppointmentService,
    private bookingLinkService: BookingLinkService,
    private icalFeedService: IcalFeedService,
  ) {}

  // ==================== Appointment Types ====================

  @Get('appointment-types')
  @ApiOperation({ summary: 'Get all appointment types' })
  async getAppointmentTypes(@Param('workspaceId') workspaceId: string) {
    return this.appointmentTypeService.findAll(workspaceId);
  }

  @Post('appointment-types')
  @ApiOperation({ summary: 'Create appointment type' })
  async createAppointmentType(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateAppointmentTypeDto,
  ) {
    return this.appointmentTypeService.create(workspaceId, dto);
  }

  @Patch('appointment-types/:id')
  @ApiOperation({ summary: 'Update appointment type' })
  async updateAppointmentType(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentTypeDto,
  ) {
    return this.appointmentTypeService.update(workspaceId, id, dto);
  }

  @Delete('appointment-types/:id')
  @ApiOperation({ summary: 'Delete appointment type' })
  async deleteAppointmentType(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.appointmentTypeService.delete(workspaceId, id);
  }

  // ==================== Availability Rules ====================

  @Get('availability')
  @ApiOperation({ summary: 'Get all availability rules' })
  async getAvailabilityRules(@Param('workspaceId') workspaceId: string) {
    return this.availabilityService.findAll(workspaceId);
  }

  @Post('availability')
  @ApiOperation({ summary: 'Create availability rule' })
  async createAvailabilityRule(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateAvailabilityRuleDto,
  ) {
    return this.availabilityService.create(workspaceId, dto);
  }

  @Patch('availability/:id')
  @ApiOperation({ summary: 'Update availability rule' })
  async updateAvailabilityRule(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAvailabilityRuleDto,
  ) {
    return this.availabilityService.update(workspaceId, id, dto);
  }

  @Delete('availability/:id')
  @ApiOperation({ summary: 'Delete availability rule' })
  async deleteAvailabilityRule(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.availabilityService.delete(workspaceId, id);
  }

  // ==================== Appointments ====================

  @Get('appointments')
  @ApiOperation({ summary: 'Get all appointments with filters' })
  async getAppointments(
    @Param('workspaceId') workspaceId: string,
    @Query() query: AppointmentQueryDto,
  ) {
    return this.appointmentService.findAll(workspaceId, query);
  }

  @Get('appointments/:id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  async getAppointment(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.appointmentService.findOne(workspaceId, id);
  }

  @Patch('appointments/:id')
  @ApiOperation({ summary: 'Update appointment (status, notes)' })
  async updateAppointment(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentService.update(workspaceId, id, dto);
  }

  @Post('appointments/:id/cancel')
  @ApiOperation({ summary: 'Cancel appointment' })
  async cancelAppointment(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body('cancelReason') cancelReason?: string,
  ) {
    return this.appointmentService.cancel(workspaceId, id, cancelReason);
  }

  @Delete('appointments/:id')
  @ApiOperation({ summary: 'Delete appointment' })
  async deleteAppointment(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.appointmentService.delete(workspaceId, id);
  }

  // ==================== Booking Links ====================

  @Get('booking-links')
  @ApiOperation({ summary: 'Get all booking links' })
  async getBookingLinks(@Param('workspaceId') workspaceId: string) {
    return this.bookingLinkService.findAll(workspaceId);
  }

  @Post('booking-links')
  @ApiOperation({ summary: 'Create booking link' })
  async createBookingLink(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateBookingLinkDto,
  ) {
    return this.bookingLinkService.create(workspaceId, dto);
  }

  @Patch('booking-links/:id')
  @ApiOperation({ summary: 'Update booking link' })
  async updateBookingLink(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBookingLinkDto,
  ) {
    return this.bookingLinkService.update(workspaceId, id, dto);
  }

  @Delete('booking-links/:id')
  @ApiOperation({ summary: 'Delete booking link' })
  async deleteBookingLink(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.bookingLinkService.delete(workspaceId, id);
  }

  // ==================== iCalendar Feed Management ====================

  @Get('ical')
  @ApiOperation({
    summary: 'Get iCal feed details',
    description:
      'Returns the iCalendar subscription feed URL and settings for this workspace. ' +
      'Creates a feed with a secure token if one does not exist yet.',
  })
  async getIcalFeed(
    @Param('workspaceId') workspaceId: string,
  ): Promise<IcalFeedResponseDto> {
    const feed = await this.icalFeedService.getOrCreateFeed(workspaceId);
    
    // Build full feed URL (assume production domain or use env var)
    const baseUrl = process.env.APP_BASE_URL || 'https://api.leadgenx.app';
    const feedUrl = `${baseUrl}/v1/public/ical/${feed.token}.ics`;

    return {
      id: feed.id,
      workspaceId: feed.workspace_id,
      isEnabled: feed.is_enabled,
      name: feed.name ?? undefined,
      feedUrl,
      createdAt: feed.created_at,
      updatedAt: feed.updated_at,
      lastRotatedAt: feed.last_rotated_at ?? undefined,
    };
  }

  @Post('ical/rotate')
  @ApiOperation({
    summary: 'Rotate iCal feed token',
    description:
      'Generates a new secure token for the iCal feed. ' +
      'The old feed URL will immediately stop working. ' +
      'Use this for security if the feed URL is accidentally exposed.',
  })
  async rotateIcalFeedToken(
    @Param('workspaceId') workspaceId: string,
  ): Promise<IcalFeedResponseDto> {
    const feed = await this.icalFeedService.rotateFeedToken(workspaceId);
    
    const baseUrl = process.env.APP_BASE_URL || 'https://api.leadgenx.app';
    const feedUrl = `${baseUrl}/v1/public/ical/${feed.token}.ics`;

    return {
      id: feed.id,
      workspaceId: feed.workspace_id,
      isEnabled: feed.is_enabled,
      name: feed.name ?? undefined,
      feedUrl,
      createdAt: feed.created_at,
      updatedAt: feed.updated_at,
      lastRotatedAt: feed.last_rotated_at ?? undefined,
    };
  }

  @Patch('ical')
  @ApiOperation({
    summary: 'Update iCal feed settings',
    description:
      'Enable/disable the iCal feed or update its name. ' +
      'When disabled, the public .ics endpoint returns 404.',
  })
  async updateIcalFeed(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateIcalFeedDto,
  ): Promise<IcalFeedResponseDto> {
    const feed = await this.icalFeedService.updateFeed(workspaceId, dto);
    
    const baseUrl = process.env.APP_BASE_URL || 'https://api.leadgenx.app';
    const feedUrl = `${baseUrl}/v1/public/ical/${feed.token}.ics`;

    return {
      id: feed.id,
      workspaceId: feed.workspace_id,
      isEnabled: feed.is_enabled,
      name: feed.name ?? undefined,
      feedUrl,
      createdAt: feed.created_at,
      updatedAt: feed.updated_at,
      lastRotatedAt: feed.last_rotated_at ?? undefined,
    };
  }
}
