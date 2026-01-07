import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { EventSigningService } from './services/event-signing.service';
import { EventPublishingService } from './services/event-publishing.service';
import { PublishEventDto } from './dto/publish-event.dto';
import { RegisterWebhookDto } from './dto/register-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@ApiTags('X-Suite Integration')
@Controller('integration')
export class IntegrationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventSigning: EventSigningService,
    private readonly eventPublishing: EventPublishingService,
  ) {}

  // ==================== EVENT PUBLISHING ====================

  @Post('events/publish')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Publish an event to registered webhooks',
    description: 'Publishes an X-Suite event to all registered webhooks for the given organization. Events are signed with HMAC-SHA256.',
  })
  @ApiResponse({ status: 200, description: 'Event published successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async publishEvent(
    @Body() dto: PublishEventDto,
    @Headers('x-organization-id') organizationId: string,
  ) {
    const result = await this.eventPublishing.publishEvent(
      dto.event_name,
      organizationId,
      dto.payload,
      dto.client_id,
      dto.target_product,
    );

    return {
      success: true,
      event_id: result.event_id,
      webhooks_triggered: result.webhooks_triggered,
      message: `Event '${dto.event_name}' published to ${result.webhooks_triggered} webhook(s)`,
    };
  }

  @Get('events/:event_id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get event details by ID' })
  @ApiParam({ name: 'event_id', example: 'evt_abc123' })
  @ApiResponse({ status: 200, description: 'Event details' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEvent(@Param('event_id') eventId: string) {
    const event = await this.prisma.x_suite_event_log.findUnique({
      where: { event_id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event '${eventId}' not found`);
    }

    return event;
  }

  @Get('events')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List events for organization' })
  @ApiQuery({ name: 'limit', required: false, example: 50, description: 'Max events to return' })
  @ApiQuery({ name: 'offset', required: false, example: 0, description: 'Pagination offset' })
  @ApiQuery({ name: 'event_name', required: false, example: 'lead.created', description: 'Filter by event name' })
  @ApiQuery({ name: 'status', required: false, example: 'delivered', description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'List of events' })
  async listEvents(
    @Headers('x-organization-id') organizationId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('event_name') eventName?: string,
    @Query('status') status?: string,
  ) {
    const where: any = {
      organization_id: organizationId,
    };

    if (eventName) {
      where.event_name = eventName;
    }

    if (status) {
      where.status = status;
    }

    const [events, total] = await Promise.all([
      this.prisma.x_suite_event_log.findMany({
        where,
        take: limit || 50,
        skip: offset || 0,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.x_suite_event_log.count({ where }),
    ]);

    return {
      events,
      total,
      limit: limit || 50,
      offset: offset || 0,
    };
  }

  // ==================== WEBHOOK MANAGEMENT ====================

  @Post('webhooks')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Register a webhook',
    description: 'Registers a webhook to receive events from LeadGenX.',
  })
  @ApiResponse({ status: 201, description: 'Webhook registered successfully' })
  async registerWebhook(
    @Body() dto: RegisterWebhookDto,
    @Headers('x-organization-id') organizationId: string,
  ) {
    const webhook = await this.prisma.x_suite_webhook.create({
      data: {
        organization_id: organizationId,
        source_product: 'leadgenx',
        target_product: dto.target_product,
        url: dto.url,
        events: dto.events,
        secret: dto.secret,
      },
    });

    return {
      success: true,
      webhook: {
        id: webhook.id,
        target_product: webhook.target_product,
        url: webhook.url,
        events: webhook.events,
        is_active: webhook.is_active,
        created_at: webhook.created_at,
      },
    };
  }

  @Get('webhooks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all webhooks for organization' })
  @ApiResponse({ status: 200, description: 'List of webhooks' })
  async listWebhooks(@Headers('x-organization-id') organizationId: string) {
    const webhooks = await this.prisma.x_suite_webhook.findMany({
      where: { organization_id: organizationId },
      orderBy: { created_at: 'desc' },
    });

    return {
      webhooks: webhooks.map((wh) => ({
        id: wh.id,
        target_product: wh.target_product,
        url: wh.url,
        events: wh.events,
        is_active: wh.is_active,
        last_triggered_at: wh.last_triggered_at,
        last_success_at: wh.last_success_at,
        failure_count: wh.failure_count,
        last_error: wh.last_error,
        created_at: wh.created_at,
      })),
      total: webhooks.length,
    };
  }

  @Get('webhooks/:webhook_id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get webhook details' })
  @ApiParam({ name: 'webhook_id', example: 'webhook-uuid' })
  @ApiResponse({ status: 200, description: 'Webhook details' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async getWebhook(
    @Param('webhook_id') webhookId: string,
    @Headers('x-organization-id') organizationId: string,
  ) {
    const webhook = await this.prisma.x_suite_webhook.findFirst({
      where: {
        id: webhookId,
        organization_id: organizationId,
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return webhook;
  }

  @Patch('webhooks/:webhook_id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update webhook configuration' })
  @ApiParam({ name: 'webhook_id', example: 'webhook-uuid' })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async updateWebhook(
    @Param('webhook_id') webhookId: string,
    @Body() dto: UpdateWebhookDto,
    @Headers('x-organization-id') organizationId: string,
  ) {
    // Check if webhook exists and belongs to organization
    const existing = await this.prisma.x_suite_webhook.findFirst({
      where: {
        id: webhookId,
        organization_id: organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Webhook not found');
    }

    // Update webhook
    const webhook = await this.prisma.x_suite_webhook.update({
      where: { id: webhookId },
      data: {
        ...(dto.url && { url: dto.url }),
        ...(dto.events && { events: dto.events }),
        ...(dto.secret && { secret: dto.secret }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
    });

    return {
      success: true,
      webhook: {
        id: webhook.id,
        target_product: webhook.target_product,
        url: webhook.url,
        events: webhook.events,
        is_active: webhook.is_active,
        updated_at: webhook.updated_at,
      },
    };
  }

  @Delete('webhooks/:webhook_id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete webhook' })
  @ApiParam({ name: 'webhook_id', example: 'webhook-uuid' })
  @ApiResponse({ status: 200, description: 'Webhook deleted successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async deleteWebhook(
    @Param('webhook_id') webhookId: string,
    @Headers('x-organization-id') organizationId: string,
  ) {
    // Check if webhook exists and belongs to organization
    const existing = await this.prisma.x_suite_webhook.findFirst({
      where: {
        id: webhookId,
        organization_id: organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Webhook not found');
    }

    await this.prisma.x_suite_webhook.delete({
      where: { id: webhookId },
    });

    return {
      success: true,
      message: 'Webhook deleted successfully',
    };
  }

  @Post('webhooks/:webhook_id/test')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Test webhook delivery',
    description: 'Sends a test event to the webhook to verify configuration.',
  })
  @ApiParam({ name: 'webhook_id', example: 'webhook-uuid' })
  @ApiResponse({ status: 200, description: 'Test event sent' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async testWebhook(
    @Param('webhook_id') webhookId: string,
    @Headers('x-organization-id') organizationId: string,
  ) {
    const webhook = await this.prisma.x_suite_webhook.findFirst({
      where: {
        id: webhookId,
        organization_id: organizationId,
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    // Publish test event
    const result = await this.eventPublishing.publishEvent(
      'test.webhook',
      organizationId,
      {
        message: 'This is a test event from LeadGenX',
        timestamp: new Date().toISOString(),
      },
      undefined,
      webhook.target_product,
    );

    return {
      success: true,
      event_id: result.event_id,
      message: 'Test event sent to webhook',
    };
  }

  // ==================== PRODUCT REGISTRY ====================

  @Get('products')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all X-Suite products' })
  @ApiResponse({ status: 200, description: 'List of products' })
  async listProducts() {
    const products = await this.prisma.x_suite_product.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });

    return {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        api_base_url: p.api_base_url,
        capabilities: p.capabilities,
        metadata: p.metadata,
      })),
      total: products.length,
    };
  }

  @Get('products/:product_slug')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get product details by slug' })
  @ApiParam({ name: 'product_slug', example: 'autogenx' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(@Param('product_slug') productSlug: string) {
    const product = await this.prisma.x_suite_product.findUnique({
      where: { slug: productSlug },
    });

    if (!product) {
      throw new NotFoundException(`Product '${productSlug}' not found`);
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      api_base_url: product.api_base_url,
      capabilities: product.capabilities,
      metadata: product.metadata,
      is_active: product.is_active,
    };
  }

  // ==================== HEALTH & METRICS ====================

  @Get('health')
  @ApiOperation({ summary: 'X-Suite integration health check' })
  @ApiResponse({ status: 200, description: 'Integration health status' })
  async health() {
    const [totalEvents, pendingEvents, failedEvents, activeWebhooks] =
      await Promise.all([
        this.prisma.x_suite_event_log.count(),
        this.prisma.x_suite_event_log.count({ where: { status: 'pending' } }),
        this.prisma.x_suite_event_log.count({ where: { status: 'failed' } }),
        this.prisma.x_suite_webhook.count({ where: { is_active: true } }),
      ]);

    return {
      status: 'healthy',
      metrics: {
        total_events: totalEvents,
        pending_events: pendingEvents,
        failed_events: failedEvents,
        active_webhooks: activeWebhooks,
      },
    };
  }
}
