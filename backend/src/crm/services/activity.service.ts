import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityDto, ListActivitiesQueryDto } from '../dto/activity.dto';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async createActivity(clientId: string, userId: string, dto: CreateActivityDto) {
    // If lead_id is provided, verify it exists
    if (dto.lead_id) {
      const lead = await this.prisma.lead.findUnique({
        where: { id: dto.lead_id },
      });

      if (!lead) {
        throw new NotFoundException(`Lead ${dto.lead_id} not found`);
      }
    }

    return this.prisma.activity.create({
      data: {
        client_id: clientId,
        lead_id: dto.lead_id,
        type: dto.type,
        content: dto.content,
        meta: dto.meta ?? {},
        created_by_user_id: userId,
      },
      include: {
        created_by: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            name: true,
            website: true,
          },
        },
      },
    });
  }

  async listActivities(clientId: string, query: ListActivitiesQueryDto) {
    const { lead_id, type, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = { client_id: clientId };

    if (lead_id) {
      where.lead_id = lead_id;
    }

    if (type) {
      where.type = type;
    }

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: {
          created_by: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          lead: {
            select: {
              id: true,
              name: true,
              website: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      data: activities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getActivity(clientId: string, activityId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: {
        id: activityId,
        client_id: clientId,
      },
      include: {
        created_by: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            name: true,
            website: true,
            owner: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException(`Activity ${activityId} not found`);
    }

    return activity;
  }

  async deleteActivity(clientId: string, activityId: string) {
    // Verify activity exists and belongs to client
    const activity = await this.prisma.activity.findFirst({
      where: {
        id: activityId,
        client_id: clientId,
      },
    });

    if (!activity) {
      throw new NotFoundException(`Activity ${activityId} not found`);
    }

    await this.prisma.activity.delete({
      where: { id: activityId },
    });

    return { message: 'Activity deleted successfully' };
  }

  // Get activity feed for a lead
  async getLeadActivityFeed(clientId: string, leadId: string, limit = 50) {
    return this.prisma.activity.findMany({
      where: {
        client_id: clientId,
        lead_id: leadId,
      },
      include: {
        created_by: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }
}
