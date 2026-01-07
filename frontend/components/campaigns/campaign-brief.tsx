'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/api-client';
import { TargetingProfile } from '@/lib/types';
import { 
  Sparkles, 
  Target, 
  CheckCircle2, 
  X, 
  TrendingUp, 
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CampaignBriefProps {
  campaignId: string;
  initialBrief?: string;
  initialProfile?: TargetingProfile;
  onUpdate?: () => void;
}

export function CampaignBrief({ campaignId, initialBrief, initialProfile, onUpdate }: CampaignBriefProps) {
  const [brief, setBrief] = useState(initialBrief || '');
  const [profile, setProfile] = useState<TargetingProfile | null>(initialProfile || null);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (initialBrief) setBrief(initialBrief);
    if (initialProfile) setProfile(initialProfile);
  }, [initialBrief, initialProfile]);

  const handleSave = async () => {
    if (!brief.trim()) {
      setError('Brief cannot be empty');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const result = await apiClient.updateCampaignBrief(campaignId, brief.trim());
      setProfile(result.targeting_profile);
      setSuccess('Brief saved and analyzed successfully!');
      if (onUpdate) onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save brief');
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async () => {
    if (!profile) {
      setError('No targeting profile to apply. Save a brief first.');
      return;
    }

    try {
      setApplying(true);
      setError('');
      setSuccess('');
      await apiClient.applyCampaignBrief(campaignId);
      setSuccess('Targeting applied to campaign settings!');
      if (onUpdate) onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to apply targeting');
    } finally {
      setApplying(false);
    }
  };

  const confidenceColor = profile
    ? profile.confidence_score >= 0.8
      ? 'text-green-500'
      : profile.confidence_score >= 0.6
      ? 'text-yellow-500'
      : 'text-orange-500'
    : '';

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </motion.div>
      )}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 rounded-md bg-green-500/10 p-3 text-sm text-green-500"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{success}</span>
        </motion.div>
      )}

      {/* Brief Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Campaign Brief</span>
          </CardTitle>
          <CardDescription>
            Describe what kind of leads you're looking for in natural language. Our AI will extract targeting preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full min-h-[200px] p-4 rounded-md border bg-background resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Example:\n\nLooking for recording studios in Los Angeles. Must have professional equipment and mixing services. Prefer studios with in-house engineers. Need contact email and phone. Avoid home studios or hobbyist setups.\n\nBonus points for studios with recent client work and good reviews."
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
          <div className="flex space-x-3">
            <Button
              onClick={handleSave}
              disabled={saving || !brief.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save & Analyze
                </>
              )}
            </Button>
            {profile && (
              <Button
                variant="outline"
                onClick={handleApply}
                disabled={applying}
              >
                {applying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Apply to Campaign
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Targeting Profile */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span>Extracted Targeting Profile</span>
                  </CardTitle>
                  <CardDescription>
                    AI-generated targeting preferences from your brief
                  </CardDescription>
                </div>
                <Badge className={confidenceColor}>
                  {(profile.confidence_score * 100).toFixed(0)}% confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Must-Have Features */}
              {profile.must_have_features.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Must-Have Features
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.must_have_features.map((feature, i) => (
                      <Badge key={i} variant="default">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Nice-to-Have Features */}
              {profile.nice_to_have_features.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                    Nice-to-Have Features
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.nice_to_have_features.map((feature, i) => (
                      <Badge key={i} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Excluded Features */}
              {profile.excluded_features.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center">
                    <X className="h-4 w-4 mr-2 text-red-500" />
                    Excluded Features
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.excluded_features.map((feature, i) => (
                      <Badge key={i} variant="destructive">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Keywords */}
              {profile.suggested_keywords.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Suggested Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.suggested_keywords.map((keyword, i) => (
                      <Badge key={i} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Negative Keywords */}
              {profile.suggested_negative_keywords.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Negative Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.suggested_negative_keywords.map((keyword, i) => (
                      <Badge key={i} variant="outline" className="line-through opacity-60">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Scoring Overrides */}
              {Object.keys(profile.suggested_scoring_overrides).length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Scoring Adjustments</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(profile.suggested_scoring_overrides).map(([key, value]) => (
                      <div key={key} className="flex justify-between p-2 rounded bg-muted">
                        <span className="capitalize">{key.replace('_weight', '')}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t text-xs text-muted-foreground">
                Generated at {new Date(profile.generated_at).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
