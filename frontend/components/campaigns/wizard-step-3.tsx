'use client';

import { WizardData } from '@/app/campaigns/new/page';
import { CampaignTemplate } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { X, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface Props {
  data: WizardData;
  selectedTemplate: CampaignTemplate | null;
  onUpdate: (updates: Partial<WizardData>) => void;
}

export function WizardStep3({ data, selectedTemplate, onUpdate }: Props) {
  const [newKeyword, setNewKeyword] = useState('');
  const [newNegKeyword, setNewNegKeyword] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const addKeyword = () => {
    if (newKeyword.trim()) {
      onUpdate({
        discovery_config: {
          ...data.discovery_config,
          keywords: [...data.discovery_config.keywords, newKeyword.trim()],
        },
      });
      setNewKeyword('');
    }
  };

  const removeKeyword = (index: number) => {
    onUpdate({
      discovery_config: {
        ...data.discovery_config,
        keywords: data.discovery_config.keywords.filter((_, i) => i !== index),
      },
    });
  };

  const addNegKeyword = () => {
    if (newNegKeyword.trim()) {
      onUpdate({
        discovery_config: {
          ...data.discovery_config,
          negative_keywords: [...data.discovery_config.negative_keywords, newNegKeyword.trim()],
        },
      });
      setNewNegKeyword('');
    }
  };

  const removeNegKeyword = (index: number) => {
    onUpdate({
      discovery_config: {
        ...data.discovery_config,
        negative_keywords: data.discovery_config.negative_keywords.filter((_, i) => i !== index),
      },
    });
  };

  const addCategory = () => {
    if (newCategory.trim()) {
      onUpdate({
        discovery_config: {
          ...data.discovery_config,
          categories: [...data.discovery_config.categories, newCategory.trim()],
        },
      });
      setNewCategory('');
    }
  };

  const removeCategory = (index: number) => {
    onUpdate({
      discovery_config: {
        ...data.discovery_config,
        categories: data.discovery_config.categories.filter((_, i) => i !== index),
      },
    });
  };

  const resetToTemplate = () => {
    if (selectedTemplate) {
      onUpdate({
        discovery_config: {
          ...data.discovery_config,
          categories: selectedTemplate.default_categories,
          keywords: selectedTemplate.default_keywords,
          negative_keywords: selectedTemplate.default_negative_keywords,
          min_rating: selectedTemplate.default_min_rating,
          min_reviews: selectedTemplate.default_min_reviews,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Sources & Discovery</h2>
          <p className="text-muted-foreground">
            Configure where to find leads and what criteria to use
          </p>
        </div>
        {selectedTemplate && (
          <Button onClick={resetToTemplate} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Template
          </Button>
        )}
      </div>

      {/* Source Toggles */}
      <Card className="p-4">
        <Label className="text-base font-semibold mb-3 block">Data Sources</Label>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.sources_google_places}
              onChange={(e) => onUpdate({ sources_google_places: e.target.checked })}
              className="w-4 h-4"
            />
            <div>
              <div className="font-medium">Google Places API</div>
              <div className="text-sm text-muted-foreground">Find businesses on Google Maps</div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer opacity-50">
            <input
              type="checkbox"
              checked={data.sources_reddit_intent}
              onChange={(e) => onUpdate({ sources_reddit_intent: e.target.checked })}
              disabled
              className="w-4 h-4"
            />
            <div>
              <div className="font-medium">Reddit Intent Signals <Badge variant="secondary" className="ml-2">Coming Soon</Badge></div>
              <div className="text-sm text-muted-foreground">Find leads expressing buying intent on Reddit</div>
            </div>
          </label>
        </div>
      </Card>

      {/* Categories */}
      <div>
        <Label className="text-base font-semibold">Google Places Categories</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Business categories to search (e.g., recording_studio, dentist, gym)
        </p>
        <div className="flex gap-2 mb-2">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            placeholder="Add a category"
          />
          <Button onClick={addCategory} variant="outline">Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.discovery_config.categories.map((cat, idx) => (
            <Badge key={idx} variant="secondary" className="gap-1">
              {cat}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeCategory(idx)} />
            </Badge>
          ))}
        </div>
      </div>

      {/* Keywords */}
      <div>
        <Label className="text-base font-semibold">Keywords</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Keywords to match in business name, description, or reviews
        </p>
        <div className="flex gap-2 mb-2">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="Add a keyword"
          />
          <Button onClick={addKeyword} variant="outline">Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.discovery_config.keywords.map((keyword, idx) => (
            <Badge key={idx} className="bg-blue-600 gap-1">
              {keyword}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeKeyword(idx)} />
            </Badge>
          ))}
        </div>
      </div>

      {/* Negative Keywords */}
      <div>
        <Label className="text-base font-semibold">Negative Keywords</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Exclude leads matching these keywords
        </p>
        <div className="flex gap-2 mb-2">
          <Input
            value={newNegKeyword}
            onChange={(e) => setNewNegKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNegKeyword()}
            placeholder="Add a negative keyword"
          />
          <Button onClick={addNegKeyword} variant="outline">Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.discovery_config.negative_keywords.map((keyword, idx) => (
            <Badge key={idx} className="bg-red-600 gap-1">
              {keyword}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeNegKeyword(idx)} />
            </Badge>
          ))}
        </div>
      </div>

      {/* Quality Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min_rating">Minimum Rating</Label>
          <Input
            id="min_rating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={data.discovery_config.min_rating}
            onChange={(e) =>
              onUpdate({
                discovery_config: {
                  ...data.discovery_config,
                  min_rating: parseFloat(e.target.value) || 0,
                },
              })
            }
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="min_reviews">Minimum Reviews</Label>
          <Input
            id="min_reviews"
            type="number"
            min="0"
            value={data.discovery_config.min_reviews}
            onChange={(e) =>
              onUpdate({
                discovery_config: {
                  ...data.discovery_config,
                  min_reviews: parseInt(e.target.value) || 0,
                },
              })
            }
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}
