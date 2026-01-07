'use client';

import { InboxItem } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, MailOpen, Star, CheckCircle, AlertCircle, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface InboxFeedProps {
  items: InboxItem[];
  onMarkRead: (itemId: string, is_read: boolean) => void;
  onStar: (itemId: string, is_starred: boolean) => void;
}

const ITEM_ICONS = {
  reply: Mail,
  task_due: CheckCircle,
  task_overdue: AlertCircle,
  lead_update: Bell,
  sla_warning: AlertCircle,
};

const ITEM_COLORS = {
  reply: 'text-blue-600',
  task_due: 'text-green-600',
  task_overdue: 'text-red-600',
  lead_update: 'text-purple-600',
  sla_warning: 'text-orange-600',
};

export function InboxFeed({ items, onMarkRead, onStar }: InboxFeedProps) {
  if (items.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Your inbox is empty</h3>
          <p className="text-sm text-muted-foreground">No new items to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {items.map((item) => {
        const Icon = ITEM_ICONS[item.type];
        const iconColor = ITEM_COLORS[item.type];

        return (
          <Card
            key={item.id}
            className={`transition-all hover:shadow-md ${
              !item.is_read ? 'border-l-4 border-l-indigo-500 bg-indigo-50/50' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      {item.body && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.body}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {item.lead && (
                          <Badge variant="default" className="text-xs">
                            {item.lead.name}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkRead(item.id, !item.is_read)}
                        className="h-8 w-8 p-0"
                      >
                        {item.is_read ? (
                          <MailOpen className="h-4 w-4" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onStar(item.id, !item.is_starred)}
                        className="h-8 w-8 p-0"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            item.is_starred ? 'fill-yellow-400 text-yellow-400' : ''
                          }`}
                        />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
