'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { KanbanBoard as KanbanBoardType, CRMStage } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, MoreVertical } from 'lucide-react';

interface KanbanBoardProps {
  clientId: string;
  pipelineId: string;
}

export function KanbanBoard({ clientId, pipelineId }: KanbanBoardProps) {
  const [board, setBoard] = useState<KanbanBoardType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoard();
  }, [clientId, pipelineId]);

  const loadBoard = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getKanbanBoard(clientId, pipelineId);
      setBoard(data);
    } catch (error) {
      console.error('Failed to load kanban board:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-80">
            <div className="h-96 bg-gray-200 animate-pulse rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!board || board.stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Pipeline Stages</h3>
          <p className="text-gray-600 mb-4">Create stages to start organizing your leads</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Stage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{board.pipeline.name}</h2>
          {board.pipeline.description && (
            <p className="text-gray-600">{board.pipeline.description}</p>
          )}
        </div>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Stage
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.stages.map((stage) => (
          <StageColumn key={stage.id} stage={stage} clientId={clientId} />
        ))}
      </div>
    </div>
  );
}

interface StageColumnProps {
  stage: CRMStage & { leads: any[]; leads_count: number };
  clientId: string;
}

function StageColumn({ stage, clientId }: StageColumnProps) {
  return (
    <div className="flex-shrink-0 w-80">
      <Card className="h-full">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stage.color || '#gray' }}
              />
              <h3 className="font-semibold">{stage.name}</h3>
            </div>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{stage.leads_count} leads</span>
          </div>
        </div>

        <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
          {stage.leads && stage.leads.length > 0 ? (
            stage.leads.map((lead: any) => (
              <LeadCard key={lead.id} lead={lead} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No leads in this stage</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <Button variant="ghost" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </Card>
    </div>
  );
}

function LeadCard({ lead }: { lead: any }) {
  return (
    <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm">{lead.company_name || lead.name}</h4>
          {lead.campaign_score && (
            <Badge variant="secondary" className="text-xs">
              {Math.round(lead.campaign_score)}
            </Badge>
          )}
        </div>
        {lead.email && (
          <p className="text-xs text-gray-600 truncate">{lead.email}</p>
        )}
        {lead.phone && (
          <p className="text-xs text-gray-600">{lead.phone}</p>
        )}
        {lead.next_task_due_at && (
          <div className="flex items-center gap-1 text-xs text-orange-600">
            <span>📅</span>
            <span>{new Date(lead.next_task_due_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
