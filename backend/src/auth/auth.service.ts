import { Injectable, ConflictException, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 12; // bcrypt salt rounds for security
  private readonly SESSION_EXPIRY_DAYS = 30; // Session expires in 30 days

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new organization
   */
  async createOrganization(dto: CreateOrganizationDto) {
    // Check if slug already exists
    const existing = await this.prisma.organization.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`Organization with slug '${dto.slug}' already exists`);
    }

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
      },
    });

    this.logger.log(`Created organization: ${org.name} (${org.slug})`);
    return org;
  }

  /**
   * Create a new API key for an organization
   */
  async createApiKey(dto: CreateApiKeyDto) {
    // Find organization
    const org = await this.prisma.organization.findUnique({
      where: { slug: dto.organizationSlug },
    });

    if (!org) {
      throw new NotFoundException(`Organization '${dto.organizationSlug}' not found`);
    }

    // Generate secure API key
    const apiKey = this.generateApiKey();
    const keyPrefix = apiKey.substring(0, 12); // lgx_abc123...
    
    // Hash the API key for secure storage
    const keyHash = await bcrypt.hash(apiKey, this.SALT_ROUNDS);

    const apiKeyRecord = await this.prisma.api_key.create({
      data: {
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name: dto.name,
        organization_id: org.id,
        expires_at: dto.expiresAt ? new Date(dto.expiresAt) : null,
        rate_limit_rpm: dto.rateLimitRpm || 100,
        rate_limit_daily_jobs: dto.rateLimitDailyJobs || 1000,
        role: dto.role || 'user',
      },
      include: { organization: true },
    });

    this.logger.log(`Created API key '${dto.name}' for org '${org.slug}' with role '${apiKeyRecord.role}'`);
    
    return {
      id: apiKeyRecord.id,
      key: apiKey, // Only returned once at creation - SAVE THIS!
      name: apiKeyRecord.name,
      organization: apiKeyRecord.organization.name,
      organizationSlug: apiKeyRecord.organization.slug,
      isActive: apiKeyRecord.is_active,
      expiresAt: apiKeyRecord.expires_at,
      rateLimitRpm: apiKeyRecord.rate_limit_rpm,
      rateLimitDailyJobs: apiKeyRecord.rate_limit_daily_jobs,
      role: apiKeyRecord.role,
      createdAt: apiKeyRecord.created_at,
    };
  }

  /**
   * Verify an API key against its hash
   */
  async verifyApiKey(plainKey: string): Promise<any> {
    const keyPrefix = plainKey.substring(0, 12);
    
    // Find all keys with matching prefix (should be very few)
    const candidates = await this.prisma.api_key.findMany({
      where: {
        key_prefix: keyPrefix,
        is_active: true,
      },
      include: { organization: true },
    });

    // Check hash for each candidate
    for (const candidate of candidates) {
      const isValid = await bcrypt.compare(plainKey, candidate.key_hash);
      if (isValid) {
        // Check expiration
        if (candidate.expires_at && new Date() > candidate.expires_at) {
          throw new NotFoundException('API key has expired');
        }
        return candidate;
      }
    }

    return null;
  }

  /**
   * List all API keys for an organization
   */
  async listApiKeys(organizationSlug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug: organizationSlug },
      include: {
        api_keys: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization '${organizationSlug}' not found`);
    }

    return org.api_keys.map(key => ({
      id: key.id,
      keyPrefix: `${key.key_prefix}...`, // Show first 12 chars
      name: key.name,
      isActive: key.is_active,
      lastUsedAt: key.last_used_at,
      expiresAt: key.expires_at,
      rateLimitRpm: key.rate_limit_rpm,
      rateLimitDailyJobs: key.rate_limit_daily_jobs,
      role: key.role,
      createdAt: key.created_at,
    }));
  }

  /**
   * Revoke (deactivate) an API key
   */
  async revokeApiKey(keyId: string) {
    const apiKey = await this.prisma.api_key.findUnique({
      where: { id: keyId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.api_key.update({
      where: { id: keyId },
      data: { is_active: false },
    });

    this.logger.log(`Revoked API key: ${keyId}`);
    return { message: 'API key revoked successfully' };
  }

  /**
   * Generate a secure random API key
   */
  private generateApiKey(): string {
    const prefix = 'lgx'; // leadgenx prefix
    const randomPart = crypto.randomBytes(32).toString('base64url'); // Increased from 24 to 32 bytes
    return `${prefix}_${randomPart}`;
  }

  // ==================== HUMAN AUTH METHODS ====================

  /**
   * Register a new user and organization
   * Creates an organization + owner user in a transaction
   */
  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Generate organization slug from company name
    const slug = this.generateSlug(dto.company_name);

    // Check if slug already exists
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      // If slug exists, append random suffix
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const newSlug = `${slug}-${randomSuffix}`;
      this.logger.warn(`Slug '${slug}' exists, using '${newSlug}' instead`);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    // Create organization + owner user in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: dto.company_name,
          slug: existingOrg ? `${slug}-${Math.random().toString(36).substring(2, 6)}` : slug,
          plan: 'free',
        },
      });

      // Create owner user
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          password_hash: passwordHash,
          role: 'owner',
          organization_id: organization.id,
        },
        include: {
          organization: true,
        },
      });

      // Create session
      const sessionToken = this.generateSessionToken();
      const tokenHash = await bcrypt.hash(sessionToken, this.SALT_ROUNDS);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.SESSION_EXPIRY_DAYS);

      const session = await tx.session.create({
        data: {
          user_id: user.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
      });

      return { user, organization, sessionToken, session };
    });

    this.logger.log(`User registered: ${result.user.email} (Org: ${result.organization.slug})`);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          slug: result.organization.slug,
          plan: result.organization.plan,
        },
      },
      token: result.sessionToken,
      expiresAt: result.session.expires_at,
    };
  }

  /**
   * Login user with email and password
   */
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        organization: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Create new session
    const sessionToken = this.generateSessionToken();
    const tokenHash = await bcrypt.hash(sessionToken, this.SALT_ROUNDS);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.SESSION_EXPIRY_DAYS);

    const session = await this.prisma.session.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
          plan: user.organization.plan,
        },
      },
      token: sessionToken,
      expiresAt: session.expires_at,
    };
  }

  /**
   * Logout user by invalidating session
   */
  async logout(token: string) {
    // Find session by token
    const session = await this.findSessionByToken(token);
    
    if (!session) {
      return { message: 'Session already invalidated' };
    }

    // Delete session
    await this.prisma.session.delete({
      where: { id: session.id },
    });

    this.logger.log(`User logged out: session ${session.id}`);

    return { message: 'Logged out successfully' };
  }

  /**
   * Get current user by session token
   */
  async getCurrentUser(token: string) {
    const session = await this.verifySessionToken(token);
    
    if (!session || !session.user) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      organization: {
        id: session.user.organization.id,
        name: session.user.organization.name,
        slug: session.user.organization.slug,
        plan: session.user.organization.plan,
      },
    };
  }

  /**
   * Verify session token and return session with user data
   */
  async verifySessionToken(plainToken: string) {
    // Find all non-expired sessions
    const candidates = await this.prisma.session.findMany({
      where: {
        expires_at: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          include: {
            organization: true,
          },
        },
      },
    });

    // Check hash for each candidate
    for (const candidate of candidates) {
      const isValid = await bcrypt.compare(plainToken, candidate.token_hash);
      if (isValid) {
        // Update last used timestamp
        await this.prisma.session.update({
          where: { id: candidate.id },
          data: { last_used_at: new Date() },
        });

        return candidate;
      }
    }

    return null;
  }

  /**
   * Find session by token (helper method)
   */
  private async findSessionByToken(plainToken: string) {
    const candidates = await this.prisma.session.findMany({
      include: {
        user: true,
      },
    });

    for (const candidate of candidates) {
      const isValid = await bcrypt.compare(plainToken, candidate.token_hash);
      if (isValid) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Generate a secure random session token
   */
  private generateSessionToken(): string {
    return crypto.randomBytes(48).toString('base64url');
  }

  /**
   * Generate a URL-friendly slug from organization name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .slice(0, 50); // Max 50 chars
  }
}
