// API Client for LeadGenX Backend

import { User, LoginRequest, RegisterRequest, Session } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class APIClient {
  private baseURL: string;
  private sessionToken: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  setSessionToken(token: string) {
    this.sessionToken = token;
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  clearSessionToken() {
    this.sessionToken = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new APIError(
          data?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        error instanceof Error ? error.message : 'Network request failed',
        0
      );
    }
  }

  // Auth
  async register(data: RegisterRequest) {
    return this.request<Session>('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest) {
    return this.request<Session>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout() {
    return this.request<{ message: string }>('/v1/auth/logout', {
      method: 'POST',
    });
  }

  async getMe() {
    return this.request<User>('/v1/auth/me');
  }

  // Clients
  async getClients() {
    return this.request<any[]>('/v1/clients');
  }

  async getClient(id: string) {
    return this.request<any>(`/v1/clients/${id}`);
  }

  async createClient(data: {
    name: string;
    industry?: string;
    website?: string;
    notes?: string;
  }) {
    return this.request<any>('/v1/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClient(id: string, data: Partial<any>) {
    return this.request<any>(`/v1/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteClient(id: string) {
    return this.request<void>(`/v1/clients/${id}`, {
      method: 'DELETE',
    });
  }

  // Campaigns
  async getCampaigns(clientId?: string) {
    const params = clientId ? `?client_id=${clientId}` : '';
    return this.request<any[]>(`/v1/campaigns${params}`);
  }

  async getCampaign(id: string) {
    return this.request<any>(`/v1/campaigns/${id}`);
  }

  async createCampaign(data: any) {
    return this.request<any>('/v1/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCampaign(id: string, data: Partial<any>) {
    return this.request<any>(`/v1/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCampaign(id: string) {
    return this.request<void>(`/v1/campaigns/${id}`, {
      method: 'DELETE',
    });
  }

  async runCampaign(id: string, runType: 'manual' | 'scheduled' = 'manual') {
    return this.request<any>(`/v1/campaigns/${id}/run`, {
      method: 'POST',
      body: JSON.stringify({ run_type: runType }),
    });
  }

  async getCampaignRuns(id: string) {
    return this.request<any[]>(`/v1/campaigns/${id}/runs`);
  }

  async getCampaignLeads(
    id: string,
    params?: {
      stage?: string;
      min_score?: number;
      lead_ready?: boolean;
      intent_strength?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ data: any[]; pagination: any }>(
      `/v1/campaigns/${id}/leads${query}`
    );
  }

  // Leads
  async getLeads(params?: {
    page?: number;
    limit?: number;
    lead_ready?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ data: any[]; pagination: any }>(`/v1/leads${query}`);
  }

  // Export
  async exportLeads(format: 'csv' | 'json', filters?: any) {
    const queryParams = new URLSearchParams({ format });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return this.request<any>(`/v1/export/leads?${queryParams.toString()}`);
  }

  // Campaign Brief
  async updateCampaignBrief(campaignId: string, brief: string) {
    return this.request<any>(`/v1/campaigns/${campaignId}/brief`, {
      method: 'PATCH',
      body: JSON.stringify({ client_brief: brief }),
    });
  }

  async getCampaignBrief(campaignId: string) {
    return this.request<{
      campaign_id: string;
      client_brief: string;
      targeting_profile: any;
      targeting_profile_updated_at: string;
    }>(`/v1/campaigns/${campaignId}/brief`);
  }

  async applyCampaignBrief(campaignId: string) {
    return this.request<any>(`/v1/campaigns/${campaignId}/brief/apply`, {
      method: 'POST',
    });
  }

  // Phase 12: Campaign Lifecycle
  async launchCampaign(campaignId: string) {
    return this.request<any>(`/v1/campaigns/${campaignId}/launch`, {
      method: 'POST',
    });
  }

  // Phase 12: Templates
  async getTemplates() {
    return this.request<any[]>('/v1/campaigns/templates/verticals');
  }

  async getTemplate(id: string) {
    return this.request<any>(`/v1/campaigns/templates/verticals/${id}`);
  }

  // Phase 13: Verification & Explainability
  async verifyLead(leadId: string, campaignId?: string) {
    return this.request<any>(`/v1/enrich/${leadId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ campaignId }),
    });
  }

  async getLeadExplanation(leadId: string) {
    return this.request<any>(`/v1/leads/${leadId}/explain`);
  }

  async getCampaignVerificationSummary(campaignId: string) {
    return this.request<any>(`/v1/campaigns/${campaignId}/verification-summary`);
  }

  // ============ CRM ENDPOINTS ============

  // Pipelines
  async getPipelines(clientId: string) {
    return this.request<any[]>(`/v1/clients/${clientId}/crm/pipelines`);
  }

  async createPipeline(clientId: string, data: { name: string; description?: string }) {
    return this.request<any>(`/v1/clients/${clientId}/crm/pipelines`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePipeline(clientId: string, pipelineId: string, data: any) {
    return this.request<any>(`/v1/clients/${clientId}/crm/pipelines/${pipelineId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePipeline(clientId: string, pipelineId: string) {
    return this.request<void>(`/v1/clients/${clientId}/crm/pipelines/${pipelineId}`, {
      method: 'DELETE',
    });
  }

  async getKanbanBoard(clientId: string, pipelineId: string) {
    return this.request<any>(`/v1/clients/${clientId}/crm/pipelines/${pipelineId}/board`);
  }

  // Stages
  async createStage(clientId: string, pipelineId: string, data: { name: string; position: number; color?: string }) {
    return this.request<any>(`/v1/clients/${clientId}/crm/pipelines/${pipelineId}/stages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStage(clientId: string, pipelineId: string, stageId: string, data: any) {
    return this.request<any>(`/v1/clients/${clientId}/crm/pipelines/${pipelineId}/stages/${stageId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteStage(clientId: string, pipelineId: string, stageId: string) {
    return this.request<void>(`/v1/clients/${clientId}/crm/pipelines/${pipelineId}/stages/${stageId}`, {
      method: 'DELETE',
    });
  }

  // Activities
  async getActivities(clientId: string, params?: { lead_id?: string; type?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ data: any[]; meta: any }>(`/v1/clients/${clientId}/crm/activities${query}`);
  }

  async createActivity(clientId: string, data: { lead_id?: string; type: string; title: string; content?: string; meta?: any }) {
    return this.request<any>(`/v1/clients/${clientId}/crm/activities`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteActivity(clientId: string, activityId: string) {
    return this.request<void>(`/v1/clients/${clientId}/crm/activities/${activityId}`, {
      method: 'DELETE',
    });
  }

  // Tasks
  async getTasks(clientId: string, params?: { lead_id?: string; status?: string; priority?: string }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ data: any[]; meta: any }>(`/v1/clients/${clientId}/crm/tasks${query}`);
  }

  async getCRMDueSoonTasks(clientId: string) {
    return this.request<any[]>(`/v1/clients/${clientId}/crm/tasks/due-soon`);
  }

  async getCRMOverdueTasks(clientId: string) {
    return this.request<any[]>(`/v1/clients/${clientId}/crm/tasks/overdue`);
  }

  async createTask(clientId: string, data: { lead_id?: string; title: string; description?: string; due_date?: string; priority?: string }) {
    return this.request<any>(`/v1/clients/${clientId}/crm/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(clientId: string, taskId: string, data: any) {
    return this.request<any>(`/v1/clients/${clientId}/crm/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(clientId: string, taskId: string) {
    return this.request<void>(`/v1/clients/${clientId}/crm/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // Members
  async getMembers(clientId: string) {
    return this.request<any[]>(`/v1/clients/${clientId}/crm/members`);
  }

  async addMember(clientId: string, data: { user_id: string; role: string }) {
    return this.request<any>(`/v1/clients/${clientId}/crm/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMember(clientId: string, memberId: string, data: { role: string }) {
    return this.request<any>(`/v1/clients/${clientId}/crm/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async removeMember(clientId: string, memberId: string) {
    return this.request<void>(`/v1/clients/${clientId}/crm/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  // Lead CRM Operations
  async updateLeadStage(clientId: string, leadId: string, stageId: string) {
    return this.request<any>(`/v1/clients/${clientId}/crm/leads/${leadId}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ crm_stage_id: stageId }),
    });
  }

  async updateLeadOwner(clientId: string, leadId: string, userId: string) {
    return this.request<any>(`/v1/clients/${clientId}/crm/leads/${leadId}/owner`, {
      method: 'PATCH',
      body: JSON.stringify({ owner_user_id: userId }),
    });
  }

  // ==========================================
  // PHASE 15: INBOX & WORKFLOW ENDPOINTS
  // ==========================================

  // Inbox Feed
  async getInboxFeed(clientId: string, params?: { limit?: number; type?: string; unread_only?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.unread_only) queryParams.append('unread_only', params.unread_only.toString());
    
    return this.request<any>(`/v1/clients/${clientId}/inbox?${queryParams.toString()}`);
  }

  async getUnreadCount(clientId: string) {
    return this.request<{ count: number }>(`/v1/clients/${clientId}/inbox/unread-count`);
  }

  async markInboxItemRead(clientId: string, itemId: string, is_read: boolean) {
    return this.request<any>(`/v1/clients/${clientId}/inbox/${itemId}/read`, {
      method: 'PUT',
      body: JSON.stringify({ is_read }),
    });
  }

  async starInboxItem(clientId: string, itemId: string, is_starred: boolean) {
    return this.request<any>(`/v1/clients/${clientId}/inbox/${itemId}/star`, {
      method: 'PUT',
      body: JSON.stringify({ is_starred }),
    });
  }

  async markAllInboxRead(clientId: string) {
    return this.request<any>(`/v1/clients/${clientId}/inbox/mark-all-read`, {
      method: 'POST',
    });
  }

  async deleteInboxItem(clientId: string, itemId: string) {
    return this.request<any>(`/v1/clients/${clientId}/inbox/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Tasks
  async getTodayTasks(clientId: string) {
    return this.request<any>(`/v1/clients/${clientId}/inbox/tasks/today`);
  }

  async getUpcomingTasks(clientId: string) {
    return this.request<any>(`/v1/clients/${clientId}/inbox/tasks/upcoming`);
  }

  async getOverdueTasks(clientId: string) {
    return this.request<any>(`/v1/clients/${clientId}/inbox/tasks/overdue`);
  }

  async completeTask(clientId: string, taskId: string, data: { outcome?: string; notes?: string }) {
    return this.request<any>(`/v1/clients/${clientId}/inbox/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async snoozeTask(clientId: string, taskId: string, snooze_until: string) {
    return this.request<any>(`/v1/clients/${clientId}/inbox/tasks/${taskId}/snooze`, {
      method: 'PUT',
      body: JSON.stringify({ snooze_until }),
    });
  }

  async reassignTask(clientId: string, taskId: string, assigned_to_user_id: string) {
    return this.request<any>(`/v1/clients/${clientId}/inbox/tasks/${taskId}/reassign`, {
      method: 'PUT',
      body: JSON.stringify({ assigned_to_user_id }),
    });
  }

  // SLA Metrics
  async getSLAMetrics(clientId: string) {
    return this.request<any>(`/v1/clients/${clientId}/inbox/sla/metrics`);
  }

  async getOverdueLeads(clientId: string) {
    return this.request<any>(`/v1/clients/${clientId}/inbox/sla/overdue-leads`);
  }
}

// Singleton instance
export const apiClient = new APIClient();
