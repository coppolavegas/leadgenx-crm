import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmIntegrationService } from './llm-integration.service';
import { WorkflowDraftDto, WorkflowDraftResponseDto } from '../dto/workflow-draft.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * AutoGenX Prompt Service
 * Converts natural language prompts into validated workflow drafts
 */
@Injectable()
export class AutogenxPromptService {
  private readonly logger = new Logger(AutogenxPromptService.name);

  // Rate limiting: max 5 prompts per workspace per minute
  private readonly rateLimitMap = new Map<string, number[]>();
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
  private readonly RATE_LIMIT_MAX = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmIntegrationService,
  ) {}

  /**
   * Generate workflow draft from natural language prompt
   */
  async generateWorkflowFromPrompt(
    workspaceId: string,
    promptText: string,
    userId?: string,
  ): Promise<WorkflowDraftResponseDto> {
    // Check rate limit
    this.checkRateLimit(workspaceId);

    // Check LLM configured
    if (!this.llmService.isConfigured()) {
      throw new BadRequestException('LLM API is not configured. Please contact administrator.');
    }

    // Create prompt log
    const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    try {
      // Generate workflow using LLM
      const systemPrompt = this.buildSystemPrompt();
      const llmResponse = await this.llmService.generateCompletion(
        systemPrompt,
        promptText,
        {
          temperature: 0.3,
          maxTokens: 2000,
          responseFormat: 'json_object',
        },
      );

      // Parse LLM response
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(llmResponse);
      } catch (parseError) {
        this.logger.error(`Failed to parse LLM JSON response: ${parseError.message}`);
        await this.createPromptLog(workspaceId, userId, promptText, null, ['Invalid JSON from LLM'], false, logId);
        throw new BadRequestException('LLM returned invalid JSON. Please try rephrasing your request.');
      }

      // Validate workflow draft
      const validationResult = await this.validateWorkflowDraft(parsedJson);

      // Save to audit log
      await this.createPromptLog(
        workspaceId,
        userId,
        promptText,
        parsedJson,
        validationResult.errors,
        validationResult.valid,
        logId,
      );

      return {
        draft: parsedJson as WorkflowDraftDto,
        valid: validationResult.valid,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        logId,
      };
    } catch (error) {
      this.logger.error(`Prompt generation failed: ${error.message}`, error.stack);

      // Log failure
      await this.createPromptLog(
        workspaceId,
        userId,
        promptText,
        null,
        [error.message],
        false,
        logId,
      );

      throw error;
    }
  }

  /**
   * Validate workflow draft against schema and business rules
   */
  private async validateWorkflowDraft(draft: any): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Transform to DTO and validate
    const draftDto = plainToInstance(WorkflowDraftDto, draft);
    const validationErrors = await validate(draftDto);

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => {
        Object.values(error.constraints || {}).forEach((message) => {
          errors.push(message);
        });
      });
    }

    // Business rules validation
    if (draft.steps) {
      // Max 20 steps
      if (draft.steps.length > 20) {
        errors.push('Workflow cannot have more than 20 steps');
      }

      // Validate each step
      draft.steps.forEach((step: any, index: number) => {
        // Check wait_hours max 72h
        if (step.actionType === 'wait_hours' && step.actionConfig?.hours > 72) {
          errors.push(`Step ${index + 1}: wait_hours cannot exceed 72 hours`);
        }

        // Check branch has valid target steps
        if (step.actionType === 'branch') {
          const ifTrue = step.actionConfig?.ifTrueStepOrder;
          const ifFalse = step.actionConfig?.ifFalseStepOrder;

          if (ifTrue && ifTrue > draft.steps.length) {
            errors.push(`Step ${index + 1}: branch ifTrueStepOrder ${ifTrue} exceeds total steps`);
          }
          if (ifFalse && ifFalse > draft.steps.length) {
            errors.push(`Step ${index + 1}: branch ifFalseStepOrder ${ifFalse} exceeds total steps`);
          }

          // Check for potential infinite loops
          if (ifTrue && ifTrue <= step.order) {
            warnings.push(`Step ${index + 1}: branch may create a loop (jumping backwards)`);
          }
          if (ifFalse && ifFalse <= step.order) {
            warnings.push(`Step ${index + 1}: branch may create a loop (jumping backwards)`);
          }
        }

        // Check condition_contains_text has text
        if (step.actionType === 'condition_contains_text') {
          if (!step.actionConfig?.searchText) {
            errors.push(`Step ${index + 1}: condition_contains_text requires searchText`);
          }
        }
      });

      // Check step order is sequential
      const orders = draft.steps.map((s: any) => s.order).sort((a: number, b: number) => a - b);
      for (let i = 0; i < orders.length; i++) {
        if (orders[i] !== i + 1) {
          errors.push(`Steps must have sequential order starting from 1`);
          break;
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Build system prompt for LLM
   */
  private buildSystemPrompt(): string {
    return `You are AutoGenX Workflow Builder, an AI assistant that converts natural language automation requests into structured workflow JSON.

**CRITICAL RULES:**
1. Output ONLY valid JSON matching the schema below. No markdown, no explanations.
2. Use ONLY the allowed eventTypes and actionTypes listed below.
3. Never invent new step types or event types.
4. Use safest defaults if information is missing.
5. Include an "assumptions" array listing any assumptions you made.

**ALLOWED EVENT TYPES (triggers):**
- lead_created
- lead_status_changed
- lead_tagged
- inbound_message_received
- task_completed
- form_submitted

**ALLOWED ACTION TYPES (steps):**
- update_lead_status: { "status": "new" | "contacted" | "qualified" | "converted" | "lost" }
- add_lead_tag: { "tagName": "string" }
- remove_lead_tag: { "tagName": "string" }
- create_task: { "title": "string", "description": "string", "dueInHours": number }
- update_lead_field: { "fieldName": "string", "fieldValue": any }
- wait_hours: { "hours": number } (max 72 hours)
- condition_contains_text: { "searchText": "string", "caseSensitive": boolean }
- branch: { "ifTrueStepOrder": number, "ifFalseStepOrder": number }

**OUTPUT SCHEMA:**
{
  "name": "Workflow Name",
  "description": "Optional description",
  "trigger": {
    "eventType": "lead_created",
    "filters": {} // optional
  },
  "steps": [
    {
      "order": 1,
      "actionType": "wait_hours",
      "actionConfig": { "hours": 4 }
    },
    {
      "order": 2,
      "actionType": "condition_contains_text",
      "actionConfig": { "searchText": "reply", "caseSensitive": false }
    },
    {
      "order": 3,
      "actionType": "branch",
      "actionConfig": { "ifTrueStepOrder": 6, "ifFalseStepOrder": 4 }
    },
    {
      "order": 4,
      "actionType": "create_task",
      "actionConfig": { "title": "Follow up", "description": "Lead needs follow-up", "dueInHours": 24 }
    },
    {
      "order": 5,
      "actionType": "add_lead_tag",
      "actionConfig": { "tagName": "follow-up" }
    },
    {
      "order": 6,
      "actionType": "update_lead_status",
      "actionConfig": { "status": "contacted" }
    }
  ],
  "constraints": {
    "maxSteps": 20,
    "quietHours": { "start": "22:00", "end": "08:00", "timezone": "America/New_York" },
    "maxMessagesPerDay": 5
  },
  "assumptions": [
    "Assumed 4-hour wait is appropriate",
    "Assumed follow-up tag is desired"
  ]
}

**IMPORTANT:**
- Steps must have sequential order starting from 1
- Branch targets must reference valid step orders
- Maximum 20 steps per workflow
- wait_hours maximum is 72 hours
- Output pure JSON only, no code blocks or explanations`;
  }

  /**
   * Create prompt log entry for audit trail
   */
  private async createPromptLog(
    workspaceId: string,
    userId: string | undefined,
    promptText: string,
    generatedJson: any,
    validationErrors: string[] | undefined,
    success: boolean,
    logId: string,
  ): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO autogenx_prompt_logs (
          id, workspace_id, user_id, prompt_text, generated_json,
          validation_errors, success, created_at, updated_at
        )
        VALUES (
          ${logId}, ${workspaceId}, ${userId || null}, ${promptText},
          ${generatedJson ? JSON.stringify(generatedJson) : null}::jsonb,
          ${validationErrors && validationErrors.length > 0 ? JSON.stringify(validationErrors) : null}::jsonb,
          ${success}, NOW(), NOW()
        )
      `;
    } catch (error) {
      this.logger.error(`Failed to create prompt log: ${error.message}`);
      // Don't throw - logging failure shouldn't block the response
    }
  }

  /**
   * Link published workflow to prompt log
   */
  async linkPublishedWorkflow(logId: string, workflowId: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        UPDATE autogenx_prompt_logs
        SET published_workflow_id = ${workflowId}, updated_at = NOW()
        WHERE id = ${logId}
      `;
    } catch (error) {
      this.logger.error(`Failed to link published workflow: ${error.message}`);
    }
  }

  /**
   * Check rate limit for workspace
   */
  private checkRateLimit(workspaceId: string): void {
    const now = Date.now();
    const timestamps = this.rateLimitMap.get(workspaceId) || [];

    // Remove timestamps outside the window
    const validTimestamps = timestamps.filter((ts) => now - ts < this.RATE_LIMIT_WINDOW_MS);

    if (validTimestamps.length >= this.RATE_LIMIT_MAX) {
      throw new BadRequestException(
        `Rate limit exceeded. Maximum ${this.RATE_LIMIT_MAX} prompt requests per minute.`,
      );
    }

    // Add current timestamp
    validTimestamps.push(now);
    this.rateLimitMap.set(workspaceId, validTimestamps);

    // Clean up old entries periodically
    if (this.rateLimitMap.size > 1000) {
      this.rateLimitMap.clear();
    }
  }

  /**
   * Get prompt logs for workspace (admin only)
   */
  async getPromptLogs(
    workspaceId: string,
    limit: number = 50,
  ): Promise<any[]> {
    const logs = await this.prisma.$queryRaw`
      SELECT
        id, workspace_id, user_id, prompt_text,
        generated_json, validation_errors, success,
        published_workflow_id, created_at
      FROM autogenx_prompt_logs
      WHERE workspace_id = ${workspaceId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return logs as any[];
  }
}
