'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { InboxItem, Task, SLAMetrics } from '@/lib/types';
import { InboxFeed } from '@/components/inbox/inbox-feed';
import { TasksList } from '@/components/inbox/tasks-list';
import { SLAWidget } from '@/components/inbox/sla-widget';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Inbox, ListTodo, Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function InboxPage() {
  const params = useParams();
  const clientId = params?.clientId as string;

  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [slaMetrics, setSlaMetrics] = useState<SLAMetrics | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inbox, today, upcoming, overdue, sla, unread] = await Promise.all([
        apiClient.getInboxFeed(clientId, { limit: 50 }),
        apiClient.getTodayTasks(clientId),
        apiClient.getUpcomingTasks(clientId),
        apiClient.getOverdueTasks(clientId),
        apiClient.getSLAMetrics(clientId),
        apiClient.getUnreadCount(clientId),
      ]);

      setInboxItems(inbox);
      setTodayTasks(today);
      setUpcomingTasks(upcoming);
      setOverdueTasks(overdue);
      setSlaMetrics(sla);
      setUnreadCount(unread.count);
    } catch (error) {
      console.error('Error loading inbox data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      loadData();
    }
  }, [clientId]);

  const handleMarkRead = async (itemId: string, is_read: boolean) => {
    try {
      await apiClient.markInboxItemRead(clientId, itemId, is_read);
      loadData(); // Refresh
    } catch (error) {
      console.error('Error marking item:', error);
    }
  };

  const handleStarItem = async (itemId: string, is_starred: boolean) => {
    try {
      await apiClient.starInboxItem(clientId, itemId, is_starred);
      loadData(); // Refresh
    } catch (error) {
      console.error('Error starring item:', error);
    }
  };

  const handleCompleteTask = async (taskId: string, data: { outcome?: string; notes?: string }) => {
    try {
      await apiClient.completeTask(clientId, taskId, data);
      loadData(); // Refresh
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleSnoozeTask = async (taskId: string, snooze_until: string) => {
    try {
      await apiClient.snoozeTask(clientId, taskId, snooze_until);
      loadData(); // Refresh
    } catch (error) {
      console.error('Error snoozing task:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox & Workflow</h1>
          <p className="text-muted-foreground">Manage your daily tasks and lead responses</p>
        </div>
        <Button onClick={loadData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* SLA Metrics Widget */}
      {slaMetrics && <SLAWidget metrics={slaMetrics} />}

      {/* Main Content */}
      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Inbox
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="today" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Today
            {todayTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {todayTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Upcoming
            {upcomingTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {upcomingTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Overdue
            {overdueTasks.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {overdueTasks.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <InboxFeed
            items={inboxItems}
            onMarkRead={handleMarkRead}
            onStar={handleStarItem}
          />
        </TabsContent>

        <TabsContent value="today">
          <TasksList
            tasks={todayTasks}
            title="Today's Tasks"
            onComplete={handleCompleteTask}
            onSnooze={handleSnoozeTask}
          />
        </TabsContent>

        <TabsContent value="upcoming">
          <TasksList
            tasks={upcomingTasks}
            title="Upcoming Tasks"
            onComplete={handleCompleteTask}
            onSnooze={handleSnoozeTask}
          />
        </TabsContent>

        <TabsContent value="overdue">
          <TasksList
            tasks={overdueTasks}
            title="Overdue Tasks"
            onComplete={handleCompleteTask}
            onSnooze={handleSnoozeTask}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
