import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAvailabilityRuleDto,
  UpdateAvailabilityRuleDto,
} from '../dto/availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate timezone (basic IANA format check)
   */
  private validateTimezone(timezone: string): void {
    // Basic validation: check if timezone looks like IANA format
    const timezoneRegex = /^[A-Za-z]+\/[A-Za-z_]+$/;
    if (!timezoneRegex.test(timezone)) {
      throw new BadRequestException(
        'Invalid timezone format. Use IANA timezone (e.g., America/Los_Angeles)',
      );
    }
  }

  /**
   * Validate time format (HH:MM)
   */
  private validateTimeFormat(time: string): void {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      throw new BadRequestException(
        'Invalid time format. Use HH:MM (e.g., 09:00, 17:30)',
      );
    }
  }

  /**
   * Create a new availability rule
   */
  async create(workspaceId: string, dto: CreateAvailabilityRuleDto) {
    this.validateTimezone(dto.timezone);
    this.validateTimeFormat(dto.startTime);
    this.validateTimeFormat(dto.endTime);

    // Ensure daysOfWeek are unique and sorted
    const uniqueDays = [...new Set(dto.daysOfWeek)].sort();

    return this.prisma.availability_rule.create({
      data: {
        workspace_id: workspaceId,
        timezone: dto.timezone,
        days_of_week: uniqueDays,
        start_time: dto.startTime,
        end_time: dto.endTime,
      },
    });
  }

  /**
   * Get all availability rules for a workspace
   */
  async findAll(workspaceId: string) {
    return this.prisma.availability_rule.findMany({
      where: { workspace_id: workspaceId },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Get a single availability rule by ID
   */
  async findOne(workspaceId: string, id: string) {
    const rule = await this.prisma.availability_rule.findFirst({
      where: {
        id,
        workspace_id: workspaceId,
      },
    });

    if (!rule) {
      throw new NotFoundException('Availability rule not found');
    }

    return rule;
  }

  /**
   * Update an availability rule
   */
  async update(
    workspaceId: string,
    id: string,
    dto: UpdateAvailabilityRuleDto,
  ) {
    await this.findOne(workspaceId, id); // Ensure exists

    if (dto.timezone) {
      this.validateTimezone(dto.timezone);
    }
    if (dto.startTime) {
      this.validateTimeFormat(dto.startTime);
    }
    if (dto.endTime) {
      this.validateTimeFormat(dto.endTime);
    }

    return this.prisma.availability_rule.update({
      where: { id },
      data: {
        ...(dto.timezone && { timezone: dto.timezone }),
        ...(dto.daysOfWeek && {
          days_of_week: [...new Set(dto.daysOfWeek)].sort(),
        }),
        ...(dto.startTime && { start_time: dto.startTime }),
        ...(dto.endTime && { end_time: dto.endTime }),
      },
    });
  }

  /**
   * Delete an availability rule
   */
  async delete(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id); // Ensure exists
    return this.prisma.availability_rule.delete({ where: { id } });
  }
}
