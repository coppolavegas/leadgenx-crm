export interface StepResponse {
  id: string;
  workflowId: string;
  stepOrder: number;
  actionType: string;
  actionConfig: Record<string, any>;
  createdAt: Date;
}

export interface WorkflowResponse {
  id: string;
  workspaceId: string;
  name: string;
  triggerEventType: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  steps?: StepResponse[];
}
