import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      this.logger.warn('Missing API key in request');
      throw new UnauthorizedException('API key is required. Provide it in X-API-Key header.');
    }

    try {
      // Verify API key using bcrypt hash comparison
      const apiKeyRecord = await this.authService.verifyApiKey(apiKey);

      if (!apiKeyRecord) {
        this.logger.warn(`Invalid API key attempted: ${apiKey.substring(0, 12)}...`);
        throw new UnauthorizedException('Invalid API key');
      }

      if (!apiKeyRecord.is_active) {
        this.logger.warn(`Inactive API key attempted: ${apiKey.substring(0, 12)}...`);
        throw new UnauthorizedException('API key is inactive');
      }

      // Update last used timestamp (async, don't wait)
      this.prisma.api_key.update({
        where: { id: apiKeyRecord.id },
        data: { last_used_at: new Date() },
      }).catch(err => this.logger.error('Failed to update last_used_at', err));

      // Attach org and key info to request
      (request as any)['apiKey'] = apiKeyRecord;
      (request as any)['organization'] = apiKeyRecord.organization;
      (request as any)['organizationId'] = apiKeyRecord.organization_id;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Error validating API key', error);
      throw new UnauthorizedException('API key validation failed');
    }
  }

  private extractApiKey(request: Request): string | undefined {
    // Support multiple header formats
    const apiKey = 
      request.headers['x-api-key'] as string ||
      request.headers['authorization']?.replace(/^Bearer /i, '') ||
      (request.query.apiKey as string);
    
    return apiKey;
  }
}
