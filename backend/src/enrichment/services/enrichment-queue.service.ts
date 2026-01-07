import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { EnrichmentService } from './enrichment.service';

export interface EnrichmentJobData {
  leadId: string;
  dryRun?: boolean;
}

@Injectable()
export class EnrichmentQueueService implements OnModuleInit {
  private readonly logger = new Logger(EnrichmentQueueService.name);
  private queue: Queue<EnrichmentJobData> | null = null;
  private worker: Worker<EnrichmentJobData> | null = null;
  private connection: Redis | null = null;
  private isRedisAvailable = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly enrichmentService: EnrichmentService,
  ) {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
      const redisPort = this.configService.get<number>('REDIS_PORT', 6379);

      if (redisUrl) {
        this.connection = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          lazyConnect: true,
          retryStrategy: () => null, // Disable auto-reconnect
        });
      } else {
        this.connection = new Redis({
          host: redisHost,
          port: redisPort,
          maxRetriesPerRequest: null,
          lazyConnect: true,
          retryStrategy: () => null, // Disable auto-reconnect
        });
      }

      // Suppress Redis connection errors to prevent log flooding
      this.connection.on('error', (err) => {
        // Silent error - will be handled during onModuleInit
      });

      this.logger.log('Redis connection configured (lazy connect)');
    } catch (error) {
      this.logger.warn(`Redis configuration failed: ${error.message}. Background enrichment will be disabled.`);
      this.connection = null;
    }
  }

  async onModuleInit() {
    if (!this.connection) {
      this.logger.warn('Redis not available - background enrichment disabled. Enrichment will be synchronous.');
      return;
    }

    try {
      // Test connection
      await this.connection.connect();
      await this.connection.ping();
      this.isRedisAvailable = true;

      this.queue = new Queue<EnrichmentJobData>('enrichment', {
        connection: this.connection as any, // BullMQ bundled ioredis types conflict
      });

      // Start worker
      this.worker = new Worker<EnrichmentJobData>(
        'enrichment',
        async (job: Job<EnrichmentJobData>) => {
          this.logger.log(`Processing enrichment job ${job.id} for lead ${job.data.leadId}`);
          
          try {
            const result = await this.enrichmentService.enrichLead(
              job.data.leadId,
              job.data.dryRun,
            );
            return result;
          } catch (error) {
            this.logger.error(`Enrichment job ${job.id} failed: ${error.message}`);
            throw error;
          }
        },
        {
          connection: this.connection as any, // BullMQ bundled ioredis types conflict
          concurrency: 3, // Process 3 leads concurrently
        },
      );

      this.worker.on('completed', (job) => {
        this.logger.log(`Enrichment job ${job.id} completed for lead ${job.data.leadId}`);
      });

      this.worker.on('failed', (job, error) => {
        this.logger.error(`Enrichment job ${job?.id} failed: ${error.message}`);
      });

      this.logger.log('EnrichmentWorker started with Redis');
    } catch (error) {
      this.logger.warn(`Failed to connect to Redis: ${error.message}. Background enrichment disabled.`);
      this.isRedisAvailable = false;
      if (this.connection) {
        try {
          await this.connection.quit();
        } catch (quitError) {
          // Silent - connection already closed
        }
        this.connection = null;
      }
    }
  }

  /**
   * Add enrichment job to queue
   */
  async addEnrichmentJob(leadId: string, dryRun = false): Promise<string> {
    if (!this.isRedisAvailable || !this.queue) {
      this.logger.warn(`Redis not available - processing lead ${leadId} synchronously`);
      // Process synchronously if Redis is not available
      await this.enrichmentService.enrichLead(leadId, dryRun);
      return `sync-${leadId}-${Date.now()}`;
    }

    // Check for existing job with same leadId (idempotency)
    const existingJobs = await this.queue.getJobs(['active', 'waiting', 'delayed']);
    const duplicate = existingJobs.find((job) => job.data.leadId === leadId);

    if (duplicate) {
      this.logger.log(`Enrichment job for lead ${leadId} already queued (job ${duplicate.id})`);
      return duplicate.id!;
    }

    const job = await this.queue.add(
      'enrich',
      { leadId, dryRun },
      {
        jobId: `enrich-${leadId}-${Date.now()}`,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    this.logger.log(`Added enrichment job ${job.id} for lead ${leadId}`);
    return job.id!;
  }

  /**
   * Add batch enrichment jobs
   */
  async addBatchEnrichmentJobs(leadIds: string[]): Promise<string[]> {
    const jobIds: string[] = [];

    for (const leadId of leadIds) {
      const jobId = await this.addEnrichmentJob(leadId);
      jobIds.push(jobId);
    }

    return jobIds;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string) {
    if (!this.isRedisAvailable || !this.queue) {
      return {
        jobId,
        status: 'unavailable',
        error: 'Redis not available - enrichment is processed synchronously',
      };
    }

    const job = await this.queue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    return {
      jobId: job.id,
      leadId: job.data.leadId,
      status: state,
      result,
      error: failedReason,
    };
  }

  /**
   * Get queue for direct access
   */
  getQueue(): Queue<EnrichmentJobData> | null {
    return this.queue;
  }

  /**
   * Check if Redis/Queue is available
   */
  isQueueAvailable(): boolean {
    return this.isRedisAvailable;
  }
}
