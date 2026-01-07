'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { CRMPipeline, Client } from '@/lib/types';
import { ClientSwitcher } from '@/components/crm/client-switcher';
import { KanbanBoard } from '@/components/crm/kanban-board';
import { ActivitiesFeed } from '@/components/crm/activities-feed';
import { TasksManager } from '@/components/crm/tasks-manager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, LayoutGrid, List, CheckSquare, Users } from 'lucide-react';

export default function CRMDashboard() {
  const params = useParams();
  const clientId = params.clientId as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [pipelines, setPipelines] = useState<CRMPipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const [clientData, pipelinesData] = await Promise.all([
        apiClient.getClient(clientId),
        apiClient.getPipelines(clientId),
      ]);
      
      setClient(clientData);
      setPipelines(pipelinesData);
      
      // Select first pipeline or default pipeline
      if (pipelinesData.length > 0) {
        const defaultPipeline = pipelinesData.find(p => p.is_default) || pipelinesData[0];
        setSelectedPipeline(defaultPipeline.id);
      }
    } catch (error) {
      console.error('Failed to load client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePipeline = async () => {
    try {
      const newPipeline = await apiClient.createPipeline(clientId, {
        name: 'Sales Pipeline',
        description: 'Main sales process',
      });
      setPipelines([...pipelines, newPipeline]);
      setSelectedPipeline(newPipeline.id);
    } catch (error) {
      console.error('Failed to create pipeline:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-10 bg-gray-200 rounded w-64 animate-pulse" />
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <ClientSwitcher selectedClientId={clientId} />
          {client && (
            <p className="text-sm text-gray-600">
              {client.industry} • {client.website}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Team
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="board" className="w-full">
        <TabsList>
          <TabsTrigger value="board">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckSquare className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="activity">
            <List className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-6">
          {pipelines.length === 0 ? (
            <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No Pipelines Yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first sales pipeline to start organizing leads
                </p>
                <Button onClick={handleCreatePipeline}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Pipeline
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pipeline Selector */}
              {pipelines.length > 1 && (
                <div className="flex gap-2">
                  {pipelines.map((pipeline) => (
                    <Button
                      key={pipeline.id}
                      variant={selectedPipeline === pipeline.id ? 'default' : 'outline'}
                      onClick={() => setSelectedPipeline(pipeline.id)}
                    >
                      {pipeline.name}
                    </Button>
                  ))}
                </div>
              )}

              {/* Kanban Board */}
              {selectedPipeline && (
                <KanbanBoard
                  clientId={clientId}
                  pipelineId={selectedPipeline}
                />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <TasksManager clientId={clientId} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivitiesFeed clientId={clientId} />
            <div className="space-y-6">
              <TasksManager clientId={clientId} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
