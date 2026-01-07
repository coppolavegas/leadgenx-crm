'use client';

import { SLAMetrics } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, TrendingUp, Users } from 'lucide-react';

interface SLAWidgetProps {
  metrics: SLAMetrics;
}

export function SLAWidget({ metrics }: SLAWidgetProps) {
  const stats = [
    {
      title: 'Total Leads',
      value: metrics.total_leads,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'With SLA',
      value: metrics.leads_with_sla,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Overdue',
      value: metrics.overdue_count,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Overdue %',
      value: `${metrics.overdue_percentage.toFixed(1)}%`,
      icon: TrendingUp,
      color:
        metrics.overdue_percentage > 20
          ? 'text-red-600'
          : metrics.overdue_percentage > 10
          ? 'text-orange-600'
          : 'text-green-600',
      bgColor:
        metrics.overdue_percentage > 20
          ? 'bg-red-100'
          : metrics.overdue_percentage > 10
          ? 'bg-orange-100'
          : 'bg-green-100',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>SLA Performance</CardTitle>
        <CardDescription>
          Response time tracking and lead engagement metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-4 rounded-lg border bg-card"
              >
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional metrics */}
        {metrics.avg_response_time_hours !== null && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-lg font-semibold">
                  {metrics.avg_response_time_hours.toFixed(1)} hours
                </p>
              </div>
              {metrics.median_response_time_hours !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">Median Response Time</p>
                  <p className="text-lg font-semibold">
                    {metrics.median_response_time_hours.toFixed(1)} hours
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
