import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { UpdateIcalFeedDto } from '../dto/ical-feed.dto';

/**
 * IcalFeedService
 * 
 * Manages iCalendar subscription feed tokens for workspaces.
 * - Creates feeds with cryptographically secure tokens
 * - Enables/disables feeds
 * - Rotates tokens for security
 */
@Injectable()
export class IcalFeedService {
  private readonly logger = new Logger(IcalFeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a cryptographically secure random token
   */
  private generateToken(): string {
    // 32 bytes = 64 hex chars (very secure)
    return randomBytes(32).toString('hex');
  }

  /**
   * Get or create iCal feed for workspace
   */
  async getOrCreateFeed(workspaceId: string) {
    // Check if feed already exists
    let feed = await this.prisma.calgenx_ical_feed.findFirst({
      where: { workspace_id: workspaceId },
    });

    if (!feed) {
      // Create new feed with secure token
      const token = this.generateToken();
      feed = await this.prisma.calgenx_ical_feed.create({
        data: {
          workspace_id: workspaceId,
          token,
          is_enabled: true,
        },
      });
      this.logger.log(`Created iCal feed for workspace ${workspaceId}`);
    }

    return feed;
  }

  /**
   * Get feed by workspace ID
   */
  async getFeedByWorkspace(workspaceId: string) {
    const feed = await this.prisma.calgenx_ical_feed.findFirst({
      where: { workspace_id: workspaceId },
    });

    if (!feed) {
      throw new NotFoundException('iCal feed not found for this workspace');
    }

    return feed;
  }

  /**
   * Get feed by token (public access)
   */
  async getFeedByToken(token: string) {
    const feed = await this.prisma.calgenx_ical_feed.findUnique({
      where: { token },
    });

    if (!feed) {
      throw new NotFoundException('iCal feed not found');
    }

    if (!feed.is_enabled) {
      throw new NotFoundException('iCal feed is disabled');
    }

    return feed;
  }

  /**
   * Update feed settings
   */
  async updateFeed(
    workspaceId: string,
    updateDto: UpdateIcalFeedDto,
  ) {
    const feed = await this.getFeedByWorkspace(workspaceId);

    const updated = await this.prisma.calgenx_ical_feed.update({
      where: { id: feed.id },
      data: {
        is_enabled: updateDto.isEnabled ?? feed.is_enabled,
        name: updateDto.name !== undefined ? updateDto.name : feed.name,
        updated_at: new Date(),
      },
    });

    this.logger.log(`Updated iCal feed ${feed.id} for workspace ${workspaceId}`);
    return updated;
  }

  /**
   * Rotate feed token (security measure)
   */
  async rotateFeedToken(workspaceId: string) {
    const feed = await this.getFeedByWorkspace(workspaceId);

    const newToken = this.generateToken();
    const updated = await this.prisma.calgenx_ical_feed.update({
      where: { id: feed.id },
      data: {
        token: newToken,
        last_rotated_at: new Date(),
        updated_at: new Date(),
      },
    });

    this.logger.log(`Rotated token for iCal feed ${feed.id} (workspace ${workspaceId})`);
    return updated;
  }
}
