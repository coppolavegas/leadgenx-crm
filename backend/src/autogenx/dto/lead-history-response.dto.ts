export interface LeadHistoryResponse {
  events: Array<{
    id: string;
    eventType: string;
    payload: any;
    status: string;
    createdAt: Date;
    processedAt: Date | null;
  }>;
  enrollments: Array<{
    id: string;
    workflowId: string;
    workflowName: string;
    status: string;
    enrolledAt: Date;
    completedAt: Date | null;
  }>;
  runs: Array<{
    id: string;
    enrollmentId: string;
    stepOrder: number;
    actionType: string;
    status: string;
    startedAt: Date;
    finishedAt: Date | null;
    error: string | null;
  }>;
}
