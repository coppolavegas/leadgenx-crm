import { Module } from '@nestjs/common';
import { AutoGenxController } from './autogenx.controller';
import { AutoGenxService } from './autogenx.service';
import { AutoGenxWorkerService } from './autogenx-worker.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

// Phase 2: Workflow execution
import { WorkflowService } from './services/workflow.service';
import { WorkflowExecutorService } from './services/workflow-executor.service';
import { WorkflowController } from './controllers/workflow.controller';
import { WorkflowAdminController } from './controllers/workflow-admin.controller';

// Phase 2.5: Delayed steps and conditional branching
import { WorkflowResumeService } from './services/workflow-resume.service';
import { WorkflowSchedulerService } from './services/workflow-scheduler.service';
import { NoReplyTrackerService } from './services/no-reply-tracker.service';

// Phase 3: AI-Powered Workflow Generation
import { AutogenxPromptService } from './services/autogenx-prompt.service';
import { LlmIntegrationService } from './services/llm-integration.service';
import { AutogenxPromptController } from './controllers/autogenx-prompt.controller';

// Phase 4.5: Messaging, Compliance & Inbound
import { MessagingSettingsService } from './services/messaging-settings.service';
import { QuietHoursService } from './services/quiet-hours.service';
import { RateLimitService } from './services/rate-limit.service';
import { OptOutService } from './services/opt-out.service';
import { InboundMessageService } from './services/inbound-message.service';
import { MessagingService } from './services/messaging.service';
import { MessagingWorkerService } from './services/messaging-worker.service';
import { WebhookValidatorService } from './services/webhook-validator.service';
import { WebhooksController } from './controllers/webhooks.controller';
import { MessagingSettingsController } from './controllers/messaging-settings.controller';

/**
 * AutoGenX Module
 * 
 * Phase 1: Event Spine
 * - Event emission (fire-and-forget)
 * - Background event processing
 * - Internal worker endpoint
 * 
 * Phase 2: Workflow Rules & Execution
 * - Workflow CRUD operations
 * - Step management
 * - Workflow execution engine
 * - Enrollment tracking
 * - Run history
 * 
 * Phase 2.5: Delayed Steps & Branching
 * - wait_hours step type
 * - condition_contains_text step type
 * - branch step type
 * - Workflow resume/scheduling
 * 
 * Phase 3: AI-Powered Workflow Generation
 * - Natural language prompt → workflow draft
 * - LLM integration (OpenAI-compatible)
 * - Schema validation & safety checks
 * - Draft → Preview → Publish flow
 * - Audit logging
 * 
 * Phase 4.5: Messaging, Compliance & Inbound
 * - SMS/Email sending via Twilio/SendGrid
 * - Opt-out detection (STOP, UNSUBSCRIBE)
 * - Quiet hours enforcement (timezone-aware)
 * - Rate limiting (daily caps per channel)
 * - Inbound message processing (webhooks)
 * - Webhook signature validation
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    AutoGenxController,
    WorkflowController,
    WorkflowAdminController,
    AutogenxPromptController, // Phase 3
    WebhooksController, // Phase 4.5
    MessagingSettingsController, // Phase 4.5
  ],
  providers: [
    AutoGenxService,
    AutoGenxWorkerService,
    WorkflowService,
    WorkflowExecutorService,
    WorkflowResumeService,
    WorkflowSchedulerService,
    NoReplyTrackerService,
    AutogenxPromptService, // Phase 3
    LlmIntegrationService, // Phase 3
    // Phase 4.5: Messaging services
    MessagingSettingsService,
    QuietHoursService,
    RateLimitService,
    OptOutService,
    InboundMessageService,
    MessagingService,
    MessagingWorkerService,
    WebhookValidatorService,
  ],
  exports: [AutoGenxService, WorkflowExecutorService, NoReplyTrackerService], // Export for other modules
})
export class AutoGenxModule {}
