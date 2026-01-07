import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAppointmentDto, AppointmentQueryDto } from '../dto/appointment.dto';
import { SlotGenerationService } from './slot-generation.service';

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);
  private googleCalendarApi: any; // Lazy-loaded to avoid circular dependency

  constructor(
    private prisma: PrismaService,
    private slotService: SlotGenerationService,
  ) {}

  /**
   * Set Google Calendar API service (injected from module to avoid circular dependency)
   */
  setGoogleCalendarApi(googleCalendarApi: any): void {
    this.googleCalendarApi = googleCalendarApi;
  }

  /**
   * Create a new appointment (used by public booking)
   */
  async create(
    workspaceId: string,
    leadId: string | null,
    appointmentTypeId: string,
    startAt: Date,
    timezone: string,
    locationType: string = 'phone',
    locationValue?: string,
    notes?: string,
    bookedBy: string = 'lead',
  ) {
    // 1. Verify appointment type exists and is enabled
    const appointmentType = await this.prisma.appointment_type.findFirst({
      where: {
        id: appointmentTypeId,
        workspace_id: workspaceId,
        is_enabled: true,
      },
    });

    if (!appointmentType) {
      throw new BadRequestException(
        'Appointment type not found or is disabled',
      );
    }

    // 2. Calculate end time
    const endAt = new Date(startAt);
    endAt.setMinutes(endAt.getMinutes() + appointmentType.duration_minutes);

    // 3. Check slot availability (race-safe)
    const isAvailable = await this.slotService.isSlotAvailable(
      workspaceId,
      appointmentTypeId,
      startAt,
      endAt,
    );

    if (!isAvailable) {
      throw new BadRequestException(
        'This time slot is no longer available. Please choose another time.',
      );
    }

    // 4. Create the appointment
    const appointment = await this.prisma.appointment.create({
      data: {
        workspace_id: workspaceId,
        lead_id: leadId,
        appointment_type_id: appointmentTypeId,
        booked_by: bookedBy,
        start_at: startAt,
        end_at: endAt,
        timezone,
        status: 'scheduled',
        location_type: locationType,
        location_value: locationValue,
        notes,
      },
      include: {
        appointment_type: true,
        lead: true,
      },
    });

    // 4.5. Create Google Calendar event if connected
    if (this.googleCalendarApi) {
      try {
        const leadName = appointment.lead?.name || 'Unknown Lead';
        const appointmentTypeName = appointment.appointment_type.name;
        const summary = `${appointmentTypeName} - ${leadName}`;
        
        let description = `Appointment Type: ${appointmentTypeName}\n`;
        description += `Lead: ${leadName}\n`;
        if (appointment.lead?.phone) {
          description += `Phone: ${appointment.lead.phone}\n`;
        }
        if (appointment.notes) {
          description += `\nNotes:\n${appointment.notes}`;
        }
        description += `\n\nBooking Reference: ${appointment.id}`;

        const googleEventId = await this.googleCalendarApi.createEvent(
          workspaceId,
          {
            summary,
            description,
            start: appointment.start_at,
            end: appointment.end_at,
            timezone: appointment.timezone,
            location: appointment.location_value || undefined,
          },
        );

        if (googleEventId) {
          // Update appointment with Google event ID
          await this.prisma.appointment.update({
            where: { id: appointment.id },
            data: {
              google_event_id: googleEventId,
              google_calendar_id: 'primary', // Will be fetched from connection in future
            },
          });

          this.logger.log(
            `Created Google Calendar event ${googleEventId} for appointment ${appointment.id}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to create Google Calendar event for appointment ${appointment.id}: ${error.message}`,
        );
        // Don't fail the appointment creation
      }
    }

    // 5. Emit automation event: appointment_booked
    try {
      await this.prisma.automation_event.create({
        data: {
          workspace_id: workspaceId,
          lead_id: leadId,
          event_type: 'appointment_booked',
          payload: {
            appointmentId: appointment.id,
            appointmentTypeId: appointment.appointment_type_id,
            appointmentTypeName: appointment.appointment_type.name,
            startAt: appointment.start_at.toISOString(),
            endAt: appointment.end_at.toISOString(),
            timezone: appointment.timezone,
            locationType: appointment.location_type,
            locationValue: appointment.location_value,
            bookedBy: appointment.booked_by,
          },
        },
      });

      this.logger.log(
        `Emitted appointment_booked event for appointment ${appointment.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to emit appointment_booked event: ${error.message}`,
      );
    }

    return appointment;
  }

  /**
   * Get appointments for a workspace with filters
   */
  async findAll(workspaceId: string, query: AppointmentQueryDto) {
    const where: any = { workspace_id: workspaceId };

    if (query.from || query.to) {
      where.start_at = {};
      if (query.from) {
        where.start_at.gte = new Date(query.from);
      }
      if (query.to) {
        where.start_at.lte = new Date(query.to);
      }
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.leadId) {
      where.lead_id = query.leadId;
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        appointment_type: true,
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: { start_at: 'asc' },
    });
  }

  /**
   * Get a single appointment by ID
   */
  async findOne(workspaceId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        workspace_id: workspaceId,
      },
      include: {
        appointment_type: true,
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  /**
   * Update appointment (status changes, notes)
   */
  async update(workspaceId: string, id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.findOne(workspaceId, id);

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.cancelReason && { cancel_reason: dto.cancelReason }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        appointment_type: true,
        lead: true,
      },
    });

    // If status changed to 'canceled', cancel Google Calendar event and emit event
    if (dto.status === 'canceled' && appointment.status !== 'canceled') {
      // Cancel Google Calendar event if it exists
      if (this.googleCalendarApi && appointment.google_event_id) {
        try {
          await this.googleCalendarApi.cancelEvent(
            workspaceId,
            appointment.google_event_id,
            appointment.google_calendar_id || undefined,
          );

          this.logger.log(
            `Canceled Google Calendar event ${appointment.google_event_id} for appointment ${updated.id}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to cancel Google Calendar event ${appointment.google_event_id}: ${error.message}`,
          );
          // Don't fail the cancellation
        }
      }

      // Emit automation event
      try {
        await this.prisma.automation_event.create({
          data: {
            workspace_id: workspaceId,
            lead_id: appointment.lead_id,
            event_type: 'appointment_canceled',
            payload: {
              appointmentId: updated.id,
              appointmentTypeId: updated.appointment_type_id,
              appointmentTypeName: updated.appointment_type.name,
              startAt: updated.start_at.toISOString(),
              endAt: updated.end_at.toISOString(),
              cancelReason: updated.cancel_reason,
            },
          },
        });

        this.logger.log(
          `Emitted appointment_canceled event for appointment ${updated.id}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to emit appointment_canceled event: ${error.message}`,
        );
      }
    }

    return updated;
  }

  /**
   * Cancel an appointment
   */
  async cancel(
    workspaceId: string,
    id: string,
    cancelReason?: string,
  ) {
    return this.update(workspaceId, id, {
      status: 'canceled',
      cancelReason,
    });
  }

  /**
   * Delete an appointment (hard delete)
   */
  async delete(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id); // Ensure exists
    return this.prisma.appointment.delete({ where: { id } });
  }
}
