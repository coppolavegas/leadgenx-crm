import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'node:crypto';

/**
 * Google OAuth Service
 * Handles OAuth flow, token exchange, storage, and refresh
 */
@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private oauth2Client: OAuth2Client;
  private readonly redirectUri: string;
  private readonly stateTokens = new Map<string, { workspaceId: string; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const appBaseUrl = this.configService.get<string>('APP_BASE_URL', 'http://localhost:3000');
    
    this.redirectUri = `${appBaseUrl}/v1/calgenx/google/callback`;

    if (!clientId || !clientSecret) {
      this.logger.warn('Google OAuth credentials not configured. Google Calendar integration will be unavailable.');
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      this.redirectUri,
    );
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(workspaceId: string): string {
    // Generate CSRF state token
    const state = randomBytes(32).toString('hex');
    this.stateTokens.set(state, {
      workspaceId,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Clean up expired state tokens
    this.cleanupExpiredStateTokens();

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Request refresh token
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      state,
      prompt: 'consent', // Force consent to get refresh token
    });

    this.logger.log(`Generated OAuth URL for workspace ${workspaceId}`);
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    state: string,
  ): Promise<{ workspaceId: string; tokens: any }> {
    // Validate state token
    const stateData = this.stateTokens.get(state);
    if (!stateData) {
      throw new BadRequestException('Invalid or expired state token');
    }

    if (stateData.expiresAt < Date.now()) {
      this.stateTokens.delete(state);
      throw new BadRequestException('State token expired');
    }

    const { workspaceId } = stateData;
    this.stateTokens.delete(state);

    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Missing required tokens');
      }

      // Get user email
      this.oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      const googleUserEmail = userInfo.data.email || null;

      // Calculate token expiry
      const tokenExpiresAt = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000); // Default 1 hour

      // Store in database
      await this.prisma.google_calendar_connection.upsert({
        where: { workspace_id: workspaceId },
        create: {
          id: randomBytes(16).toString('hex'),
          workspace_id: workspaceId,
          google_user_email: googleUserEmail,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokenExpiresAt,
          calendar_id: 'primary',
          is_enabled: true,
          updated_at: new Date(),
        },
        update: {
          google_user_email: googleUserEmail,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokenExpiresAt,
          is_enabled: true,
          updated_at: new Date(),
        },
      });

      this.logger.log(`Successfully connected Google Calendar for workspace ${workspaceId}`);
      return { workspaceId, tokens };
    } catch (error) {
      this.logger.error(`Failed to exchange code for tokens: ${error.message}`, error.stack);
      throw new UnauthorizedException('Failed to connect Google Calendar');
    }
  }

  /**
   * Get OAuth2 client with fresh tokens for a workspace
   */
  async getAuthenticatedClient(workspaceId: string): Promise<OAuth2Client | null> {
    const connection = await this.prisma.google_calendar_connection.findUnique({
      where: { workspace_id: workspaceId },
    });

    if (!connection || !connection.is_enabled) {
      return null;
    }

    // Check if token needs refresh
    const needsRefresh = new Date(connection.token_expires_at) <= new Date(Date.now() + 5 * 60 * 1000); // Refresh 5 min before expiry

    if (needsRefresh) {
      try {
        return await this.refreshAccessToken(workspaceId, connection);
      } catch (error) {
        this.logger.error(`Failed to refresh token for workspace ${workspaceId}: ${error.message}`);
        return null;
      }
    }

    // Use existing tokens
    const client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.redirectUri,
    );

    client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
      expiry_date: connection.token_expires_at.getTime(),
    });

    return client;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(
    workspaceId: string,
    connection: any,
  ): Promise<OAuth2Client> {
    const client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.redirectUri,
    );

    client.setCredentials({
      refresh_token: connection.refresh_token,
    });

    try {
      const { credentials } = await client.refreshAccessToken();
      
      if (!credentials.access_token) {
        throw new Error('No access token in refresh response');
      }

      const tokenExpiresAt = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + 3600 * 1000);

      // Update database
      await this.prisma.google_calendar_connection.update({
        where: { workspace_id: workspaceId },
        data: {
          access_token: credentials.access_token,
          token_expires_at: tokenExpiresAt,
          updated_at: new Date(),
        },
      });

      this.logger.log(`Refreshed access token for workspace ${workspaceId}`);
      return client;
    } catch (error) {
      this.logger.error(`Token refresh failed for workspace ${workspaceId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnect(workspaceId: string): Promise<void> {
    await this.prisma.google_calendar_connection.update({
      where: { workspace_id: workspaceId },
      data: {
        is_enabled: false,
        updated_at: new Date(),
      },
    });

    this.logger.log(`Disconnected Google Calendar for workspace ${workspaceId}`);
  }

  /**
   * Clean up expired state tokens
   */
  private cleanupExpiredStateTokens(): void {
    const now = Date.now();
    for (const [state, data] of this.stateTokens.entries()) {
      if (data.expiresAt < now) {
        this.stateTokens.delete(state);
      }
    }
  }
}
