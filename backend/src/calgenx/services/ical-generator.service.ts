import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import ical, { ICalCalendar, ICalEventStatus, ICalCalendarMethod } from 'ical-generator';

/**
 * IcalGeneratorService
 * 
 * Generates valid iCalendar (.ics) content for workspace appointments.
 * Compatible with Apple Calendar, Google Calendar, Outlook, etc.
 */
@Injectable()
export class IcalGeneratorService {
  private readonly logger = new Logger(IcalGeneratorService.name);

  // Date window configuration
  private readonly PAST_DAYS = 30;
  private readonly FUTURE_DAYS = 180;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate .ics content for a workspace's appointments
   */
  async generateIcalForWorkspace(workspaceId: string): Promise<string> {
    // Calculate date window
    const now = new Date();
    const startWindow = new Date(now);
    startWindow.setDate(now.getDate() - this.PAST_DAYS);
    const endWindow = new Date(now);
    endWindow.setDate(now.getDate() + this.FUTURE_DAYS);

    // Fetch appointments in window (scheduled + canceled)
    const appointments = await this.prisma.appointment.findMany({
      where: {
        workspace_id: workspaceId,
        start_at: {
          gte: startWindow,
          lte: endWindow,
        },
        status: {
          in: ['scheduled', 'canceled'],
        },
      },
      include: {
        lead: true,
        appointment_type: true,
      },
      orderBy: {
        start_at: 'asc',
      },
    });

    this.logger.log(
      `Generating iCal feed for workspace ${workspaceId}: ${appointments.length} appointments`,
    );

    // Create calendar
    const calendar: ICalCalendar = ical({
      name: 'LeadGenX Appointments',
      description: 'Calendar subscription for LeadGenX appointments',
      prodId: '//LeadGenX//CalGenX//EN',
      method: ICalCalendarMethod.PUBLISH,
      timezone: 'UTC',
    });

    // Add each appointment as an event
    for (const appointment of appointments) {
      const isCanceled = appointment.status === 'canceled';

      // Build summary
      const leadName = appointment.lead
        ? `${appointment.lead.name || 'Lead'}`
        : 'Lead';
      const summary = isCanceled
        ? `[CANCELLED] ${appointment.appointment_type.name} - ${leadName}`
        : `${appointment.appointment_type.name} - ${leadName}`;

      // Build description
      const descriptionParts: string[] = [];
      if (isCanceled && appointment.cancel_reason) {
        descriptionParts.push(`Cancelled: ${appointment.cancel_reason}`);
        descriptionParts.push('');
      }
      if (appointment.lead) {
        if (appointment.lead.phone) {
          descriptionParts.push(`Phone: ${appointment.lead.phone}`);
        }
        // Note: lead model may not have email field based on schema
      }
      if (appointment.notes) {
        descriptionParts.push('');
        descriptionParts.push(`Notes: ${appointment.notes}`);
      }
      const description = descriptionParts.join('\n');

      // Build location
      let location = '';
      if (appointment.location_type === 'phone' && appointment.lead?.phone) {
        location = `Phone: ${appointment.lead.phone}`;
      } else if (appointment.location_value) {
        location = appointment.location_value;
      }

      // Calculate SEQUENCE (increment on updates)
      // Use updatedAt timestamp as sequence base
      const sequence = Math.floor(appointment.updated_at.getTime() / 60000); // Changes every minute of update

      // Create event
      const event = calendar.createEvent({
        id: `${appointment.id}@leadgenx.app`, // Stable UID (use 'id' property)
        start: appointment.start_at,
        end: appointment.end_at,
        summary,
        description,
        location,
        status: isCanceled ? ICalEventStatus.CANCELLED : ICalEventStatus.CONFIRMED,
        sequence,
      });

      // Set DTSTAMP and LAST-MODIFIED
      event.stamp(appointment.updated_at); // DTSTAMP
      event.lastModified(appointment.updated_at); // LAST-MODIFIED
    }

    // Return .ics content
    return calendar.toString();
  }
}
