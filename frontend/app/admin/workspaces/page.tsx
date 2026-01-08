'use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Building2, Users, Calendar } from 'lucide-react';
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

export default function WorkspacesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    async function fetchWorkspaces() {
      try {
       const response = await fetch(`/admin/workspaces/${workspaceId}`, {
  credentials: "include",
})
        if (response.ok) {
          const data = await response.json();
          setWorkspaces(data);
        } else {
          router.push('/admin');
        }
      } catch (error) {
        console.error('Failed to fetch workspaces:', error);
        router.push('/admin');
      } finally {
        setLoading(false);
      }
    }
    fetchWorkspaces();
  }, [router]);

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
          <p className="mt-4 text-white/60">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0118] text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin')}
              className="text-white/60 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Workspaces</h1>
              <p className="text-white/60 text-sm mt-1">
                {workspaces.length} {workspaces.length === 1 ? 'workspace' : 'workspaces'} total
              </p>
            </div>
          </div>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 gap-4">
          {workspaces.map((workspace) => (
            <Card
              key={workspace.id}
              className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer"
              onClick={() => router.push(`/admin/workspaces/${workspace.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="p-3 bg-[#8b5cf6]/20 rounded-lg">
                    <Building2 className="w-6 h-6 text-[#8b5cf6]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-semibold text-white">{workspace.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPlanBadgeColor(workspace.plan)}`}>
                        {workspace.plan.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm mt-1">@{workspace.slug}</p>
                    <div className="flex items-center space-x-6 mt-3 text-sm">
                      <div className="flex items-center space-x-2 text-white/60">
                        <Users className="w-4 h-4" />
                        <span>{workspace.user_count} {workspace.user_count === 1 ? 'user' : 'users'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-white/60">
                        <Calendar className="w-4 h-4" />
                        <span>Created {format(new Date(workspace.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/admin/workspaces/${workspace.id}`);
                  }}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Manage
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {workspaces.length === 0 && (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white">No workspaces found</h3>
            <p className="text-white/60 mt-2">There are no workspaces in the system yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
