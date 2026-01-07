import { Injectable, ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWorkspaceFeaturesDto } from './dto/update-workspace-features.dto';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly superadminEmail: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.superadminEmail = this.configService.get<string>('SUPERADMIN_EMAIL', '');
    
    if (!this.superadminEmail) {
      this.logger.warn('SUPERADMIN_EMAIL environment variable not set. Superadmin features will be disabled.');
    } else {
      this.logger.log(`Superadmin email configured: ${this.superadminEmail}`);
    }
  }

  /**
   * Check if an email is allowed to have superadmin role
   */
  isSuperadminAllowed(email: string): boolean {
    if (!this.superadminEmail) {
      return false;
    }
    return email.toLowerCase() === this.superadminEmail.toLowerCase();
  }

  /**
   * Validate that a user can grant superadmin role
   * Only existing superadmins can grant superadmin role, and only to allowed emails
   */
  validateSuperadminGrant(requesterRole: string, requesterEmail: string, targetEmail: string): void {
    // Check if requester is superadmin
    if (requesterRole !== 'superadmin') {
      throw new ForbiddenException('Only superadmins can grant superadmin role');
    }

    // Check if target email is in allowlist
    if (!this.isSuperadminAllowed(targetEmail)) {
      throw new ForbiddenException(
        `Email '${targetEmail}' is not in the SUPERADMIN_EMAIL allowlist. Cannot grant superadmin role.`,
      );
    }
  }

  /**
   * Test endpoint - returns success if user has superadmin role
   */
  async ping() {
    return { ok: true, message: 'Superadmin access confirmed' };
  }

  /**
   * List all workspaces (organizations)
   */
  async listWorkspaces(): Promise<WorkspaceResponseDto[]> {
    this.logger.log('Fetching all workspaces');
    
    const organizations = await this.prisma.organization.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return organizations.map(org => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      created_at: org.created_at,
      updated_at: org.updated_at,
      user_count: org._count.users,
      feature_discovery: org.feature_discovery,
      feature_enrichment: org.feature_enrichment,
      feature_verification: org.feature_verification,
      feature_crm: org.feature_crm,
      feature_outreach: org.feature_outreach,
      feature_inbox: org.feature_inbox,
      feature_analytics: org.feature_analytics,
      feature_genie_ai: org.feature_genie_ai,
      feature_x_suite: org.feature_x_suite,
      feature_website_intel: org.feature_website_intel,
    }));
  }

  /**
   * Get workspace details by ID
   */
  async getWorkspace(id: string): Promise<WorkspaceResponseDto> {
    this.logger.log(`Fetching workspace: ${id}`);
    
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!organization) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      plan: organization.plan,
      created_at: organization.created_at,
      updated_at: organization.updated_at,
      user_count: organization._count.users,
      feature_discovery: organization.feature_discovery,
      feature_enrichment: organization.feature_enrichment,
      feature_verification: organization.feature_verification,
      feature_crm: organization.feature_crm,
      feature_outreach: organization.feature_outreach,
      feature_inbox: organization.feature_inbox,
      feature_analytics: organization.feature_analytics,
      feature_genie_ai: organization.feature_genie_ai,
      feature_x_suite: organization.feature_x_suite,
      feature_website_intel: organization.feature_website_intel,
    };
  }

  /**
   * Update workspace feature flags
   */
  async updateWorkspaceFeatures(id: string, dto: UpdateWorkspaceFeaturesDto): Promise<WorkspaceResponseDto> {
    this.logger.log(`Updating workspace features: ${id}`);
    
    // Check if workspace exists
    const existing = await this.prisma.organization.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }

    // Update feature flags
    const updated = await this.prisma.organization.update({
      where: { id },
      data: dto,
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      plan: updated.plan,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
      user_count: updated._count.users,
      feature_discovery: updated.feature_discovery,
      feature_enrichment: updated.feature_enrichment,
      feature_verification: updated.feature_verification,
      feature_crm: updated.feature_crm,
      feature_outreach: updated.feature_outreach,
      feature_inbox: updated.feature_inbox,
      feature_analytics: updated.feature_analytics,
      feature_genie_ai: updated.feature_genie_ai,
      feature_x_suite: updated.feature_x_suite,
      feature_website_intel: updated.feature_website_intel,
    };
  }
}
