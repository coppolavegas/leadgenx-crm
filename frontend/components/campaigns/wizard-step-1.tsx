'use client';

import { useState, useEffect } from 'react';
import { WizardData } from '@/app/campaigns/new/page';
import { CampaignTemplate, Client } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  data: WizardData;
  templates: CampaignTemplate[];
  selectedTemplate: CampaignTemplate | null;
  onUpdate: (updates: Partial<WizardData>) => void;
  onApplyTemplate: (template: CampaignTemplate) => void;
  campaignId: string | null;
}

export function WizardStep1({
  data,
  templates,
  selectedTemplate,
  onUpdate,
  onApplyTemplate,
  campaignId,
}: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [applyingBrief, setApplyingBrief] = useState(false);
  const [targetingPreview, setTargetingPreview] = useState<any>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await apiClient.getClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleGenerateBrief = async () => {
    if (!data.client_brief || !campaignId) {
      alert('Please enter a client brief and save the campaign first');
      return;
    }

    setGeneratingBrief(true);
    try {
      const result = await apiClient.updateCampaignBrief(campaignId, data.client_brief);
      setTargetingPreview(result.campaign.targeting_profile);
      onUpdate({ targeting_profile: result.campaign.targeting_profile });
      alert('Targeting profile generated successfully!');
    } catch (error) {
      console.error('Failed to generate targeting profile:', error);
      alert('Failed to generate targeting profile');
    } finally {
      setGeneratingBrief(false);
    }
  };

  const handleApplyBrief = async () => {
    if (!campaignId || !targetingPreview) {
      alert('Please generate targeting profile first');
      return;
    }

    setApplyingBrief(true);
    try {
      await apiClient.applyCampaignBrief(campaignId);
      onUpdate({ apply_targeting: true });
      alert('Targeting profile applied to campaign settings!');
    } catch (error) {
      console.error('Failed to apply targeting profile:', error);
      alert('Failed to apply targeting profile');
    } finally {
      setApplyingBrief(false);
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-green-600">High Confidence ({Math.round(score * 100)}%)</Badge>;
    if (score >= 0.6) return <Badge className="bg-yellow-600">Medium Confidence ({Math.round(score * 100)}%)</Badge>;
    return <Badge className="bg-orange-600">Low Confidence ({Math.round(score * 100)}%)</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Campaign Basics</h2>
        <p className="text-muted-foreground">
          Start by selecting a vertical template and providing basic campaign details
        </p>
      </div>

      {/* Template Selection */}
      <div>
        <Label className="text-base font-semibold mb-3 block">Select Vertical Template</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`p-4 cursor-pointer transition-all hover:border-primary ${
                selectedTemplate?.id === template.id ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => onApplyTemplate(template)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                </div>
                {selectedTemplate?.id === template.id && <CheckCircle2 className="w-5 h-5 text-primary" />}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Campaign Name */}
      <div>
        <Label htmlFor="name">Campaign Name *</Label>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="e.g., Recording Studios - Portland"
          className="mt-2"
        />
      </div>

      {/* Client Selection */}
      <div>
        <Label htmlFor="client">Client *</Label>
        <select
          id="client"
          value={data.client_id}
          onChange={(e) => onUpdate({ client_id: e.target.value })}
          className="w-full mt-2 px-3 py-2 border border-input bg-background rounded-md"
        >
          <option value="">Select a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* Client Brief */}
      <div>
        <Label htmlFor="brief" className="text-base font-semibold">
          Client Brief (Optional)
        </Label>
        <p className="text-sm text-muted-foreground mb-2">
          Describe what you're looking for in natural language. Our AI will extract targeting rules.
        </p>
        <Textarea
          id="brief"
          value={data.client_brief}
          onChange={(e) => onUpdate({ client_brief: e.target.value })}
          placeholder={selectedTemplate?.example_brief || 'e.g., I need recording studios that offer mixing and mastering, have professional equipment...'}
          rows={4}
          className="mt-2"
        />
        <div className="flex gap-2 mt-3">
          <Button
            onClick={handleGenerateBrief}
            disabled={!data.client_brief || generatingBrief || !campaignId}
            variant="outline"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generatingBrief ? 'Generating...' : 'Generate Targeting'}
          </Button>
          {targetingPreview && (
            <Button
              onClick={handleApplyBrief}
              disabled={applyingBrief}
              variant="default"
            >
              {applyingBrief ? 'Applying...' : 'Apply to Campaign'}
            </Button>
          )}
        </div>
      </div>

      {/* Targeting Preview */}
      {targetingPreview && (
        <Card className="p-4 bg-secondary/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">AI-Generated Targeting Profile</h3>
            {getConfidenceBadge(targetingPreview.confidence_score || 0)}
          </div>
          
          <div className="space-y-3">
            {targetingPreview.must_have_features?.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Must-Have Features</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {targetingPreview.must_have_features.map((feature: string, idx: number) => (
                    <Badge key={idx} className="bg-green-600">{feature}</Badge>
                  ))}
                </div>
              </div>
            )}

            {targetingPreview.nice_to_have_features?.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Nice-to-Have Features</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {targetingPreview.nice_to_have_features.map((feature: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{feature}</Badge>
                  ))}
                </div>
              </div>
            )}

            {targetingPreview.excluded_features?.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Excluded Features</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {targetingPreview.excluded_features.map((feature: string, idx: number) => (
                    <Badge key={idx} className="bg-red-600">{feature}</Badge>
                  ))}
                </div>
              </div>
            )}

            {targetingPreview.suggested_keywords?.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Suggested Keywords</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {targetingPreview.suggested_keywords.map((keyword: string, idx: number) => (
                    <Badge key={idx} variant="outline">{keyword}</Badge>
                  ))}
                </div>
              </div>
            )}

            {targetingPreview.suggested_negative_keywords?.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Negative Keywords</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {targetingPreview.suggested_negative_keywords.map((keyword: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="bg-red-50">{keyword}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {!campaignId && data.client_brief && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm">
          <strong>Note:</strong> Please click "Next" to save the campaign first before generating targeting profile.
        </div>
      )}
    </div>
  );
}
