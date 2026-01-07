'use client';

import { WizardData } from '@/app/campaigns/new/page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, MapPin, Target, Sliders, Rocket } from 'lucide-react';

interface Props {
  data: WizardData;
  onSaveDraft: () => void;
  onLaunch: () => void;
  onLaunchAndRun: () => void;
  saving: boolean;
}

export function WizardStep5({ data, onSaveDraft, onLaunch, onLaunchAndRun, saving }: Props) {
  const getPercentage = (value: number) => {
    const totalWeight =
      data.scoring_weights.phone_weight +
      data.scoring_weights.email_weight +
      data.scoring_weights.form_weight +
      data.scoring_weights.intent_weight +
      data.scoring_weights.freshness_weight;
    return totalWeight > 0 ? Math.round((value / totalWeight) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Launch</h2>
        <p className="text-muted-foreground">
          Review your campaign settings and launch when ready
        </p>
      </div>

      {/* Campaign Overview */}
      <Card className="p-6 border-2">
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Campaign Basics</h3>
            </div>
            <dl className="space-y-2 ml-7">
              <div className="flex gap-2">
                <dt className="text-sm text-muted-foreground w-24">Name:</dt>
                <dd className="text-sm font-medium">{data.name}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-sm text-muted-foreground w-24">Vertical:</dt>
                <dd className="text-sm font-medium">{data.vertical}</dd>
              </div>
            </dl>
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Target Location</h3>
            </div>
            <div className="ml-7">
              <p className="text-sm font-medium">
                {data.geo_city}, {data.geo_state}, {data.geo_country}
              </p>
              <p className="text-sm text-muted-foreground">
                Within {data.geo_radius_miles}-mile radius
              </p>
            </div>
          </div>

          {/* Sources & Discovery */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Sources & Discovery</h3>
            </div>
            <div className="ml-7 space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Active Sources:</p>
                <div className="flex gap-2">
                  {data.sources_google_places && <Badge>Google Places</Badge>}
                  {data.sources_reddit_intent && <Badge>Reddit Intent</Badge>}
                  {!data.sources_google_places && !data.sources_reddit_intent && (
                    <Badge variant="secondary">None</Badge>
                  )}
                </div>
              </div>

              {data.discovery_config.keywords.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Top Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.discovery_config.keywords.slice(0, 5).map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {data.discovery_config.keywords.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{data.discovery_config.keywords.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {data.discovery_config.negative_keywords.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Negative Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.discovery_config.negative_keywords.slice(0, 5).map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-red-50">
                        {keyword}
                      </Badge>
                    ))}
                    {data.discovery_config.negative_keywords.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{data.discovery_config.negative_keywords.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Min Rating:</span>{' '}
                  <span className="font-medium">{data.discovery_config.min_rating}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Min Reviews:</span>{' '}
                  <span className="font-medium">{data.discovery_config.min_reviews}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scoring Priorities */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Scoring Priorities</h3>
            </div>
            <div className="ml-7">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Phone:</span>{' '}
                  <span className="font-medium">{getPercentage(data.scoring_weights.phone_weight)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>{' '}
                  <span className="font-medium">{getPercentage(data.scoring_weights.email_weight)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Form:</span>{' '}
                  <span className="font-medium">{getPercentage(data.scoring_weights.form_weight)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Intent:</span>{' '}
                  <span className="font-medium">{getPercentage(data.scoring_weights.intent_weight)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <Button onClick={onLaunch} size="lg" disabled={saving} className="w-full">
            <Rocket className="w-5 h-5 mr-2" />
            {saving ? 'Launching...' : 'Launch Campaign'}
          </Button>

          <Button
            onClick={onLaunchAndRun}
            size="lg"
            disabled={saving}
            variant="default"
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Rocket className="w-5 h-5 mr-2" />
            {saving ? 'Launching...' : 'Launch & Run Now'}
          </Button>

          <Button onClick={onSaveDraft} size="lg" disabled={saving} variant="outline" className="w-full">
            {saving ? 'Saving...' : 'Save as Draft'}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-1 text-center">
          <p>🚀 <strong>Launch Campaign</strong> activates the campaign (status: active)</p>
          <p>⚡ <strong>Launch & Run Now</strong> activates and immediately starts lead discovery</p>
          <p>💾 <strong>Save as Draft</strong> saves your progress without launching</p>
        </div>
      </div>
    </div>
  );
}
