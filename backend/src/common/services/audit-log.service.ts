import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogEntry {
  organizationId: string;
  apiKeyId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failed';
  errorMessage?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log an audit entry
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.audit_log.create({
        data: {
          organization_id: entry.organizationId,
          api_key_id: entry.apiKeyId,
          action: entry.action,
          resource_type: entry.resourceType,
          resource_id: entry.resourceId,
          metadata: entry.metadata as any,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent,
          status: entry.status,
          error_message: entry.errorMessage,
        },
      });

      this.logger.log(
        `Audit: ${entry.action} on ${entry.resourceType} by org ${entry.organizationId} - ${entry.status}`,
      );
    } catch (error) {
      // Don't fail requests if audit logging fails
      this.logger.error('Failed to create audit log', error);
    }
  }

  /**
   * Get audit logs for an organization
   */
  async getLogsForOrganization(organizationId: string, limit = 100) {
    return this.prisma.audit_log.findMany({
      where: { organization_id: organizationId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  /**
   * Get audit logs for a specific action
   */
  async getLogsByAction(organizationId: string, action: string, limit = 100) {
    return this.prisma.audit_log.findMany({
      where: {
        organization_id: organizationId,
        action,
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }
}
