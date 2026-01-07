'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { CRMActivity } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  CheckCircle2,
  ArrowRight,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivitiesFeedProps {
  clientId: string;
  leadId?: string;
  limit?: number;
}

const activityIcons: Record<string, any> = {
  note: MessageSquare,
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task_completed: CheckCircle2,
  stage_changed: ArrowRight,
  owner_changed: User,
};

const activityColors: Record<string, string> = {
  note: 'bg-blue-100 text-blue-700',
  call: 'bg-green-100 text-green-700',
  email: 'bg-purple-100 text-purple-700',
  meeting: 'bg-orange-100 text-orange-700',
  task_completed: 'bg-emerald-100 text-emerald-700',
  stage_changed: 'bg-indigo-100 text-indigo-700',
  owner_changed: 'bg-amber-100 text-amber-700',
};

export function ActivitiesFeed({ clientId, leadId, limit = 20 }: ActivitiesFeedProps) {
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadActivities();
  }, [clientId, leadId, page]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (leadId) params.lead_id = leadId;

      const response = await apiClient.getActivities(clientId, params);
      setActivities(response.data);
      setHasMore(response.meta.page < response.meta.totalPages);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && page === 1) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        {leadId && (
          <Button variant="outline" size="sm">
            View All
          </Button>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>No activity yet</p>
          <p className="text-sm">Activities will appear here as you interact with leads</p>
        </div>
      ) : (
        <>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </ScrollArea>

          {hasMore && (
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setPage(page + 1)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function ActivityItem({ activity }: { activity: CRMActivity }) {
  const Icon = activityIcons[activity.type] || MessageSquare;
  const colorClass = activityColors[activity.type] || 'bg-gray-100 text-gray-700';

  return (
    <div className="flex gap-3">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm">{activity.title}</h4>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </span>
        </div>
        {activity.content && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{activity.content}</p>
        )}
        {activity.lead && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              {activity.lead.company_name || activity.lead.name}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
