'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { CRMTask } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

interface TasksManagerProps {
  clientId: string;
  leadId?: string;
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-red-100 text-red-700',
};

export function TasksManager({ clientId, leadId }: TasksManagerProps) {
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [dueSoonTasks, setDueSoonTasks] = useState<CRMTask[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<CRMTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadTasks();
  }, [clientId, leadId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (leadId) params.lead_id = leadId;

      const [allTasks, dueSoon, overdue] = await Promise.all([
        apiClient.getTasks(clientId, params),
        apiClient.getCRMDueSoonTasks(clientId),
        apiClient.getCRMOverdueTasks(clientId),
      ]);

      setTasks(allTasks.data);
      setDueSoonTasks(dueSoon);
      setOverdueTasks(overdue);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      await apiClient.updateTask(clientId, taskId, {
        status: completed ? 'completed' : 'pending',
      });
      loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Tasks</h3>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All <Badge className="ml-1">{tasks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue <Badge className="ml-1 bg-red-500">{overdueTasks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="due-soon">
            Due Soon <Badge className="ml-1 bg-orange-500">{dueSoonTasks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Done
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {tasks.length === 0 ? (
            <EmptyState message="No tasks yet" />
          ) : (
            tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-3 mt-4">
          {overdueTasks.length === 0 ? (
            <EmptyState message="No overdue tasks" icon="🎉" />
          ) : (
            overdueTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                highlight="overdue"
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="due-soon" className="space-y-3 mt-4">
          {dueSoonTasks.length === 0 ? (
            <EmptyState message="No upcoming tasks" />
          ) : (
            dueSoonTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                highlight="due-soon"
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3 mt-4">
          {tasks.filter(t => t.status === 'completed').length === 0 ? (
            <EmptyState message="No completed tasks" />
          ) : (
            tasks
              .filter(t => t.status === 'completed')
              .map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                />
              ))
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}

interface TaskItemProps {
  task: CRMTask;
  onToggle: (taskId: string, completed: boolean) => void;
  highlight?: 'overdue' | 'due-soon';
}

function TaskItem({ task, onToggle, highlight }: TaskItemProps) {
  const isCompleted = task.status === 'completed';
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  
  let dueDateLabel = '';
  let dueDateColor = 'text-gray-600';
  
  if (dueDate) {
    if (isPast(dueDate) && !isCompleted) {
      dueDateLabel = 'Overdue';
      dueDateColor = 'text-red-600';
    } else if (isToday(dueDate)) {
      dueDateLabel = 'Today';
      dueDateColor = 'text-orange-600';
    } else if (isTomorrow(dueDate)) {
      dueDateLabel = 'Tomorrow';
      dueDateColor = 'text-blue-600';
    } else {
      dueDateLabel = format(dueDate, 'MMM d');
    }
  }

  return (
    <div
      className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
        highlight === 'overdue' ? 'border-red-200 bg-red-50' : ''
      } ${
        highlight === 'due-soon' ? 'border-orange-200 bg-orange-50' : ''
      } ${
        isCompleted ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) => onToggle(task.id, Boolean(checked))}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`font-medium ${isCompleted ? 'line-through' : ''}`}>
              {task.title}
            </h4>
            {task.priority && (
              <Badge className={priorityColors[task.priority] || ''}>
                {task.priority}
              </Badge>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs">
            {dueDate && (
              <div className={`flex items-center gap-1 ${dueDateColor}`}>
                <Calendar className="h-3 w-3" />
                <span>{dueDateLabel}</span>
              </div>
            )}
            {task.lead && (
              <Badge variant="secondary" className="text-xs">
                {task.lead.company_name || task.lead.name}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message, icon = '📋' }: { message: string; icon?: string }) {
  return (
    <div className="text-center py-8 text-gray-500">
      <div className="text-4xl mb-2">{icon}</div>
      <p>{message}</p>
    </div>
  );
}
