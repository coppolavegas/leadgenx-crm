import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { LeadsModule } from './leads/leads.module';
import { ExportModule } from './export/export.module';
import { EnrichmentModule } from './enrichment/enrichment.module';
import { BlocklistModule } from './blocklist/blocklist.module';
import { ClientsModule } from './clients/clients.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { CrmModule } from './crm/crm.module';
import { OutreachModule } from './outreach/outreach.module';
import { InboxModule } from './inbox/inbox.module';
import { IntegrationModule } from './integration/integration.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { GenieModule } from './genie/genie.module';
import { AdminModule } from './admin/admin.module';
import { AutoGenxModule } from './autogenx/autogenx.module';
import { CalGenXModule } from './calgenx/calgenx.module';
import { SessionAuthGuard } from './auth/guards/session-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Global rate limiting: 100 requests per 15 minutes by default
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 100, // 100 requests per minute
    }]),
    PrismaModule,
    CommonModule, // Global module for shared services
    AuthModule,
    HealthModule,
    DiscoveryModule,
    LeadsModule,
    ExportModule,
    EnrichmentModule,
    BlocklistModule,
    ClientsModule,
    CampaignsModule,
    CrmModule,
    OutreachModule,
    InboxModule,
    IntegrationModule,
    AnalyticsModule,
    GenieModule,
    AdminModule,
    AutoGenxModule,
    CalGenXModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply session authentication globally (checks for @Public() decorator)
    {
      provide: APP_GUARD,
      useClass: SessionAuthGuard,
    },
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
