'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, ArrowLeft, Sparkles, Target, Globe, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const STEPS = [
  { id: 1, title: 'About Your Business', icon: Globe },
  { id: 2, title: 'Client Setup', icon: Target },
  { id: 3, title: 'Campaign Setup', icon: Zap },
  { id: 4, title: 'Discovery Preview', icon: Sparkles },
];

const TARGET_LOCATIONS = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Global',
  'Custom'
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Business Info
  const [businessData, setBusinessData] = useState({
    website: user?.website || '',
    industry: user?.industry || '',
    idealCustomer: ''
  });

  // Step 2: Client Info
  const [clientData, setClientData] = useState({
    name: user?.company_name || 'My First Client',
    targetLocation: 'United States'
  });

  // Step 3: Campaign Info
  const [campaignData, setCampaignData] = useState({
    name: 'Discovery Campaign',
    keywords: '',
    negativeKeywords: '',
    brief: ''
  });

  // Step 4: Results
  const [discoveryResults, setDiscoveryResults] = useState<any[]>([]);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);

  const handleNext = async () => {
    if (currentStep === 4) {
      // Onboarding complete, go to dashboard
      router.push('/clients');
      return;
    }

    if (currentStep === 2) {
      // Create client
      await handleCreateClient();
    } else if (currentStep === 3) {
      // Create campaign and run discovery
      await handleCreateCampaign();
    }

    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleCreateClient = async () => {
    try {
      setLoading(true);
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://leadgenx.app';
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE}/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: clientData.name,
          status: 'active',
          industry: businessData.industry,
          website: businessData.website || undefined
        })
      });

      if (!response.ok) throw new Error('Failed to create client');
      
      const client = await response.json();
      setCreatedClientId(client.id);
    } catch (error) {
      console.error('Failed to create client:', error);
      alert('Failed to create client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!createdClientId) {
      alert('No client created. Please go back and complete step 2.');
      return;
    }

    try {
      setLoading(true);
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://leadgenx.app';
      const token = localStorage.getItem('auth_token');

      // Create campaign
      const campaignResponse = await fetch(`${API_BASE}/campaigns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: createdClientId,
          name: campaignData.name,
          status: 'active',
          targeting: {
            industries: [businessData.industry],
            locations: [clientData.targetLocation],
            keywords: campaignData.keywords.split(',').map(k => k.trim()).filter(Boolean)
          }
        })
      });

      if (!campaignResponse.ok) throw new Error('Failed to create campaign');
      
      const campaign = await campaignResponse.json();

      // Update campaign brief if provided
      if (campaignData.brief) {
        await fetch(`${API_BASE}/campaigns/${campaign.id}/brief`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ideal_customer_profile: businessData.idealCustomer || campaignData.brief
          })
        });
      }

      // Run test discovery (mock for now)
      // TODO: Connect to actual discovery endpoint when ready
      setDiscoveryResults([
        { name: 'TechCorp Solutions', industry: businessData.industry, location: 'San Francisco, CA', score: 92 },
        { name: 'InnovateLab Inc', industry: businessData.industry, location: 'Austin, TX', score: 88 },
        { name: 'NextGen Systems', industry: businessData.industry, location: 'Boston, MA', score: 85 },
        { name: 'Digital Dynamics', industry: businessData.industry, location: 'Seattle, WA', score: 82 },
        { name: 'CloudScale Corp', industry: businessData.industry, location: 'New York, NY', score: 79 },
      ]);
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return businessData.industry && businessData.idealCustomer;
    }
    if (currentStep === 2) {
      return clientData.name && clientData.targetLocation;
    }
    if (currentStep === 3) {
      return campaignData.name;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6E4AFF] rounded-full blur-[128px] opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4DE3FF] rounded-full blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6E4AFF] to-[#4DE3FF] flex items-center justify-center shadow-[0_0_20px_rgba(110,74,255,0.5)]">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#EDEEF2]">LeadGenX</span>
          </div>
          <Badge variant="primary">Setup Wizard</Badge>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all ${
                      isCompleted
                        ? 'bg-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                        : isActive
                        ? 'bg-gradient-to-br from-[#6E4AFF] to-[#4DE3FF] shadow-[0_0_20px_rgba(110,74,255,0.5)]'
                        : 'bg-[#141824] border border-[#8B90A0]/30'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className={`w-6 h-6 ${
                          isActive ? 'text-white' : 'text-[#8B90A0]'
                        }`} />
                      )}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${
                      isActive || isCompleted ? 'text-[#EDEEF2]' : 'text-[#8B90A0]'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${
                      isCompleted ? 'bg-[#10B981]' : 'bg-[#8B90A0]/30'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <GlassPanel intensity="strong" className="p-8">
            {/* Step 1: Business Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#EDEEF2] mb-2">Tell us about your business</h2>
                  <p className="text-[#8B90A0]">This helps us customize your lead discovery</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Company Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://yourcompany.com"
                      value={businessData.website}
                      onChange={(e) => setBusinessData({ ...businessData, website: e.target.value })}
                    />
                    <p className="text-xs text-[#8B90A0]">We'll analyze your site to better understand your offering</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Your Industry *</Label>
                    <Input
                      id="industry"
                      placeholder="e.g., SaaS, Marketing Agency, Consulting"
                      value={businessData.industry}
                      onChange={(e) => setBusinessData({ ...businessData, industry: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ideal-customer">Describe Your Ideal Customer *</Label>
                    <textarea
                      id="ideal-customer"
                      rows={4}
                      placeholder="e.g., B2B SaaS companies with 50-200 employees, looking for marketing automation solutions..."
                      value={businessData.idealCustomer}
                      onChange={(e) => setBusinessData({ ...businessData, idealCustomer: e.target.value })}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Client Setup */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#EDEEF2] mb-2">Set up your first client</h2>
                  <p className="text-[#8B90A0]">Each client has a separate workspace and CRM</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Client Name *</Label>
                    <Input
                      id="client-name"
                      placeholder="e.g., Acme Corp, Internal Team, Client A"
                      value={clientData.name}
                      onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                    />
                    <p className="text-xs text-[#8B90A0]">Tip: Use your own company name if you're generating leads for yourself</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-location">Primary Target Location *</Label>
                    <select
                      id="target-location"
                      value={clientData.targetLocation}
                      onChange={(e) => setClientData({ ...clientData, targetLocation: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {TARGET_LOCATIONS.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Campaign Setup */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#EDEEF2] mb-2">Create your first campaign</h2>
                  <p className="text-[#8B90A0]">Campaigns help you organize and target specific lead types</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-name">Campaign Name *</Label>
                    <Input
                      id="campaign-name"
                      placeholder="e.g., Q1 Discovery, Tech Startups, Enterprise Prospects"
                      value={campaignData.name}
                      onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keywords">Target Keywords</Label>
                    <Input
                      id="keywords"
                      placeholder="e.g., SaaS, marketing automation, CRM (comma-separated)"
                      value={campaignData.keywords}
                      onChange={(e) => setCampaignData({ ...campaignData, keywords: e.target.value })}
                    />
                    <p className="text-xs text-[#8B90A0]">Optional - helps refine lead discovery</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="negative-keywords">Negative Keywords</Label>
                    <Input
                      id="negative-keywords"
                      placeholder="e.g., agency, freelancer, consultant (comma-separated)"
                      value={campaignData.negativeKeywords}
                      onChange={(e) => setCampaignData({ ...campaignData, negativeKeywords: e.target.value })}
                    />
                    <p className="text-xs text-[#8B90A0]">Optional - excludes companies matching these terms</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brief">Additional Campaign Brief</Label>
                    <textarea
                      id="brief"
                      rows={3}
                      placeholder="Any specific requirements or notes about this campaign..."
                      value={campaignData.brief}
                      onChange={(e) => setCampaignData({ ...campaignData, brief: e.target.value })}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Discovery Results */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#EDEEF2] mb-2">🎉 Discovery Preview</h2>
                  <p className="text-[#8B90A0]">Here's a preview of leads matching your criteria</p>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[#6E4AFF] animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {discoveryResults.map((result, idx) => (
                      <GlassPanel key={idx} intensity="medium" className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-[#EDEEF2] mb-1">{result.name}</h3>
                            <p className="text-sm text-[#8B90A0] mb-1">{result.industry}</p>
                            <p className="text-xs text-[#8B90A0]">{result.location}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="text-right">
                              <div className="text-xs text-[#8B90A0]">Match Score</div>
                              <div className="text-lg font-bold text-[#6E4AFF]">{result.score}</div>
                            </div>
                          </div>
                        </div>
                      </GlassPanel>
                    ))}
                  </div>
                )}

                <div className="bg-[#6E4AFF]/10 border border-[#6E4AFF]/30 rounded-xl p-4">
                  <p className="text-sm text-[#EDEEF2]">
                    <strong>Next steps:</strong> Your campaign is ready! You can refine targeting, run full discovery, 
                    and start enriching leads from your dashboard.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#8B90A0]/20">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1 || loading}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : currentStep === 4 ? (
                  <>
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}