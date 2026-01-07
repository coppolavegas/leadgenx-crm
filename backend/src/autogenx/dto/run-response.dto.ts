export interface RunResponse {
  id: string;
  enrollmentId: string;
  stepId: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  error: string | null;
  step?: {
    id: string;
    stepOrder: number;
    actionType: string;
    actionConfig: Record<string, any>;
  };
}
