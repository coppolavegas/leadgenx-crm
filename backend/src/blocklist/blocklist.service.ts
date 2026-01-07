import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddDomainDto } from './dto/add-domain.dto';

@Injectable()
export class BlocklistService {
  private readonly logger = new Logger(BlocklistService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add a domain to the blocklist
   */
  async addDomain(organizationId: string, dto: AddDomainDto) {
    // Normalize domain (remove protocol, www, trailing slash)
    const normalizedDomain = this.normalizeDomain(dto.domain);

    // Check if already blocked
    const existing = await this.prisma.blocklist.findFirst({
      where: {
        organization_id: organizationId,
        domain: normalizedDomain,
      },
    });

    if (existing) {
      throw new ConflictException(`Domain '${normalizedDomain}' is already blocklisted`);
    }

    const entry = await this.prisma.blocklist.create({
      data: {
        organization_id: organizationId,
        domain: normalizedDomain,
        reason: dto.reason,
      },
    });

    this.logger.log(`Added domain '${normalizedDomain}' to blocklist for org ${organizationId}`);
    return entry;
  }

  /**
   * Remove a domain from the blocklist
   */
  async removeDomain(organizationId: string, blocklistId: string) {
    const entry = await this.prisma.blocklist.findFirst({
      where: {
        id: blocklistId,
        organization_id: organizationId,
      },
    });

    if (!entry) {
      throw new NotFoundException('Blocklist entry not found');
    }

    await this.prisma.blocklist.delete({
      where: { id: blocklistId },
    });

    this.logger.log(`Removed domain '${entry.domain}' from blocklist for org ${organizationId}`);
    return { message: 'Domain removed from blocklist' };
  }

  /**
   * List all blocked domains for an organization
   */
  async listDomains(organizationId: string) {
    return this.prisma.blocklist.findMany({
      where: { organization_id: organizationId },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Check if a domain is blocklisted
   */
  async isDomainBlocked(organizationId: string, domain: string): Promise<boolean> {
    const normalizedDomain = this.normalizeDomain(domain);
    
    const entry = await this.prisma.blocklist.findFirst({
      where: {
        organization_id: organizationId,
        domain: normalizedDomain,
      },
    });

    return !!entry;
  }

  /**
   * Normalize domain for consistent comparison
   */
  private normalizeDomain(domain: string): string {
    return domain
      .toLowerCase()
      .replace(/^https?:\/\//, '') // Remove protocol
      .replace(/^www\./, '') // Remove www
      .replace(/\/$/, '') // Remove trailing slash
      .trim();
  }
}
