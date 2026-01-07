import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * WorkflowResumeService
 * 
 * Handles resuming paused workflow enrollments.
 * Used after wait_hours delays or for scheduled no-reply checks.
 */
@Injectable()
export class WorkflowResumeService {
  private readonly logger = new Logger(WorkflowResumeService.name);
  private readonly MAX_STEPS_PER_RUN = 50; // Prevent infinite loops
  private readonly LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resume a paused enrollment from its current step.
   * Returns true if resumed successfully, false if skipped (already locked/completed).
   */
  async resumeEnrollment(enrollmentId: string): Promise<boolean> {
    this.logger.log(`Attempting to resume enrollment ${enrollmentId}`);

    // Try to acquire lock
    const locked = await this.acquireLock(enrollmentId);
    if (!locked) {
      this.logger.warn(
        `Enrollment ${enrollmentId} is already locked or completed, skipping`,
      );
      return false;
    }

    try {
      // Fetch enrollment with workflow and steps
      const enrollment = await this.prisma.automation_enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          workflow: {
            include: {
              steps: {
                orderBy: { step_order: 'asc' },
              },
            },
          },
          lead: true,
        },
      });

      if (!enrollment) {
        this.logger.error(`Enrollment ${enrollmentId} not found`);
        return false;
      }

      // Check if workflow is still enabled
      if (!enrollment.workflow.is_enabled) {
        this.logger.warn(
          `Workflow ${enrollment.workflow.id} is disabled, marking enrollment as failed`,
        );
        await this.failEnrollment(
          enrollmentId,
          'Workflow was disabled during execution',
        );
        return false;
      }

      // Check status
      if (enrollment.status === 'completed' || enrollment.status === 'failed') {
        this.logger.warn(
          `Enrollment ${enrollmentId} already ${enrollment.status}, skipping`,
        );
        return false;
      }

      // Get current step order (default to 1 if not set)
      const currentStepOrder = enrollment.current_step_order || 1;
      const steps = enrollment.workflow.steps;

      // Find the step to resume from
      const stepToResume = steps.find(
        (s) => s.step_order === currentStepOrder,
      );

      if (!stepToResume) {
        this.logger.error(
          `Step ${currentStepOrder} not found in workflow ${enrollment.workflow.id}`,
        );
        await this.failEnrollment(
          enrollmentId,
          `Step ${currentStepOrder} not found`,
        );
        return false;
      }

      this.logger.log(
        `Resuming enrollment ${enrollmentId} from step ${currentStepOrder}`,
      );

      // Continue execution from current step
      // We'll delegate to the executor service to continue from here
      // For now, just mark as active and clear next_run_at
      await this.prisma.automation_enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: 'active',
          next_run_at: null,
        },
      });

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to resume enrollment ${enrollmentId}: ${error.message}`,
        error.stack,
      );
      await this.failEnrollment(enrollmentId, error.message);
      return false;
    } finally {
      // Release lock
      await this.releaseLock(enrollmentId);
    }
  }

  /**
   * Poll for enrollments that are due to resume.
   * Returns list of enrollment IDs that were resumed.
   */
  async pollAndResumeOverdue(): Promise<string[]> {
    const now = new Date();

    // Find enrollments that are due
    const dueEnrollments = await this.prisma.automation_enrollment.findMany({
      where: {
        status: 'paused',
        next_run_at: {
          lte: now,
        },
        // Exclude recently locked (might be in progress)
        OR: [
          { locked_at: null },
          {
            locked_at: {
              lte: new Date(Date.now() - this.LOCK_TIMEOUT_MS),
            },
          },
        ],
      },
      take: 50, // Process in batches
      orderBy: { next_run_at: 'asc' },
    });

    this.logger.log(
      `Found ${dueEnrollments.length} enrollment(s) due for resume`,
    );

    const resumed: string[] = [];

    for (const enrollment of dueEnrollments) {
      try {
        const success = await this.resumeEnrollment(enrollment.id);
        if (success) {
          resumed.push(enrollment.id);
        }
      } catch (error) {
        this.logger.error(
          `Failed to resume enrollment ${enrollment.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(`Resumed ${resumed.length} enrollment(s)`);

    return resumed;
  }

  /**
   * Acquire lock on enrollment.
   * Returns true if lock acquired, false if already locked.
   */
  private async acquireLock(enrollmentId: string): Promise<boolean> {
    const lockOwner = `worker-${process.pid}-${Date.now()}`;
    const now = new Date();
    const staleThreshold = new Date(Date.now() - this.LOCK_TIMEOUT_MS);

    try {
      // Try to acquire lock (update where not locked or lock is stale)
      const result = await this.prisma.automation_enrollment.updateMany({
        where: {
          id: enrollmentId,
          OR: [
            { locked_at: null },
            { locked_at: { lte: staleThreshold } },
          ],
          status: { in: ['active', 'paused'] },
        },
        data: {
          locked_at: now,
          lock_owner: lockOwner,
        },
      });

      return result.count > 0;
    } catch (error) {
      this.logger.error(
        `Failed to acquire lock for enrollment ${enrollmentId}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Release lock on enrollment.
   */
  private async releaseLock(enrollmentId: string): Promise<void> {
    try {
      await this.prisma.automation_enrollment.update({
        where: { id: enrollmentId },
        data: {
          locked_at: null,
          lock_owner: null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to release lock for enrollment ${enrollmentId}: ${error.message}`,
      );
    }
  }

  /**
   * Mark enrollment as failed.
   */
  private async failEnrollment(
    enrollmentId: string,
    error: string,
  ): Promise<void> {
    try {
      await this.prisma.automation_enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: 'failed',
          last_error: error,
          locked_at: null,
          lock_owner: null,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to mark enrollment ${enrollmentId} as failed: ${err.message}`,
      );
    }
  }

  /**
   * Get execution context from enrollment.
   */
  getContext(enrollment: any): Record<string, any> {
    return (enrollment.context_json as Record<string, any>) || {};
  }

  /**
   * Update execution context for enrollment.
   */
  async updateContext(
    enrollmentId: string,
    context: Record<string, any>,
  ): Promise<void> {
    await this.prisma.automation_enrollment.update({
      where: { id: enrollmentId },
      data: { context_json: context as any },
    });
  }
}
