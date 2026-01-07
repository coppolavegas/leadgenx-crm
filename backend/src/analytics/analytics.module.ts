import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsReportingService } from './services/analytics-reporting.service';
import { AnalyticsAggregationService } from './services/analytics-aggregation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Phase 16: Analytics Module
 * Provides analytics and ROI tracking capabilities
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsReportingService, AnalyticsAggregationService],
  exports: [AnalyticsReportingService, AnalyticsAggregationService],
})
export class AnalyticsModule {}
