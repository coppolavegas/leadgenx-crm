'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, CheckCircle2, FileText, Send } from 'lucide-react';
import type { CRMPipeline, CRMStage } from '@/lib/types';

interface LeadCard {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  verified_count: number;
  preference_count: number;
  score: number;
  stage_id: string;
}

export default function PipelinePage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;
  
  const [pipeline, setPipeline] = useState<CRMPipeline | null>(null);
  const [stages, setStages] = useState<(CRMStage & { leads: LeadCard[] })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPipeline();
  }, [clientId]);

  const fetchPipeline = async () => {
    try {
      setLoading(true);
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://leadgenx.app';
      const token = localStorage.getItem('auth_token');

      // Fetch pipeline and board data
      const response = await fetch(`${API_BASE}/crm/${clientId}/pipelines?default=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch pipeline');
      
      const pipelines = await response.json();
      const defaultPipeline = pipelines.find((p: CRMPipeline) => p.is_default) || pipelines[0];

      if (defaultPipeline) {
        setPipeline(defaultPipeline);
        
        // Fetch board view
        const boardResponse = await fetch(`${API_BASE}/crm/${clientId}/pipelines/${defaultPipeline.id}/board`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (boardResponse.ok) {
          const board = await boardResponse.json();
          setStages(board.stages || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveStage = async (leadId: string, newStageId: string) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://leadgenx.app';
      const token = localStorage.getItem('auth_token');

      await fetch(`${API_BASE}/crm/${clientId}/leads/${leadId}/stage`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stage_id: newStageId })
      });

      // Refresh pipeline
      fetchPipeline();
    } catch (error) {
      console.error('Failed to move lead:', error);
    }
  };

  const handleViewLead = (leadId: string) => {
    router.push(`/crm/${clientId}/leads/${leadId}`);
  };

  const handleSendToAutoGenX = (leadId: string) => {
    // TODO: Implement AutoGenX integration
    alert(`Send lead ${leadId} to AutoGenX - Coming soon!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#6E4AFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] p-6">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6E4AFF] rounded-full blur-[128px] opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4DE3FF] rounded-full blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#EDEEF2] mb-2">
            {pipeline?.name || 'Sales Pipeline'}
          </h1>
          <p className="text-[#8B90A0]">
            Manage your leads through each stage of the sales process
          </p>
        </div>

        {/* Pipeline Board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {stages.map((stage) => (
              <div key={stage.id} className="w-80 flex-shrink-0">
                <GlassPanel intensity="medium" className="p-4">
                  {/* Stage Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#EDEEF2]">{stage.name}</h3>
                      <p className="text-xs text-[#8B90A0]">{stage.leads?.length || 0} leads</p>
                    </div>
                    {stage.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                    )}
                  </div>

                  {/* Leads */}
                  <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                    {stage.leads && stage.leads.length > 0 ? (
                      stage.leads.map((lead) => (
                        <GlassPanel
                          key={lead.id}
                          intensity="strong"
                          className="p-3 cursor-pointer hover:border-[#6E4AFF]/50 transition-all"
                          onClick={() => handleViewLead(lead.id)}
                        >
                          {/* Lead Header */}
                          <div className="mb-2">
                            <h4 className="text-sm font-bold text-[#EDEEF2] mb-1">{lead.name}</h4>
                            {lead.company && (
                              <p className="text-xs text-[#8B90A0]">{lead.company}</p>
                            )}
                          </div>

                          {/* Match Badges */}
                          <div className="flex gap-2 mb-2">
                            {lead.verified_count > 0 && (
                              <Badge variant="success" className="text-xs gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {lead.verified_count}
                              </Badge>
                            )}
                            {lead.preference_count > 0 && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <FileText className="w-3 h-3" />
                                {lead.preference_count}
                              </Badge>
                            )}
                          </div>

                          {/* Score */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-[#8B90A0]">Match Score</span>
                            <span className="text-sm font-bold text-[#6E4AFF]">{Math.round(lead.score)}</span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendToAutoGenX(lead.id);
                              }}
                              className="flex-1 gap-1 text-xs"
                            >
                              <Send className="w-3 h-3" />
                              AutoGenX
                            </Button>
                          </div>

                          {/* Move to Stage Dropdown */}
                          <select
                            value={stage.id}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleMoveStage(lead.id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 w-full text-xs rounded-md border border-input bg-transparent px-2 py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            {stages.map((s) => (
                              <option key={s.id} value={s.id}>
                                Move to {s.name}
                              </option>
                            ))}
                          </select>
                        </GlassPanel>
                      ))
                    ) : (
                      <div className="text-center py-8 text-[#8B90A0] text-sm">
                        No leads in this stage
                      </div>
                    )}
                  </div>

                  {/* Add Lead Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 gap-2"
                    onClick={() => alert('Add lead to ' + stage.name)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Lead
                  </Button>
                </GlassPanel>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}