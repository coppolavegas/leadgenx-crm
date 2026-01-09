'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Building2, Users, Calendar, Save, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  created_at: string;
  updated_at: string;
  user_count: number;
  feature_discovery: boolean;
  feature_enrichment: boolean;
  feature_verification: boolean;
  feature_crm: boolean;
  feature_outreach: boolean;
  feature_inbox: boolean;
  feature_analytics: boolean;
  feature_genie_ai: boolean;
  feature_x_suite: boolean;
  feature_website_intel: boolean;
}

interface FeatureToggle {
  key: keyof Workspace;
  label: string;
  description: string;
  premium?: boolean;
}

const features: FeatureToggle[] = [
  {
    key: 'feature_discovery',
    label: 'Lead Discovery',
    description: 'Enable lead discovery and search capabilities',
  },
  {
    key: 'feature_enrichment',
    label: 'Data Enrichment',
    description: 'Enrich leads with additional data sources',
  },
  {
    key: 'feature_verification',
    label: 'Verified Match',
    description: 'AI-powered lead verification and matching',
  },
  {
    key: 'feature_crm',
    label: 'CRM Pipeline',
    description: 'Full CRM pipeline and deal management',
  },
  {
    key: 'feature_outreach',
    label: 'Outreach & Sequences',
    description: 'Email sequences and outreach automation',
  },
  {
    key: 'feature_inbox',
    label: 'Unified Inbox',
    description: 'Centralized inbox for all communications',
  },
  {
    key: 'feature_analytics',
    label: 'Analytics Dashboard',
    description: 'Advanced analytics and reporting',
  },
  {
    key: 'feature_genie_ai',
    label: 'Genie AI Assistant',
    description: 'Conversational AI assistant for lead generation',
  },
  {
    key: 'feature_x_suite',
    label: 'X Suite Integration',
    description: 'Premium integration with X/Twitter platform',
    premium: true,
  },
  {
    key: 'feature_website_intel',
    label: 'Website Intelligence',
    description: 'Website analysis and visitor tracking',
  },
];

export default function WorkspaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [featureStates, setFeatureStates] = useState<Partial<Workspace>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorkspace() {
      try {
        const response = await apiClient.get(`/admin/workspaces/${workspaceId}`);
const data = response.data;
setWorkspace(data);
          // Initialize feature states
          const initialStates: Partial<Workspace> = {};
          features.forEach((feature) => {
            initialStates[feature.key] = data[feature.key];
          });
          setFeatureStates(initialStates);
        } else {
          router.push('/admin/workspaces');
        }
      } catch (error) {
        console.error('Failed to fetch workspace:', error);
        router.push('/admin/workspaces');
      } finally {
        setLoading(false);
      }
    }
    fetchWorkspace();
  }, [workspaceId, router]);

  const handleFeatureToggle = (key: keyof Workspace, value: boolean) => {
    setFeatureStates((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await apiClient(`/admin/workspaces/${workspaceId}/features`, {
        method: 'PATCH',
        body: JSON.stringify(featureStates),
      });

      if (response.ok) {
        const updated = await response.json();
        setWorkspace(updated);
        setHasChanges(false);
        // Show success message briefly
        setTimeout(() => {
          setError(null);
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update features');
      }
    } catch (error) {
      console.error('Failed to save features:', error);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (workspace) {
      const resetStates: Partial<Workspace> = {};
      features.forEach((feature) => {
        resetStates[feature.key] = workspace[feature.key];
      });
      setFeatureStates(resetStates);
      setHasChanges(false);
      setError(null);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'growth':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'starter':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0118]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-white/60">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0118] text-white p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/workspaces')}
              className="text-white/60 hover:text-white mt-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-white">{workspace.name}</h1>
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPlanBadgeColor(workspace.plan)}`}>
                  {workspace.plan.toUpperCase()}
                </span>
              </div>
              <p className="text-white/60 text-sm mt-1">@{workspace.slug}</p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-white/5 border-white/10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#8b5cf6]/20 rounded-lg">
                <Users className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Users</p>
                <p className="text-2xl font-bold text-white">{workspace.user_count}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white/5 border-white/10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#ec4899]/20 rounded-lg">
                <Calendar className="w-5 h-5 text-[#ec4899]" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Created</p>
                <p className="text-sm font-semibold text-white">
                  {format(new Date(workspace.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white/5 border-white/10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#10b981]/20 rounded-lg">
                <Building2 className="w-5 h-5 text-[#10b981]" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Workspace ID</p>
                <p className="text-xs font-mono text-white">{workspace.id.substring(0, 8)}...</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Save Banner */}
        {hasChanges && (
          <Card className="p-4 bg-[#8b5cf6]/10 border-[#8b5cf6]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-[#8b5cf6]" />
                <div>
                  <p className="text-white font-medium">Unsaved Changes</p>
                  <p className="text-white/60 text-sm">You have unsaved feature flag changes</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={saving}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#8b5cf6] text-white hover:bg-[#7c3aed]"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="p-4 bg-red-500/10 border-red-500/30">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </Card>
        )}

        {/* Feature Flags */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-xl font-semibold text-white mb-6">GenX OS Feature Modules</h2>
          <div className="space-y-4">
            {features.map((feature) => (
              <div
                key={feature.key}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-white font-medium">{feature.label}</h3>
                    {feature.premium && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white rounded-full">
                        PREMIUM
                      </span>
                    )}
                  </div>
                  <p className="text-white/60 text-sm mt-1">{feature.description}</p>
                </div>
                <Switch
                  checked={featureStates[feature.key] as boolean}
                  onCheckedChange={(checked) => handleFeatureToggle(feature.key, checked)}
                  className="data-[state=checked]:bg-[#8b5cf6]"
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
