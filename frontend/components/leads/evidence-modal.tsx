'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/api-client';
import { LeadExplanation } from '@/lib/types';
import {
  CheckCircle2,
  FileText,
  ExternalLink,
  AlertCircle,
  Loader2,
  TrendingUp,
  Award,
} from 'lucide-react';

interface EvidenceModalProps {
  leadId: string;
  leadName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EvidenceModal({
  leadId,
  leadName,
  open,
  onOpenChange,
}: EvidenceModalProps) {
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState<LeadExplanation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadExplanation();
    }
  }, [open, leadId]);

  const loadExplanation = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getLeadExplanation(leadId);
      setExplanation(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load explanation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Lead Verification Report
          </DialogTitle>
          <DialogDescription>{leadName}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading explanation...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <p className="text-destructive font-medium">{error}</p>
            <Button onClick={loadExplanation} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        ) : explanation ? (
          <div className="space-y-6">
            {/* Score Breakdown */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Score Breakdown
                </h3>
                <div className="text-2xl font-bold text-primary">
                  {explanation.scoring_breakdown.total.toFixed(1)}
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>

              <div className="space-y-2">
                <ScoreRow
                  label="Verified Features"
                  value={explanation.scoring_breakdown.verified}
                  color="bg-green-500"
                />
                <ScoreRow
                  label="Preference Matches"
                  value={explanation.scoring_breakdown.preference}
                  color="bg-blue-500"
                />
                <ScoreRow
                  label="Intent Signals"
                  value={explanation.scoring_breakdown.intent}
                  color="bg-purple-500"
                />
                <ScoreRow
                  label="Freshness"
                  value={explanation.scoring_breakdown.freshness}
                  color="bg-orange-500"
                />
              </div>
            </div>

            <Separator />

            {/* Verified Features */}
            {explanation.verified_features.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Verified Features ({explanation.verified_features.length})
                </h3>
                <div className="space-y-3">
                  {explanation.verified_features.map((feature, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20">
                          {feature.feature}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ✓ Verified
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground italic mb-2">
                        "{feature.evidence_snippet}"
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-xs"
                        asChild
                      >
                        <a
                          href={feature.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View source
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preference Features */}
            {explanation.preference_features.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  Preference Matches ({explanation.preference_features.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {explanation.preference_features.map((feature, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900"
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  These features are desired but not yet confirmed by website crawl data
                </p>
              </div>
            )}

            {/* Exclusions */}
            {explanation.exclusions_triggered.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center text-destructive">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Exclusions Triggered
                </h3>
                <div className="flex flex-wrap gap-2">
                  {explanation.exclusions_triggered.map((exclusion, index) => (
                    <Badge key={index} variant="destructive">
                      {exclusion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {explanation.verified_features.length === 0 &&
              explanation.preference_features.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No feature matches available for this lead
                  </p>
                </div>
              )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ScoreRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toFixed(1)}</span>
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
