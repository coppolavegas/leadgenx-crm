import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '../auth.service';

/**
 * Unified authentication guard that supports both:
 * 1. Session-based auth (Bearer token) for human users
 * 2. API key-based auth (X-API-Key header) for machine-to-machine
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  private readonly logger = new Logger(SessionAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Try session-based auth first (Bearer token)
    const bearerToken = this.extractBearerToken(request);
    if (bearerToken) {
      try {
        const session = await this.authService.verifySessionToken(bearerToken);
        if (session && session.user) {
          // Attach user and organization to request
          request.user = session.user;
          request.session = session;
          request.organizationId = session.user.organization_id;
          request.authType = 'session';
          return true;
        }
      } catch (error) {
        // Fall through to API key auth
      }
    }

    // Try API key-based auth (X-API-Key header)
    const apiKey = this.extractApiKey(request);
    if (apiKey) {
      try {
        const apiKeyRecord = await this.authService.verifyApiKey(apiKey);
        if (apiKeyRecord) {
          // Attach organization to request
          request.apiKey = apiKeyRecord;
          request.organizationId = apiKeyRecord.organization_id;
          request.authType = 'api_key';
          return true;
        }
      } catch (error) {
        this.logger.error(`API key authentication failed: ${error.message}`);
        throw new UnauthorizedException('Invalid or expired API key');
      }
    }

    // No valid authentication found
    throw new UnauthorizedException('Authentication required. Provide Bearer token or X-API-Key header.');
  }

  private extractBearerToken(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private extractApiKey(request: any): string | undefined {
    return request.headers['x-api-key'];
  }
}
