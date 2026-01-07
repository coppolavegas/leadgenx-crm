'use client';

import { Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, Clock, AlertCircle, Phone, Mail, Video, Search } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface TasksListProps {
  tasks: Task[];
  title: string;
  onComplete: (taskId: string, data: { outcome?: string; notes?: string }) => void;
  onSnooze: (taskId: string, snooze_until: string) => void;
}

const TASK_TYPE_ICONS = {
  follow_up: CheckCircle,
  call: Phone,
  email: Mail,
  meeting: Video,
  research: Search,
  other: Clock,
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-red-100 text-red-800',
};

export function TasksList({ tasks, title, onComplete, onSnooze }: TasksListProps) {
  if (tasks.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No tasks found</h3>
          <p className="text-sm text-muted-foreground">You're all caught up!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task) => {
          const Icon = TASK_TYPE_ICONS[task.type];
          const isOverdue = task.due_date && new Date(task.due_date) < new Date();

          return (
            <div
              key={task.id}
              className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
            >
              {/* Checkbox */}
              <Checkbox
                checked={task.status === 'completed'}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onComplete(task.id, { outcome: 'completed' });
                  }
                }}
                className="mt-1"
              />

              {/* Icon */}
              <div className="flex-shrink-0 text-muted-foreground">
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className={PRIORITY_COLORS[task.priority]}>
                        {task.priority}
                      </Badge>
                      {task.lead && (
                        <Badge variant="default" className="text-xs">
                          {task.lead.name}
                        </Badge>
                      )}
                      {task.due_date && (
                        <span
                          className={`text-xs ${
                            isOverdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'
                          }`}
                        >
                          {isOverdue ? '⚠️ ' : ''}
                          Due {format(new Date(task.due_date), 'MMM d, h:mm a')}
                        </span>
                      )}
                      {task.auto_created && (
                        <Badge variant="default" className="text-xs">
                          Auto-created
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        onSnooze(task.id, tomorrow.toISOString());
                      }}
                    >
                      Snooze
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onComplete(task.id, { outcome: 'completed' })}
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
