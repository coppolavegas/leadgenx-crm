'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Badge } from '@/components/ui/badge';
import { Globe, ArrowRight, Loader2, CheckCircle2, AlertCircle, Sparkles, Target, MapPin } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface WebsiteAnalysisResult {
  what_they_sell: string[];
  industries_served: string[];
  service_areas: string[];
  customer_personas: string[];
  suggested_keywords: string[];
  suggested_exclusions: string[];
  outreach_angles: string[];
  confidence_score: number;
  pages_analyzed: number;
}

export default function WebsiteIntelligencePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [website, setWebsite] = useState(user?.website || '');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<WebsiteAnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [applying, setApplying] = useState(false);

  const handleAnalyze = async () => {
    if (!website.trim()) {
      setError('Please enter a website URL');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // TODO: Connect to real API endpoint
      // For now, simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response based on domain analysis
      const mockAnalysis: WebsiteAnalysisResult = {
        what_they_sell: [
          'Marketing automation software',
          'Lead generation tools',
          'CRM integration services',
          'Analytics and reporting'
        ],
        industries_served: [
          'SaaS companies',
          'Digital marketing agencies',
          'B2B service providers',
          'E-commerce platforms'
        ],
        service_areas: [
          'United States',
          'Canada',
          'United Kingdom',
          'Australia'
        ],
        customer_personas: [
          'Marketing directors at mid-size B2B companies',
          'Sales operations managers',
          'Agency owners looking to scale',
          'Growth leaders at startups'
        ],
        suggested_keywords: [
          'marketing automation',
          'lead generation',
          'CRM',
          'sales funnel',
          'lead scoring',
          'email campaigns'
        ],
        suggested_exclusions: [
          'freelancer',
          'individual consultant',
          'student',
          'intern'
        ],
        outreach_angles: [
          'We help companies like yours generate 3x more qualified leads',
          'Join 500+ agencies using our platform to scale their client acquisition'
        ],
        confidence_score: 0.87,
        pages_analyzed: 12
      };

      setAnalysis(mockAnalysis);
    } catch (err) {
      setError('Failed to analyze website. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToCampaign = async () => {
    if (!selectedCampaignId) {
      alert('Please select a campaign first');
      return;
    }

    try {
      setApplying(true);
      
      // TODO: Connect to real API
      // POST /campaigns/:id/apply-website-analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Website intelligence applied to campaign successfully!');
      router.push(`/campaigns/${selectedCampaignId}`);
    } catch (err) {
      alert('Failed to apply website intelligence');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] p-6">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6E4AFF] rounded-full blur-[128px] opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4DE3FF] rounded-full blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6E4AFF] to-[#4DE3FF] flex items-center justify-center shadow-[0_0_20px_rgba(110,74,255,0.5)]">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#EDEEF2]">Website Intelligence</h1>
              <p className="text-[#8B90A0]">Analyze your website to improve targeting and messaging</p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <GlassPanel intensity="strong" className="p-6 mb-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="website">Business Website *</Label>
              <div className="flex gap-3 mt-2">
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourcompany.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={loading || !website.trim()}
                  className="gap-2 min-w-[140px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#8B90A0] mt-2">
                We'll analyze your homepage, about page, and services to understand your business
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 rounded-lg p-3">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </GlassPanel>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-4">
            {/* Summary */}
            <GlassPanel intensity="medium" className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#EDEEF2] mb-1">Analysis Complete</h2>
                  <p className="text-sm text-[#8B90A0]">
                    Analyzed {analysis.pages_analyzed} pages • Confidence: {Math.round(analysis.confidence_score * 100)}%
                  </p>
                </div>
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Ready to Apply
                </Badge>
              </div>

              {/* Apply to Campaign */}
              <div className="flex items-center gap-3 p-4 bg-[#6E4AFF]/10 border border-[#6E4AFF]/30 rounded-xl">
                <Target className="w-5 h-5 text-[#6E4AFF]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#EDEEF2]">Apply these insights to a campaign</p>
                  <p className="text-xs text-[#8B90A0]">Auto-populate keywords, exclusions, and targeting</p>
                </div>
                <Button
                  onClick={handleApplyToCampaign}
                  disabled={applying}
                  className="gap-2"
                >
                  {applying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      Apply Now
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </GlassPanel>

            {/* What They Sell */}
            <GlassPanel intensity="medium" className="p-6">
              <h3 className="text-lg font-bold text-[#EDEEF2] mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#6E4AFF]" />
                What You Sell
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.what_they_sell.map((item, i) => (
                  <Badge key={i} variant="outline" className="text-[#EDEEF2]">
                    {item}
                  </Badge>
                ))}
              </div>
            </GlassPanel>

            {/* Industries Served */}
            <GlassPanel intensity="medium" className="p-6">
              <h3 className="text-lg font-bold text-[#EDEEF2] mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#6E4AFF]" />
                Industries You Serve
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.industries_served.map((item, i) => (
                  <Badge key={i} variant="outline" className="text-[#EDEEF2]">
                    {item}
                  </Badge>
                ))}
              </div>
            </GlassPanel>

            {/* Service Areas */}
            <GlassPanel intensity="medium" className="p-6">
              <h3 className="text-lg font-bold text-[#EDEEF2] mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#6E4AFF]" />
                Geographic Focus
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.service_areas.map((item, i) => (
                  <Badge key={i} variant="outline" className="text-[#EDEEF2]">
                    {item}
                  </Badge>
                ))}
              </div>
            </GlassPanel>

            {/* Customer Personas */}
            <GlassPanel intensity="medium" className="p-6">
              <h3 className="text-lg font-bold text-[#EDEEF2] mb-3">Ideal Customer Personas</h3>
              <div className="space-y-2">
                {analysis.customer_personas.map((persona, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                    <span className="text-[#EDEEF2]">{persona}</span>
                  </div>
                ))}
              </div>
            </GlassPanel>

            {/* Suggested Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassPanel intensity="medium" className="p-6">
                <h3 className="text-lg font-bold text-[#EDEEF2] mb-3">Suggested Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.suggested_keywords.map((keyword, i) => (
                    <Badge key={i} variant="success" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </GlassPanel>

              <GlassPanel intensity="medium" className="p-6">
                <h3 className="text-lg font-bold text-[#EDEEF2] mb-3">Suggested Exclusions</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.suggested_exclusions.map((exclusion, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">
                      {exclusion}
                    </Badge>
                  ))}
                </div>
              </GlassPanel>
            </div>

            {/* Outreach Angles */}
            <GlassPanel intensity="medium" className="p-6">
              <h3 className="text-lg font-bold text-[#EDEEF2] mb-3">Recommended Outreach Angles</h3>
              <div className="space-y-3">
                {analysis.outreach_angles.map((angle, i) => (
                  <div key={i} className="p-3 bg-[#6E4AFF]/10 border border-[#6E4AFF]/30 rounded-lg">
                    <p className="text-sm text-[#EDEEF2]">"{angle}"</p>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        )}
      </div>
    </div>
  );
}