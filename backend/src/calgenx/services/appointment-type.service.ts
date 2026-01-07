import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAppointmentTypeDto,
  UpdateAppointmentTypeDto,
} from '../dto/appointment-type.dto';

@Injectable()
export class AppointmentTypeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new appointment type
   */
  async create(workspaceId: string, dto: CreateAppointmentTypeDto) {
    return this.prisma.appointment_type.create({
      data: {
        workspace_id: workspaceId,
        name: dto.name,
        duration_minutes: dto.durationMinutes,
        buffer_minutes: dto.bufferMinutes ?? 0,
        is_enabled: dto.isEnabled ?? true,
      },
    });
  }

  /**
   * Get all appointment types for a workspace
   */
  async findAll(workspaceId: string) {
    return this.prisma.appointment_type.findMany({
      where: { workspace_id: workspaceId },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Get a single appointment type by ID
   */
  async findOne(workspaceId: string, id: string) {
    const appointmentType = await this.prisma.appointment_type.findFirst({
      where: {
        id,
        workspace_id: workspaceId,
      },
    });

    if (!appointmentType) {
      throw new NotFoundException('Appointment type not found');
    }

    return appointmentType;
  }

  /**
   * Update an appointment type
   */
  async update(
    workspaceId: string,
    id: string,
    dto: UpdateAppointmentTypeDto,
  ) {
    await this.findOne(workspaceId, id); // Ensure exists

    return this.prisma.appointment_type.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.durationMinutes && { duration_minutes: dto.durationMinutes }),
        ...(dto.bufferMinutes !== undefined && {
          buffer_minutes: dto.bufferMinutes,
        }),
        ...(dto.isEnabled !== undefined && { is_enabled: dto.isEnabled }),
      },
    });
  }

  /**
   * Delete an appointment type
   */
  async delete(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id); // Ensure exists

    // Check if there are any appointments using this type
    const appointmentCount = await this.prisma.appointment.count({
      where: {
        appointment_type_id: id,
        status: { in: ['scheduled', 'completed'] },
      },
    });

    if (appointmentCount > 0) {
      throw new BadRequestException(
        `Cannot delete appointment type with ${appointmentCount} existing appointments. Disable it instead.`,
      );
    }

    return this.prisma.appointment_type.delete({ where: { id } });
  }
}
