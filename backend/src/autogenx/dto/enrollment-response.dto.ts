export interface EnrollmentResponse {
  id: string;
  workflowId: string;
  workspaceId: string;
  leadId: string | null;
  eventId: string;
  status: string;
  enrolledAt: Date;
  completedAt: Date | null;
  lastError: string | null;
  workflow?: {
    id: string;
    name: string;
    triggerEventType: string;
  };
}
