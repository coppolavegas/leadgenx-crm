import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetInboxQueryDto, CreateInboxItemDto } from './dto/inbox.dto';

@Injectable()
export class InboxService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get unified inbox feed for a client
   */
  async getInboxFeed(clientId: string, query: GetInboxQueryDto) {
    const { type, leadId, read, starred, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = { client_id: clientId };

    if (type) where.type = type;
    if (leadId) where.lead_id = leadId;
    if (typeof read === 'boolean') where.read = read;
    if (typeof starred === 'boolean') where.starred = starred;

    const [items, total] = await Promise.all([
      this.prisma.inbox_item.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          activity: true,
          task: true,
          message: true,
        },
      }),
      this.prisma.inbox_item.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create inbox item (used internally by other services)
   */
  async createInboxItem(clientId: string, data: CreateInboxItemDto) {
    return this.prisma.inbox_item.create({
      data: {
        client_id: clientId,
        lead_id: data.leadId,
        user_id: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        metadata: data.metadata,
        activity_id: data.activityId,
        task_id: data.taskId,
        message_id: data.messageId,
      },
    });
  }

  /**
   * Mark inbox item as read/unread
   */
  async markAsRead(clientId: string, itemId: string, read: boolean) {
    // Verify item belongs to client
    const item = await this.prisma.inbox_item.findFirst({
      where: { id: itemId, client_id: clientId },
    });

    if (!item) {
      throw new NotFoundException('Inbox item not found');
    }

    return this.prisma.inbox_item.update({
      where: { id: itemId },
      data: { read },
    });
  }

  /**
   * Star/unstar inbox item
   */
  async toggleStar(clientId: string, itemId: string, starred: boolean) {
    // Verify item belongs to client
    const item = await this.prisma.inbox_item.findFirst({
      where: { id: itemId, client_id: clientId },
    });

    if (!item) {
      throw new NotFoundException('Inbox item not found');
    }

    return this.prisma.inbox_item.update({
      where: { id: itemId },
      data: { starred },
    });
  }

  /**
   * Mark all as read for a client
   */
  async markAllAsRead(clientId: string) {
    return this.prisma.inbox_item.updateMany({
      where: { client_id: clientId, read: false },
      data: { read: true },
    });
  }

  /**
   * Get unread count
   */
  async getUnreadCount(clientId: string) {
    return this.prisma.inbox_item.count({
      where: { client_id: clientId, read: false },
    });
  }

  /**
   * Delete inbox item
   */
  async deleteInboxItem(clientId: string, itemId: string) {
    // Verify item belongs to client
    const item = await this.prisma.inbox_item.findFirst({
      where: { id: itemId, client_id: clientId },
    });

    if (!item) {
      throw new NotFoundException('Inbox item not found');
    }

    await this.prisma.inbox_item.delete({
      where: { id: itemId },
    });

    return { success: true };
  }
}
