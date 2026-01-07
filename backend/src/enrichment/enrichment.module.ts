import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnrichmentController } from './enrichment.controller';
import { EnrichmentService } from './services/enrichment.service';
import { EnrichmentQueueService } from './services/enrichment-queue.service';
import { CrawlerService } from './services/crawler.service';
import { ExtractionService } from './services/extraction.service';
import { VerificationService } from './services/verification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, ConfigModule, PrismaModule],
  controllers: [EnrichmentController],
  providers: [
    EnrichmentService,
    EnrichmentQueueService,
    CrawlerService,
    ExtractionService,
    VerificationService,
  ],
  exports: [EnrichmentService, EnrichmentQueueService, VerificationService],
})
export class EnrichmentModule {}
