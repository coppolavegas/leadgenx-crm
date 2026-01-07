'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import { Client } from '@/lib/types';
import { ChevronRight, ChevronLeft, Check, Target, MapPin, Settings, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CampaignWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const industryTemplates = [
  {
    id: 'recording-studio',
    name: 'Recording Studios',
    vertical: 'Recording Studio',
    keywords: ['recording studio', 'music production', 'audio recording'],
    icon: '🎵',
  },
  {
    id: 'dental-clinic',
    name: 'Dental Clinics',
    vertical: 'Dentist',
    keywords: ['dentist', 'dental clinic', 'orthodontist'],
    icon: '🦷',
  },
  {
    id: 'law-firm',
    name: 'Law Firms',
    vertical: 'Law Firm',
    keywords: ['lawyer', 'attorney', 'law firm'],
    icon: '⚖️',
  },
  {
    id: 'real-estate',
    name: 'Real Estate Agents',
    vertical: 'Real Estate',
    keywords: ['real estate agent', 'realtor', 'property agent'],
    icon: '🏠',
  },
  {
    id: 'restaurant',
    name: 'Restaurants',
    vertical: 'Restaurant',
    keywords: ['restaurant', 'cafe', 'dining'],
    icon: '🍽️',
  },
  {
    id: 'custom',
    name: 'Custom',
    vertical: '',
    keywords: [],
    icon: '✨',
  },
];

export function CampaignWizard({ open, onOpenChange, onComplete }: CampaignWizardProps) {
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    template: '',
    vertical: '',
    keywords: [] as string[],
    geo_country: 'USA',
    geo_state: '',
    geo_city: '',
    geo_radius_miles: 25,
    sources_google_places: true,
    sources_reddit_intent: false,
    scoring_weights: {
      phone_weight: 20,
      email_weight: 25,
      form_weight: 15,
      rating_weight: 20,
      review_weight: 10,
      freshness_weight: 10,
    },
  });

  useEffect(() => {
    if (open) {
      loadClients();
    }
  }, [open]);

  const loadClients = async () => {
    try {
      const data = await apiClient.getClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleTemplateSelect = (template: typeof industryTemplates[0]) => {
    setFormData({
      ...formData,
      template: template.id,
      vertical: template.vertical,
      keywords: template.keywords,
    });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        client_id: formData.client_id || undefined,
        vertical: formData.vertical,
        geo_country: formData.geo_country,
        geo_state: formData.geo_state || undefined,
        geo_city: formData.geo_city || undefined,
        geo_radius_miles: formData.geo_radius_miles,
        sources_google_places: formData.sources_google_places,
        sources_reddit_intent: formData.sources_reddit_intent,
        discovery_config: {
          keywords: formData.keywords,
        },
        intent_config: {},
        enrichment_config: {},
        scoring_weights: formData.scoring_weights,
      };

      await apiClient.createCampaign(payload);
      onComplete();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      name: '',
      client_id: '',
      template: '',
      vertical: '',
      keywords: [],
      geo_country: 'USA',
      geo_state: '',
      geo_city: '',
      geo_radius_miles: 25,
      sources_google_places: true,
      sources_reddit_intent: false,
      scoring_weights: {
        phone_weight: 20,
        email_weight: 25,
        form_weight: 15,
        rating_weight: 20,
        review_weight: 10,
        freshness_weight: 10,
      },
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name && formData.template;
      case 2:
        return formData.geo_city || formData.geo_state;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <div className="flex items-center space-x-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Basic Info & Template */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <Label>Campaign Name *</Label>
                <Input
                  placeholder="NYC Recording Studios Q1 2025"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Client (Optional)</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client (internal)</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Industry Template *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {industryTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all ${
                        formData.template === template.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{template.icon}</span>
                          <div className="flex-1">
                            <div className="font-semibold">{template.name}</div>
                            {template.vertical && (
                              <div className="text-xs text-muted-foreground">
                                {template.keywords.slice(0, 2).join(', ')}
                              </div>
                            )}
                          </div>
                          {formData.template === template.id && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {formData.template === 'custom' && (
                <div className="space-y-2">
                  <Label>Custom Vertical</Label>
                  <Input
                    placeholder="e.g., Coffee Shop"
                    value={formData.vertical}
                    onChange={(e) => setFormData({ ...formData, vertical: e.target.value })}
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Geographic Targeting</h3>
              </div>

              <div className="space-y-2">
                <Label>Country</Label>
                <Select
                  value={formData.geo_country}
                  onValueChange={(value) => setFormData({ ...formData, geo_country: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USA">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    placeholder="New York"
                    value={formData.geo_city}
                    onChange={(e) => setFormData({ ...formData, geo_city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State/Province</Label>
                  <Input
                    placeholder="NY"
                    value={formData.geo_state}
                    onChange={(e) => setFormData({ ...formData, geo_state: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Radius: {formData.geo_radius_miles} miles</Label>
                <Slider
                  value={[formData.geo_radius_miles]}
                  onValueChange={([value]) =>
                    setFormData({ ...formData, geo_radius_miles: value })
                  }
                  min={5}
                  max={100}
                  step={5}
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Data Sources */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Data Sources</h3>
              </div>

              <div className="space-y-3">
                <Card
                  className={`cursor-pointer transition-all ${
                    formData.sources_google_places
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      sources_google_places: !formData.sources_google_places,
                    })
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold flex items-center space-x-2">
                          <span>Google Places</span>
                          <Badge variant="default">Recommended</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Discover businesses from Google Maps with ratings, reviews, and contact
                          info
                        </p>
                      </div>
                      {formData.sources_google_places && (
                        <Check className="h-5 w-5 text-primary ml-4" />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    formData.sources_reddit_intent
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      sources_reddit_intent: !formData.sources_reddit_intent,
                    })
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold flex items-center space-x-2">
                          <span>Reddit Intent Signals</span>
                          <Badge variant="secondary">Advanced</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Find high-intent prospects actively looking for your services on Reddit
                        </p>
                      </div>
                      {formData.sources_reddit_intent && (
                        <Check className="h-5 w-5 text-primary ml-4" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Step 4: Scoring Priorities */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Lead Scoring Priorities</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Adjust weights to prioritize different lead qualities (total: 100%)
              </p>

              <div className="space-y-4">
                {Object.entries(formData.scoring_weights).map(([key, value]) => {
                  const labels: Record<string, string> = {
                    phone_weight: 'Phone Number',
                    email_weight: 'Email Address',
                    form_weight: 'Contact Form',
                    rating_weight: 'Rating',
                    review_weight: 'Review Count',
                    freshness_weight: 'Freshness',
                  };
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between">
                        <Label>{labels[key]}</Label>
                        <span className="text-sm font-mono">{value}%</span>
                      </div>
                      <Slider
                        value={[value]}
                        onValueChange={([newValue]) =>
                          setFormData({
                            ...formData,
                            scoring_weights: {
                              ...formData.scoring_weights,
                              [key]: newValue,
                            },
                          })
                        }
                        min={0}
                        max={50}
                        step={5}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Weight:</span>
                  <span
                    className={`font-mono text-lg ${
                      Object.values(formData.scoring_weights).reduce((a, b) => a + b, 0) === 100
                        ? 'text-green-500'
                        : 'text-yellow-500'
                    }`}
                  >
                    {Object.values(formData.scoring_weights).reduce((a, b) => a + b, 0)}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => (step === 1 ? onOpenChange(false) : setStep(step - 1))}
            disabled={saving}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Creating...' : 'Create Campaign'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
