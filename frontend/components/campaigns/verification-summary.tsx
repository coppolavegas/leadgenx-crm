'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/api-client';
import { CampaignVerificationSummary } from '@/lib/types';
import {
  CheckCircle2,
  TrendingUp,
  Users,
  Award,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface VerificationSummaryProps {
  campaignId: string;
}

export function VerificationSummaryWidget({ campaignId }: VerificationSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CampaignVerificationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, [campaignId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getCampaignVerificationSummary(campaignId);
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load verification summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Verification Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            Verification Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.total_leads === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Verification Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No enriched leads available for verification summary
          </p>
        </CardContent>
      </Card>
    );
  }

  const verificationRate = ((summary.verified_leads / summary.total_leads) * 100).toFixed(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Award className="h-5 w-5 mr-2 text-primary" />
          Verification Summary
        </CardTitle>
        <CardDescription>
          Trust metrics for {summary.campaign_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            icon={Users}
            label="Total Leads"
            value={summary.total_leads}
            color="text-blue-500"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Verified Leads"
            value={summary.verified_leads}
            subtext={`${verificationRate}% verified`}
            color="text-green-500"
          />
        </div>

        {/* Score Averages */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              Average Scores
            </span>
          </div>
          <ScoreBar
            label="Verified Score"
            value={summary.avg_verified_score}
            color="bg-green-500"
          />
          <ScoreBar
            label="Preference Score"
            value={summary.avg_preference_score}
            color="bg-blue-500"
          />
          <ScoreBar
            label="Final Score"
            value={summary.avg_final_score}
            color="bg-primary"
            bold
          />
        </div>

        {/* Top Verified Features */}
        {summary.top_verified_features.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Top Verified Features</h4>
            <div className="space-y-2">
              {summary.top_verified_features.slice(0, 5).map((feature, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900"
                  >
                    {feature.feature}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {feature.count} leads
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exclusions */}
        {summary.exclusion_stats.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3 text-destructive">Exclusions Triggered</h4>
            <div className="space-y-2">
              {summary.exclusion_stats.map((exclusion, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Badge variant="destructive">{exclusion.feature}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {exclusion.count} leads rejected
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  subtext?: string;
  color: string;
}) {
  return (
    <div className="flex flex-col space-y-1 p-3 rounded-lg border bg-card">
      <div className="flex items-center space-x-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
    </div>
  );
}

function ScoreBar({
  label,
  value,
  color,
  bold = false,
}: {
  label: string;
  value: number;
  color: string;
  bold?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className={bold ? 'font-semibold' : 'text-muted-foreground'}>{label}</span>
        <span className={bold ? 'font-bold' : 'font-medium'}>{value.toFixed(1)}</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
