import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SlotInfo {
  startAt: string; // ISO timestamp
  endAt: string; // ISO timestamp
  available: boolean;
}

@Injectable()
export class SlotGenerationService {
  private readonly logger = new Logger(SlotGenerationService.name);
  private googleCalendarApi: any; // Lazy-loaded to avoid circular dependency

  constructor(private prisma: PrismaService) {}

  /**
   * Set Google Calendar API service (injected from module to avoid circular dependency)
   */
  setGoogleCalendarApi(googleCalendarApi: any): void {
    this.googleCalendarApi = googleCalendarApi;
  }

  /**
   * Generate available time slots for booking
   * @param workspaceId - Workspace ID
   * @param fromDate - Start date (YYYY-MM-DD)
   * @param days - Number of days to generate slots for
   * @param appointmentTypeId - Appointment type ID
   * @returns Array of available slots
   */
  async generateSlots(
    workspaceId: string,
    fromDate: string,
    days: number,
    appointmentTypeId: string,
  ): Promise<SlotInfo[]> {
    // 1. Fetch appointment type to get duration + buffer
    const appointmentType = await this.prisma.appointment_type.findFirst({
      where: { id: appointmentTypeId, workspace_id: workspaceId },
    });

    if (!appointmentType || !appointmentType.is_enabled) {
      return [];
    }

    const slotDuration = appointmentType.duration_minutes;
    const bufferMinutes = appointmentType.buffer_minutes;

    // 2. Fetch availability rules for this workspace
    const rules = await this.prisma.availability_rule.findMany({
      where: { workspace_id: workspaceId },
    });

    if (rules.length === 0) {
      return []; // No availability rules = no slots
    }

    // 3. Generate candidate slots from rules
    const candidateSlots: SlotInfo[] = [];
    const startDate = new Date(fromDate);

    for (let dayOffset = 0; dayOffset < days; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      const dayOfWeek = currentDate.getDay(); // 0-6 (Sunday=0)

      // Find rules that match this day of week
      for (const rule of rules) {
        if (!rule.days_of_week.includes(dayOfWeek)) {
          continue;
        }

        // Parse start/end time (HH:MM)
        const [startHour, startMin] = rule.start_time.split(':').map(Number);
        const [endHour, endMin] = rule.end_time.split(':').map(Number);

        // Create start/end timestamps in rule's timezone
        // NOTE: Simplified - production should use luxon or date-fns-tz
        const slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMin, 0, 0);

        const slotEnd = new Date(currentDate);
        slotEnd.setHours(endHour, endMin, 0, 0);

        // Generate slots within this availability window
        let currentSlot = new Date(slotStart);
        while (currentSlot < slotEnd) {
          const slotEndTime = new Date(currentSlot);
          slotEndTime.setMinutes(
            slotEndTime.getMinutes() + slotDuration + bufferMinutes,
          );

          if (slotEndTime <= slotEnd) {
            candidateSlots.push({
              startAt: currentSlot.toISOString(),
              endAt: new Date(
                currentSlot.getTime() + slotDuration * 60000,
              ).toISOString(),
              available: true, // Will check conflicts next
            });
          }

          // Move to next slot
          currentSlot = new Date(slotEndTime);
        }
      }
    }

    // 4. Fetch existing appointments in this date range to filter out conflicts
    if (candidateSlots.length === 0) {
      return [];
    }

    const minStart = new Date(
      Math.min(...candidateSlots.map((s) => new Date(s.startAt).getTime())),
    );
    const maxEnd = new Date(
      Math.max(...candidateSlots.map((s) => new Date(s.endAt).getTime())),
    );

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        workspace_id: workspaceId,
        status: 'scheduled',
        start_at: { gte: minStart, lte: maxEnd },
      },
      select: { start_at: true, end_at: true },
    });

    // 5. Filter out slots that overlap with existing appointments
    let availableSlots = candidateSlots.filter((candidate) => {
      const candidateStart = new Date(candidate.startAt);
      const candidateEnd = new Date(candidate.endAt);

      // Check if this slot overlaps with any existing appointment
      const hasConflict = existingAppointments.some((appt) => {
        const apptStart = new Date(appt.start_at);
        const apptEnd = new Date(appt.end_at);

        // Overlaps if: (candidateStart < apptEnd) && (candidateEnd > apptStart)
        return candidateStart < apptEnd && candidateEnd > apptStart;
      });

      return !hasConflict;
    });

    // 5.5. Filter out slots that overlap with Google Calendar busy times
    if (this.googleCalendarApi) {
      try {
        const busyTimes = await this.googleCalendarApi.getBusyTimes(
          workspaceId,
          minStart,
          maxEnd,
        );

        if (busyTimes.length > 0) {
          availableSlots = availableSlots.filter((candidate) => {
            const candidateStart = new Date(candidate.startAt);
            const candidateEnd = new Date(candidate.endAt);

            // Check if this slot overlaps with any Google Calendar busy time
            const hasBusyConflict = busyTimes.some((busy: { start: Date; end: Date }) => {
              return candidateStart < busy.end && candidateEnd > busy.start;
            });

            return !hasBusyConflict;
          });

          this.logger.log(
            `Filtered out ${busyTimes.length} Google Calendar busy slots for workspace ${workspaceId}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to fetch Google Calendar busy times: ${error.message}. Continuing without Google filtering.`,
        );
        // Continue without Google filtering (graceful degradation)
      }
    }

    // 6. Filter out past slots (don't allow booking in the past)
    const now = new Date();
    const futureSlots = availableSlots.filter(
      (slot) => new Date(slot.startAt) > now,
    );

    return futureSlots;
  }

  /**
   * Check if a specific slot is still available (for race condition prevention)
   */
  async isSlotAvailable(
    workspaceId: string,
    appointmentTypeId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<boolean> {
    const conflictingAppointments = await this.prisma.appointment.count({
      where: {
        workspace_id: workspaceId,
        status: 'scheduled',
        OR: [
          {
            // New appointment starts during an existing appointment
            AND: [
              { start_at: { lte: startAt } },
              { end_at: { gt: startAt } },
            ],
          },
          {
            // New appointment ends during an existing appointment
            AND: [{ start_at: { lt: endAt } }, { end_at: { gte: endAt } }],
          },
          {
            // New appointment completely contains an existing appointment
            AND: [{ start_at: { gte: startAt } }, { end_at: { lte: endAt } }],
          },
        ],
      },
    });

    return conflictingAppointments === 0;
  }
}
