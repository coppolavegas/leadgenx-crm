import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      // No roles required, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    
    // Check both user.role (session auth) and apiKey.role (API key auth)
    const user = request.user;
    const apiKey = request.apiKey;
    const userRole = user?.role || apiKey?.role;

    if (!userRole) {
      this.logger.warn('RolesGuard: No authenticated user or API key found in request');
      throw new ForbiddenException('Authentication required');
    }

    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      this.logger.warn(
        `RolesGuard: User with role '${userRole}' attempted to access endpoint requiring roles: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        `Access denied. Required role: ${requiredRoles.join(' or ')}. Your role: ${userRole}`,
      );
    }

    return true;
  }
}
