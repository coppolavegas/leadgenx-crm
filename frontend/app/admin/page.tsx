'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Building2, Users, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
  async function checkAccess() {
    try {
  const response = await fetch('/admin/ping', {
    credentials: 'include',
  });

  if (response.ok) {
    setAuthorized(true);
  } else {
    router.push('/leads');
  }
}

    }
  }

  checkAccess();
}, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-white/60">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0118] text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent">
              Superadmin Console
            </h1>
            <p className="text-white/60 mt-2">Manage workspaces and system configuration</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/leads')}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer"
            onClick={() => router.push('/admin/workspaces')}
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-[#8b5cf6]/20 rounded-lg">
                <Building2 className="w-6 h-6 text-[#8b5cf6]" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white">Workspaces</h3>
                <p className="text-white/60 text-sm mt-1">
                  View and manage all organizations
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10 opacity-50">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-[#ec4899]/20 rounded-lg">
                <Users className="w-6 h-6 text-[#ec4899]" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white">Users</h3>
                <p className="text-white/60 text-sm mt-1">
                  Coming soon
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10 opacity-50">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-[#10b981]/20 rounded-lg">
                <Settings className="w-6 h-6 text-[#10b981]" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white">System Settings</h3>
                <p className="text-white/60 text-sm mt-1">
                  Coming soon
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats Overview */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4">System Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-white/60 text-sm">Total Workspaces</p>
              <p className="text-3xl font-bold text-white mt-1">-</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Active Users</p>
              <p className="text-3xl font-bold text-white mt-1">-</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Total Leads</p>
              <p className="text-3xl font-bold text-white mt-1">-</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">System Health</p>
              <p className="text-3xl font-bold text-[#10b981] mt-1">✓</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
