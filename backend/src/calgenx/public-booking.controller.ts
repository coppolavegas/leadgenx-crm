import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { BookingLinkService } from './services/booking-link.service';
import { AppointmentService } from './services/appointment.service';
import { AppointmentTypeService } from './services/appointment-type.service';
import { SlotGenerationService } from './services/slot-generation.service';
import { BookAppointmentDto, GetSlotsQueryDto } from './dto/public-booking.dto';

@ApiTags('Public Booking (No Auth)')
@Controller('public/booking')
export class PublicBookingController {
  private readonly logger = new Logger(PublicBookingController.name);

  constructor(
    private prisma: PrismaService,
    private bookingLinkService: BookingLinkService,
    private appointmentService: AppointmentService,
    private appointmentTypeService: AppointmentTypeService,
    private slotService: SlotGenerationService,
  ) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get booking page data' })
  async getBookingPageData(@Param('slug') slug: string) {
    const bookingLink = await this.bookingLinkService.findBySlug(slug);

    // Get all enabled appointment types for this workspace
    const appointmentTypes = await this.appointmentTypeService.findAll(
      bookingLink.workspace_id,
    );

    const enabledTypes = appointmentTypes.filter((t) => t.is_enabled);

    return {
      workspace: {
        id: bookingLink.workspace.id,
        name: bookingLink.workspace.name,
      },
      bookingLink: {
        id: bookingLink.id,
        slug: bookingLink.slug,
      },
      appointmentTypes: enabledTypes.map((t) => ({
        id: t.id,
        name: t.name,
        durationMinutes: t.duration_minutes,
      })),
      defaultAppointmentTypeId: bookingLink.appointment_type_id,
    };
  }

  @Get(':slug/slots')
  @ApiOperation({ summary: 'Get available time slots' })
  async getAvailableSlots(
    @Param('slug') slug: string,
    @Query() query: GetSlotsQueryDto,
  ) {
    const bookingLink = await this.bookingLinkService.findBySlug(slug);

    // Verify appointment type exists and is enabled
    const appointmentType = await this.appointmentTypeService.findOne(
      bookingLink.workspace_id,
      query.appointmentTypeId,
    );

    if (!appointmentType.is_enabled) {
      throw new BadRequestException(
        'This appointment type is currently unavailable',
      );
    }

    // Generate slots
    const slots = await this.slotService.generateSlots(
      bookingLink.workspace_id,
      query.from,
      query.days,
      query.appointmentTypeId,
    );

    return {
      slots,
      appointmentType: {
        id: appointmentType.id,
        name: appointmentType.name,
        durationMinutes: appointmentType.duration_minutes,
      },
    };
  }

  @Post(':slug/book')
  @ApiOperation({ summary: 'Book an appointment' })
  async bookAppointment(
    @Param('slug') slug: string,
    @Body() dto: BookAppointmentDto,
  ) {
    const bookingLink = await this.bookingLinkService.findBySlug(slug);

    // 1. Find or create lead
    let lead = null;

    // Try to find existing lead by phone or email
    if (dto.lead.phone) {
      lead = await this.prisma.lead.findFirst({
        where: {
          phone: dto.lead.phone,
          // Note: Lead model doesn't have workspace_id, so we can't scope by workspace
          // This is a limitation - in production, you'd want to add workspace_id to lead model
        },
      });
    }

    // If not found, create new lead
    if (!lead) {
      const fullName = `${dto.lead.firstName} ${dto.lead.lastName}`;
      lead = await this.prisma.lead.create({
        data: {
          name: fullName,
          phone: dto.lead.phone || null,
          source: 'calgenx_booking',
          status: 'new',
          is_lead: true,
        },
      });

      this.logger.log(`Created new lead ${lead.id} for booking`);
    }

    // 2. Create appointment
    const appointment = await this.appointmentService.create(
      bookingLink.workspace_id,
      lead.id,
      dto.appointmentTypeId,
      new Date(dto.startAt),
      dto.timezone,
      dto.locationType || 'phone',
      dto.locationValue,
      dto.notes,
      'lead',
    );

    this.logger.log(
      `Appointment ${appointment.id} booked successfully via slug ${slug}`,
    );

    return {
      success: true,
      appointment: {
        id: appointment.id,
        startAt: appointment.start_at,
        endAt: appointment.end_at,
        timezone: appointment.timezone,
        status: appointment.status,
        appointmentType: {
          name: appointment.appointment_type.name,
          durationMinutes: appointment.appointment_type.duration_minutes,
        },
      },
      lead: {
        id: lead.id,
        name: lead.name,
      },
      message: 'Appointment booked successfully!',
    };
  }
}
