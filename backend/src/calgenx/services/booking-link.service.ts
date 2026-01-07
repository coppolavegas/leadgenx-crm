import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateBookingLinkDto,
  UpdateBookingLinkDto,
} from '../dto/booking-link.dto';

@Injectable()
export class BookingLinkService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate slug format (alphanumeric + hyphens only)
   */
  private validateSlug(slug: string): void {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      throw new BadRequestException(
        'Invalid slug format. Use lowercase letters, numbers, and hyphens only (e.g., my-booking-link)',
      );
    }
  }

  /**
   * Create a new booking link
   */
  async create(workspaceId: string, dto: CreateBookingLinkDto) {
    this.validateSlug(dto.slug);

    // Check if slug is already taken
    const existing = await this.prisma.booking_link.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new BadRequestException(
        `Booking link slug "${dto.slug}" is already taken`,
      );
    }

    // If appointmentTypeId provided, verify it exists and belongs to workspace
    if (dto.appointmentTypeId) {
      const appointmentType = await this.prisma.appointment_type.findFirst({
        where: {
          id: dto.appointmentTypeId,
          workspace_id: workspaceId,
        },
      });

      if (!appointmentType) {
        throw new BadRequestException(
          'Appointment type not found or does not belong to this workspace',
        );
      }
    }

    return this.prisma.booking_link.create({
      data: {
        workspace_id: workspaceId,
        slug: dto.slug,
        appointment_type_id: dto.appointmentTypeId,
        is_enabled: dto.isEnabled ?? true,
      },
    });
  }

  /**
   * Get all booking links for a workspace
   */
  async findAll(workspaceId: string) {
    return this.prisma.booking_link.findMany({
      where: { workspace_id: workspaceId },
      include: { appointment_type: true },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Get a single booking link by ID
   */
  async findOne(workspaceId: string, id: string) {
    const bookingLink = await this.prisma.booking_link.findFirst({
      where: {
        id,
        workspace_id: workspaceId,
      },
      include: { appointment_type: true },
    });

    if (!bookingLink) {
      throw new NotFoundException('Booking link not found');
    }

    return bookingLink;
  }

  /**
   * Get booking link by slug (for public access)
   */
  async findBySlug(slug: string) {
    const bookingLink = await this.prisma.booking_link.findUnique({
      where: { slug },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            calgenx_enabled: true,
          },
        },
        appointment_type: true,
      },
    });

    if (!bookingLink) {
      throw new NotFoundException('Booking link not found');
    }

    if (!bookingLink.is_enabled) {
      throw new BadRequestException('This booking link is currently disabled');
    }

    if (!bookingLink.workspace.calgenx_enabled) {
      throw new BadRequestException(
        'Appointment scheduling is not enabled for this organization',
      );
    }

    return bookingLink;
  }

  /**
   * Update a booking link
   */
  async update(workspaceId: string, id: string, dto: UpdateBookingLinkDto) {
    await this.findOne(workspaceId, id); // Ensure exists

    if (dto.slug) {
      this.validateSlug(dto.slug);

      // Check if new slug is already taken by another booking link
      const existing = await this.prisma.booking_link.findUnique({
        where: { slug: dto.slug },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Booking link slug "${dto.slug}" is already taken`,
        );
      }
    }

    // If appointmentTypeId provided, verify it exists and belongs to workspace
    if (dto.appointmentTypeId) {
      const appointmentType = await this.prisma.appointment_type.findFirst({
        where: {
          id: dto.appointmentTypeId,
          workspace_id: workspaceId,
        },
      });

      if (!appointmentType) {
        throw new BadRequestException(
          'Appointment type not found or does not belong to this workspace',
        );
      }
    }

    return this.prisma.booking_link.update({
      where: { id },
      data: {
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.appointmentTypeId !== undefined && {
          appointment_type_id: dto.appointmentTypeId,
        }),
        ...(dto.isEnabled !== undefined && { is_enabled: dto.isEnabled }),
      },
      include: { appointment_type: true },
    });
  }

  /**
   * Delete a booking link
   */
  async delete(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id); // Ensure exists
    return this.prisma.booking_link.delete({ where: { id } });
  }
}
