export interface EnrollmentDetailResponse {
  id: string;
  workflowId: string;
  workspaceId: string;
  leadId: string | null;
  eventId: string;
  status: string;
  enrolledAt: Date;
  completedAt: Date | null;
  lastError: string | null;
  
  // Phase 2.5: Execution context and scheduling
  contextJson: Record<string, any> | null;
  currentStepOrder: number | null;
  nextRunAt: Date | null;
  lockedAt: Date | null;
  lockOwner: string | null;
  
  // Relations
  workflow?: {
    id: string;
    name: string;
    triggerEventType: string;
    isEnabled: boolean;
  };
  
  // Recent runs
  runs?: Array<{
    id: string;
    stepId: string;
    status: string;
    startedAt: Date;
    finishedAt: Date | null;
    error: string | null;
    step?: {
      stepOrder: number;
      actionType: string;
      actionConfig: Record<string, any>;
    };
  }>;
}
