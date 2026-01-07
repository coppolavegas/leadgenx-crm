'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, MapPin, Play, Pause, Archive, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Campaign } from '@/lib/types';
import { motion } from 'framer-motion';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { variant: 'default', icon: Play },
      paused: { variant: 'secondary', icon: Pause },
      draft: { variant: 'outline', icon: null },
      archived: { variant: 'outline', icon: Archive },
    };
    const config = variants[status] || variants.draft;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant as any}>
        {Icon && <Icon className="h-3 w-3 mr-1" />}
        {status}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Campaigns</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your lead generation campaigns
            </p>
          </div>
          <Button onClick={() => router.push('/campaigns/new')} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Create your first campaign to start generating leads
              </p>
              <Button onClick={() => router.push('/campaigns/new')}>
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="hover:border-primary transition-colors cursor-pointer"
                  onClick={() => router.push(`/campaigns/${campaign.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getStatusBadge(campaign.status)}
                        </div>
                        <CardTitle className="flex items-center space-x-2">
                          <Target className="h-5 w-5 text-primary" />
                          <span>{campaign.name}</span>
                        </CardTitle>
                        {campaign.client && (
                          <CardDescription className="mt-2">
                            {campaign.client.name}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-2" />
                      {[campaign.geo_city, campaign.geo_state, campaign.geo_country]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{campaign.vertical}</Badge>
                      {campaign.sources_google_places && (
                        <Badge variant="outline">Google</Badge>
                      )}
                      {campaign.sources_reddit_intent && (
                        <Badge variant="outline">Reddit</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        {campaign._count?.campaign_leads || 0} leads
                      </div>
                      {campaign.last_run_at && (
                        <div className="text-xs text-muted-foreground">
                          Last run: {new Date(campaign.last_run_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
