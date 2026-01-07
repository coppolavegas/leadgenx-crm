import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { WorkflowResumeService } from './workflow-resume.service';

/**
 * WorkflowSchedulerService
 * 
 * Handles scheduling and resuming paused workflows.
 * Uses a simple polling approach (every minute) to check for due enrollments.
 * 
 * Alternative: Could use BullMQ delayed jobs, but polling is simpler and
 * works well for the current use case.
 */
@Injectable()
export class WorkflowSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowSchedulerService.name);
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 60 * 1000; // 1 minute

  constructor(private readonly resumeService: WorkflowResumeService) {}

  onModuleInit() {
    // Start polling for due enrollments
    this.startPolling();
  }

  /**
   * Start polling for due enrollments.
   */
  startPolling(): void {
    if (this.pollingInterval) {
      this.logger.warn('Polling already started');
      return;
    }

    this.logger.log(
      `Starting workflow scheduler polling (interval: ${this.POLL_INTERVAL_MS}ms)`,
    );

    // Run immediately
    this.pollAndResume();

    // Then run every interval
    this.pollingInterval = setInterval(() => {
      this.pollAndResume();
    }, this.POLL_INTERVAL_MS);
  }

  /**
   * Stop polling.
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.logger.log('Stopped workflow scheduler polling');
    }
  }

  /**
   * Poll for overdue enrollments and resume them.
   */
  private async pollAndResume(): Promise<void> {
    try {
      const resumed = await this.resumeService.pollAndResumeOverdue();
      if (resumed.length > 0) {
        this.logger.log(
          `Scheduler resumed ${resumed.length} enrollment(s): ${resumed.join(', ')}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error during polling: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Schedule an enrollment to resume at a specific time.
   * This just updates the next_run_at field - the poller will pick it up.
   */
  async scheduleResume(
    enrollmentId: string,
    resumeAt: Date,
  ): Promise<void> {
    this.logger.log(
      `Scheduling enrollment ${enrollmentId} to resume at ${resumeAt.toISOString()}`,
    );
    // Implementation will be in the executor service
    // This is just a placeholder for the interface
  }
}
