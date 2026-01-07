import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * CalGenX Feature Guard
 * Ensures the workspace has CalGenX enabled before allowing access
 */
@Injectable()
export class CalGenXFeatureGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const workspaceId =
      request.params.workspaceId || request.body?.workspaceId;

    if (!workspaceId) {
      throw new ForbiddenException('Workspace ID required');
    }

    const workspace = await this.prisma.organization.findUnique({
      where: { id: workspaceId },
      select: { calgenx_enabled: true },
    });

    if (!workspace) {
      throw new ForbiddenException('Workspace not found');
    }

    if (!workspace.calgenx_enabled) {
      throw new ForbiddenException(
        'CalGenX is not enabled for this workspace. Contact your admin to enable appointment scheduling.',
      );
    }

    return true;
  }
}
