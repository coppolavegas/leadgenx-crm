import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, ListTasksQueryDto } from '../dto/task.dto';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async createTask(clientId: string, dto: CreateTaskDto) {
    // Verify lead exists if provided
    if (dto.lead_id) {
      const lead = await this.prisma.lead.findUnique({
        where: { id: dto.lead_id },
      });

      if (!lead) {
        throw new NotFoundException(`Lead ${dto.lead_id} not found`);
      }
    }

    // Verify assigned user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.assigned_to_user_id },
    });

    if (!user) {
      throw new NotFoundException(`User ${dto.assigned_to_user_id} not found`);
    }

    return this.prisma.task.create({
      data: {
        client_id: clientId,
        lead_id: dto.lead_id,
        assigned_to_user_id: dto.assigned_to_user_id,
        title: dto.title,
        description: dto.description,
        due_at: dto.due_at ? new Date(dto.due_at) : null,
        type: dto.type ?? 'general',
        priority: dto.priority ?? 'medium',
        status: 'pending',
      },
      include: {
        assigned_to: {
          select: {
            id: true,
            full_name: true,
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

  async listTasks(clientId: string, query: ListTasksQueryDto) {
    const { lead_id, status, assigned_to_user_id, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = { client_id: clientId };

    if (lead_id) {
      where.lead_id = lead_id;
    }

    if (status) {
      where.status = status;
    }

    if (assigned_to_user_id) {
      where.assigned_to_user_id = assigned_to_user_id;
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          assigned_to: {
            select: {
              id: true,
              full_name: true,
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
        orderBy: [
          { status: 'asc' }, // pending first
          { due_at: 'asc' },  // earliest due first
        ],
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTask(clientId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        client_id: clientId,
      },
      include: {
        assigned_to: {
          select: {
            id: true,
            full_name: true,
          },
        },
        lead: {
          select: {
            id: true,
            name: true,
            website: true,
            phone: true,
            owner: {
              select: {
                id: true,
                full_name: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    return task;
  }

  async updateTask(clientId: string, taskId: string, dto: UpdateTaskDto) {
    // Verify task exists and belongs to client
    const existing = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        client_id: clientId,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    // If status is changing to completed, set completed_at
    const data: any = {
      title: dto.title,
      description: dto.description,
      due_at: dto.due_at ? new Date(dto.due_at) : undefined,
      type: dto.type,
      status: dto.status,
      priority: dto.priority,
      assigned_to_user_id: dto.assigned_to_user_id,
    };

    if (dto.status === 'completed' && existing.status !== 'completed') {
      data.completed_at = new Date();
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        assigned_to: {
          select: {
            id: true,
            full_name: true,
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

  async deleteTask(clientId: string, taskId: string) {
    // Verify task exists and belongs to client
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        client_id: clientId,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    return { message: 'Task deleted successfully' };
  }

  // Get tasks due soon for a client
  async getTasksDueSoon(clientId: string, days = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.task.findMany({
      where: {
        client_id: clientId,
        status: { in: ['pending', 'in_progress'] },
        due_at: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        assigned_to: {
          select: {
            id: true,
            full_name: true,
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
      orderBy: { due_at: 'asc' },
    });
  }

  // Get overdue tasks for a client
  async getOverdueTasks(clientId: string) {
    return this.prisma.task.findMany({
      where: {
        client_id: clientId,
        status: { in: ['pending', 'in_progress'] },
        due_at: {
          lt: new Date(),
        },
      },
      include: {
        assigned_to: {
          select: {
            id: true,
            full_name: true,
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
      orderBy: { due_at: 'asc' },
    });
  }
}
