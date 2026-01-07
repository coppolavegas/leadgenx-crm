import { Injectable, Logger } from '@nestjs/common';
import { AutoGenxService } from './autogenx.service';
import { WorkflowExecutorService } from './services/workflow-executor.service';

/**
 * AutoGenX Background Worker
 * 
 * Phase 1: Event Spine - records events
 * Phase 2: Workflow Execution - executes matching workflows
 * Future phases: AI prompt generation, messaging
 */
@Injectable()
export class AutoGenxWorkerService {
  private readonly logger = new Logger(AutoGenxWorkerService.name);
  private isRunning = false;

  constructor(
    private readonly autogenxService: AutoGenxService,
    private readonly workflowExecutor: WorkflowExecutorService,
  ) {}

  /**
   * Process a batch of pending events
   * This is safe to call repeatedly - it won't crash on single-event failure
   */
  async processPendingEvents(): Promise<{
    processed: number;
    failed: number;
    total: number;
  }> {
    if (this.isRunning) {
      this.logger.warn('Worker already running, skipping...');
      return { processed: 0, failed: 0, total: 0 };
    }

    this.isRunning = true;
    let processedCount = 0;
    let failedCount = 0;

    try {
      this.logger.log('Starting AutoGenX worker...');

      // Get pending events
      const events = await this.autogenxService.getPendingEvents(50);
      this.logger.log(`Found ${events.length} pending events`);

      // Process each event
      for (const event of events) {
        try {
          await this.processEvent(event);
          await this.autogenxService.markEventProcessed(event.id);
          processedCount++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to process event ${event.id} (${event.event_type}): ${errorMessage}`,
          );
          await this.autogenxService.markEventFailed(event.id, errorMessage);
          failedCount++;
        }
      }

      this.logger.log(
        `Worker completed: ${processedCount} processed, ${failedCount} failed`,
      );

      return {
        processed: processedCount,
        failed: failedCount,
        total: events.length,
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process a single event
   * Phase 1: Log the event
   * Phase 2: Execute matching workflows
   * Future phases: AI prompt generation, messaging
   */
  private async processEvent(event: any): Promise<void> {
    this.logger.log(
      `Processing event: ${event.event_type} (id: ${event.id}, leadId: ${event.lead_id || 'none'}, workspaceId: ${event.workspace_id || 'none'})`,
    );

    // Idempotency check - ensure same event isn't processed twice
    if (event.processed_at) {
      this.logger.warn(`Event ${event.id} already processed, skipping`);
      return;
    }

    // Phase 1: Log payload
    this.logger.debug(`Event payload: ${JSON.stringify(event.payload)}`);

    // Phase 2: Execute workflows
    try {
      await this.workflowExecutor.executeWorkflowsForEvent(event.id);
      this.logger.log(`Workflows executed for event ${event.id}`);
    } catch (error) {
      this.logger.error(
        `Workflow execution failed for event ${event.id}: ${error.message}`,
        error.stack,
      );
      // Don't throw - we still want to mark the event as processed
      // Individual workflow failures are logged in the enrollment records
    }

    // TODO Phase 3+: Add AI prompt generation
    // TODO Phase 4+: Add SMS/email sending

    this.logger.log(`Event ${event.id} processed successfully`);
  }
}
