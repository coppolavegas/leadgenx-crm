'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WizardStep1 } from '@/components/campaigns/wizard-step-1';
import { WizardStep2 } from '@/components/campaigns/wizard-step-2';
import { WizardStep3 } from '@/components/campaigns/wizard-step-3';
import { WizardStep4 } from '@/components/campaigns/wizard-step-4';
import { WizardStep5 } from '@/components/campaigns/wizard-step-5';
import { CampaignTemplate } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

export interface WizardData {
  // Step 1
  name: string;
  client_id: string;
  vertical: string;
  template_id: string;
  client_brief: string;
  targeting_profile?: any;
  apply_targeting: boolean;
  
  // Step 2
  geo_country: string;
  geo_state: string;
  geo_city: string;
  geo_radius_miles: number;
  
  // Step 3
  sources_google_places: boolean;
  sources_reddit_intent: boolean;
  discovery_config: {
    categories: string[];
    keywords: string[];
    negative_keywords: string[];
    min_rating?: number;
    min_reviews?: number;
  };
  
  // Step 4
  scoring_weights: {
    phone_weight: number;
    email_weight: number;
    form_weight: number;
    intent_weight: number;
    freshness_weight: number;
  };
}

export default function CampaignWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  
  const [wizardData, setWizardData] = useState<WizardData>({
    name: '',
    client_id: '',
    vertical: '',
    template_id: '',
    client_brief: '',
    apply_targeting: false,
    geo_country: 'US',
    geo_state: '',
    geo_city: '',
    geo_radius_miles: 25,
    sources_google_places: true,
    sources_reddit_intent: false,
    discovery_config: {
      categories: [],
      keywords: [],
      negative_keywords: [],
      min_rating: 4.0,
      min_reviews: 10,
    },
    scoring_weights: {
      phone_weight: 33,
      email_weight: 33,
      form_weight: 33,
      intent_weight: 10,
      freshness_weight: 5,
    },
  });

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await apiClient.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  // Apply template when selected
  const applyTemplate = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setWizardData((prev) => ({
      ...prev,
      vertical: template.vertical,
      template_id: template.id,
      discovery_config: {
        ...prev.discovery_config,
        categories: template.default_categories,
        keywords: template.default_keywords,
        negative_keywords: template.default_negative_keywords,
        min_rating: template.default_min_rating,
        min_reviews: template.default_min_reviews,
      },
      scoring_weights: template.default_scoring_weights,
    }));
  };

  const updateWizardData = (updates: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  };

  // Create draft campaign and autosave
  const createOrUpdateCampaign = async (finalStatus: 'draft' | 'active' = 'draft') => {
    setSaving(true);
    try {
      if (!campaignId) {
        // Create new draft campaign
        const campaign = await apiClient.createCampaign({
          name: wizardData.name,
          client_id: wizardData.client_id,
          vertical: wizardData.vertical,
          status: 'draft',
          geo_country: wizardData.geo_country || undefined,
          geo_state: wizardData.geo_state || undefined,
          geo_city: wizardData.geo_city || undefined,
          geo_radius_miles: wizardData.geo_radius_miles || undefined,
          sources_google_places: wizardData.sources_google_places,
          sources_reddit_intent: wizardData.sources_reddit_intent,
          discovery_config: wizardData.discovery_config,
          scoring_weights: wizardData.scoring_weights,
        });
        setCampaignId(campaign.id);
        setLastSaveTime(new Date());
        return campaign.id;
      } else {
        // Update existing campaign
        await apiClient.updateCampaign(campaignId, {
          name: wizardData.name,
          client_id: wizardData.client_id,
          vertical: wizardData.vertical,
          geo_country: wizardData.geo_country || undefined,
          geo_state: wizardData.geo_state || undefined,
          geo_city: wizardData.geo_city || undefined,
          geo_radius_miles: wizardData.geo_radius_miles || undefined,
          sources_google_places: wizardData.sources_google_places,
          sources_reddit_intent: wizardData.sources_reddit_intent,
          discovery_config: wizardData.discovery_config,
          scoring_weights: wizardData.scoring_weights,
        });
        setLastSaveTime(new Date());
        return campaignId;
      }
    } catch (error) {
      console.error('Failed to save campaign:', error);
      alert('Failed to save campaign. Please try again.');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    // Validate and save before moving to next step
    if (currentStep === 1 && (!wizardData.name || !wizardData.client_id || !wizardData.vertical)) {
      alert('Please fill in campaign name, client, and vertical');
      return;
    }
    
    if (currentStep === 2 && (!wizardData.geo_city || !wizardData.geo_state || !wizardData.geo_country)) {
      alert('Please fill in location (city, state, country)');
      return;
    }

    // Create/update campaign on step 1
    if (currentStep === 1) {
      await createOrUpdateCampaign();
    } else if (campaignId) {
      await createOrUpdateCampaign();
    }

    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSaveDraft = async () => {
    await createOrUpdateCampaign('draft');
    alert('Campaign saved as draft');
  };

  const handleLaunch = async () => {
    try {
      const id = await createOrUpdateCampaign('draft');
      if (id) {
        await apiClient.launchCampaign(id);
        alert('Campaign launched successfully!');
        router.push(`/campaigns/${id}`);
      }
    } catch (error) {
      console.error('Failed to launch campaign:', error);
    }
  };

  const handleLaunchAndRun = async () => {
    try {
      const id = await createOrUpdateCampaign('draft');
      if (id) {
        await apiClient.launchCampaign(id);
        await apiClient.runCampaign(id, 'manual');
        alert('Campaign launched and run started!');
        router.push(`/campaigns/${id}`);
      }
    } catch (error) {
      console.error('Failed to launch and run campaign:', error);
    }
  };

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Campaign</h1>
          <p className="text-muted-foreground">
            Follow the steps to create a high-quality lead generation campaign
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
            {lastSaveTime && (
              <span className="text-xs text-muted-foreground">
                Last saved {Math.floor((Date.now() - lastSaveTime.getTime()) / 1000)}s ago
              </span>
            )}
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Navigation */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { num: 1, label: 'Basics' },
            { num: 2, label: 'Location' },
            { num: 3, label: 'Sources' },
            { num: 4, label: 'Scoring' },
            { num: 5, label: 'Review' },
          ].map((step) => (
            <div
              key={step.num}
              className={`flex items-center gap-2 px-4 py-2 rounded-md whitespace-nowrap ${
                currentStep === step.num
                  ? 'bg-primary text-primary-foreground'
                  : currentStep > step.num
                  ? 'bg-primary/20 text-primary'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {currentStep > step.num ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="font-bold">{step.num}</span>
              )}
              <span className="text-sm font-medium">{step.label}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          {currentStep === 1 && (
            <WizardStep1
              data={wizardData}
              templates={templates}
              selectedTemplate={selectedTemplate}
              onUpdate={updateWizardData}
              onApplyTemplate={applyTemplate}
              campaignId={campaignId}
            />
          )}
          {currentStep === 2 && <WizardStep2 data={wizardData} onUpdate={updateWizardData} />}
          {currentStep === 3 && (
            <WizardStep3
              data={wizardData}
              selectedTemplate={selectedTemplate}
              onUpdate={updateWizardData}
            />
          )}
          {currentStep === 4 && (
            <WizardStep4
              data={wizardData}
              selectedTemplate={selectedTemplate}
              onUpdate={updateWizardData}
            />
          )}
          {currentStep === 5 && (
            <WizardStep5
              data={wizardData}
              onSaveDraft={handleSaveDraft}
              onLaunch={handleLaunch}
              onLaunchAndRun={handleLaunchAndRun}
              saving={saving}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || saving}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < totalSteps && (
            <Button onClick={handleNext} disabled={saving}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
