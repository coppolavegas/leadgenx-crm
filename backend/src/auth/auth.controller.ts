import { Controller, Post, Get, Patch, Body, Param, HttpCode, HttpStatus, Req, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==================== HUMAN AUTH ENDPOINTS ====================

  @Public()
  @Post('register')
  @ApiOperation({ 
    summary: 'Register a new user and organization',
    description: 'Creates a new organization and owner user. Returns a session token for authentication.'
  })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email or organization slug already exists' })
  async register(@Body() dto: RegisterDto, @Req() req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.register(dto, ipAddress, userAgent);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Login with email and password',
    description: 'Authenticates user and returns a session token.'
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Logout current user',
    description: 'Invalidates the current session token.'
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Headers('authorization') authorization: string) {
    const token = authorization?.split(' ')[1];
    return this.authService.logout(token);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get current user',
    description: 'Returns the currently authenticated user\'s information.'
  })
  @ApiResponse({ status: 200, description: 'Current user data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Headers('authorization') authorization: string) {
    const token = authorization?.split(' ')[1];
    return this.authService.getCurrentUser(token);
  }

  // ==================== API KEY MANAGEMENT ENDPOINTS ====================
  // Note: These are kept for programmatic/machine-to-machine access

  @Public()
  @Post('organizations')
  @ApiOperation({ summary: 'Create a new organization (Legacy - use /register instead)' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  @ApiResponse({ status: 409, description: 'Organization slug already exists' })
  async createOrganization(@Body() dto: CreateOrganizationDto) {
    return this.authService.createOrganization(dto);
  }

  @Public()
  @Post('api-keys')
  @ApiOperation({ 
    summary: 'Create a new API key',
    description: 'Generates a new API key for an organization. The key is only shown once at creation.'
  })
  @ApiResponse({ status: 201, description: 'API key created successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async createApiKey(@Body() dto: CreateApiKeyDto) {
    return this.authService.createApiKey(dto);
  }

  @Get('api-keys/:organizationSlug')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all API keys for an organization' })
  @ApiParam({ name: 'organizationSlug', example: 'acme-corp' })
  @ApiResponse({ status: 200, description: 'List of API keys (masked)' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async listApiKeys(@Param('organizationSlug') organizationSlug: string) {
    return this.authService.listApiKeys(organizationSlug);
  }

  @Patch('api-keys/:keyId/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke (deactivate) an API key' })
  @ApiParam({ name: 'keyId', description: 'API key UUID' })
  @ApiResponse({ status: 200, description: 'API key revoked successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async revokeApiKey(@Param('keyId') keyId: string) {
    return this.authService.revokeApiKey(keyId);
  }
}
