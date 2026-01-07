/**
 * Dedicated Worker Process for BullMQ Job Processing
 * 
 * This runs as a separate service from the API to handle
 * background enrichment jobs from the queue.
 */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { EnrichmentQueueService } from './enrichment/services/enrichment-queue.service';

async function bootstrapWorker() {
  const logger = new Logger('WorkerBootstrap');

  try {
    // Create app context without starting HTTP server
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['log', 'error', 'warn'],
    });

    logger.log('Worker application context created');

    // Get the enrichment queue service (worker is auto-started in onModuleInit)
    const enrichmentQueue = app.get(EnrichmentQueueService);
    logger.log('EnrichmentQueueService initialized - worker is processing jobs');

    // Keep process alive
    process.on('SIGTERM', async () => {
      logger.warn('SIGTERM received, shutting down worker gracefully...');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.warn('SIGINT received, shutting down worker gracefully...');
      await app.close();
      process.exit(0);
    });

    logger.log('✅ Worker service is running and processing enrichment jobs');
  } catch (error) {
    logger.error('Failed to start worker:', error);
    process.exit(1);
  }
}

bootstrapWorker();
