'use client';

import { WizardData } from '@/app/campaigns/new/page';
import { CampaignTemplate } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';

interface Props {
  data: WizardData;
  selectedTemplate: CampaignTemplate | null;
  onUpdate: (updates: Partial<WizardData>) => void;
}

export function WizardStep4({ data, selectedTemplate, onUpdate }: Props) {
  const updateWeight = (key: keyof WizardData['scoring_weights'], value: number) => {
    onUpdate({
      scoring_weights: {
        ...data.scoring_weights,
        [key]: value,
      },
    });
  };

  const resetToTemplate = () => {
    if (selectedTemplate) {
      onUpdate({ scoring_weights: selectedTemplate.default_scoring_weights });
    }
  };

  const totalWeight =
    data.scoring_weights.phone_weight +
    data.scoring_weights.email_weight +
    data.scoring_weights.form_weight +
    data.scoring_weights.intent_weight +
    data.scoring_weights.freshness_weight;

  const getPercentage = (value: number) => {
    return totalWeight > 0 ? Math.round((value / totalWeight) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Prioritization & Scoring</h2>
          <p className="text-muted-foreground">
            Adjust how leads are scored based on available contact methods and data quality
          </p>
        </div>
        {selectedTemplate && (
          <Button onClick={resetToTemplate} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Template
          </Button>
        )}
      </div>

      {/* Weight Sliders */}
      <div className="space-y-6">
        {/* Phone Priority */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="font-semibold">Phone Priority</Label>
            <span className="text-sm font-bold text-primary">
              {data.scoring_weights.phone_weight} ({getPercentage(data.scoring_weights.phone_weight)}%)
            </span>
          </div>
          <Slider
            value={[data.scoring_weights.phone_weight]}
            onValueChange={([value]) => updateWeight('phone_weight', value)}
            min={0}
            max={100}
            step={5}
          />
          <p className="text-xs text-muted-foreground mt-1">
            How much to prioritize leads with phone numbers
          </p>
        </div>

        {/* Email Priority */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="font-semibold">Email Priority</Label>
            <span className="text-sm font-bold text-primary">
              {data.scoring_weights.email_weight} ({getPercentage(data.scoring_weights.email_weight)}%)
            </span>
          </div>
          <Slider
            value={[data.scoring_weights.email_weight]}
            onValueChange={([value]) => updateWeight('email_weight', value)}
            min={0}
            max={100}
            step={5}
          />
          <p className="text-xs text-muted-foreground mt-1">
            How much to prioritize leads with email addresses
          </p>
        </div>

        {/* Contact Form Priority */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="font-semibold">Contact Form Priority</Label>
            <span className="text-sm font-bold text-primary">
              {data.scoring_weights.form_weight} ({getPercentage(data.scoring_weights.form_weight)}%)
            </span>
          </div>
          <Slider
            value={[data.scoring_weights.form_weight]}
            onValueChange={([value]) => updateWeight('form_weight', value)}
            min={0}
            max={100}
            step={5}
          />
          <p className="text-xs text-muted-foreground mt-1">
            How much to prioritize leads with contact forms
          </p>
        </div>

        {/* Intent Priority */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="font-semibold">Intent Priority</Label>
            <span className="text-sm font-bold text-primary">
              {data.scoring_weights.intent_weight} ({getPercentage(data.scoring_weights.intent_weight)}%)
            </span>
          </div>
          <Slider
            value={[data.scoring_weights.intent_weight]}
            onValueChange={([value]) => updateWeight('intent_weight', value)}
            min={0}
            max={100}
            step={5}
          />
          <p className="text-xs text-muted-foreground mt-1">
            How much to prioritize leads showing buying intent signals
          </p>
        </div>

        {/* Freshness Priority */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="font-semibold">Freshness Priority</Label>
            <span className="text-sm font-bold text-primary">
              {data.scoring_weights.freshness_weight} ({getPercentage(data.scoring_weights.freshness_weight)}%)
            </span>
          </div>
          <Slider
            value={[data.scoring_weights.freshness_weight]}
            onValueChange={([value]) => updateWeight('freshness_weight', value)}
            min={0}
            max={100}
            step={5}
          />
          <p className="text-xs text-muted-foreground mt-1">
            How much to prioritize recently discovered leads
          </p>
        </div>
      </div>

      {/* Resulting Weights Preview */}
      <Card className="p-4 bg-secondary/50">
        <h3 className="font-semibold mb-3">Resulting Weight Distribution</h3>
        <div className="space-y-2">
          {[
            { label: 'Phone', value: data.scoring_weights.phone_weight, color: 'bg-blue-500' },
            { label: 'Email', value: data.scoring_weights.email_weight, color: 'bg-green-500' },
            { label: 'Form', value: data.scoring_weights.form_weight, color: 'bg-yellow-500' },
            { label: 'Intent', value: data.scoring_weights.intent_weight, color: 'bg-purple-500' },
            { label: 'Freshness', value: data.scoring_weights.freshness_weight, color: 'bg-orange-500' },
          ].map((item) => {
            const percentage = getPercentage(item.value);
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">{percentage}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Total: {totalWeight} points distributed across {Object.values(data.scoring_weights).filter((v) => v > 0).length} priorities
        </p>
      </Card>

      {/* Tips */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>💡 <strong>Tip:</strong> Higher phone weight is ideal for call-based outreach campaigns</p>
        <p>💡 <strong>Tip:</strong> Higher email weight works well for drip email sequences</p>
        <p>💡 <strong>Tip:</strong> Balance weights evenly (30/30/30) for multi-channel campaigns</p>
      </div>
    </div>
  );
}
