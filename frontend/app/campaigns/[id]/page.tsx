'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/api-client';
import { Campaign, CampaignRun, CampaignLead } from '@/lib/types';
import { 
  Play, 
  MapPin, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  Flame
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LeadCard } from '@/components/campaigns/lead-card';
import { CampaignBrief } from '@/components/campaigns/campaign-brief';
import { VerificationSummaryWidget } from '@/components/campaigns/verification-summary';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [runs, setRuns] = useState<CampaignRun[]>([]);
  const [leads, setLeads] = useState<CampaignLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignData, runsData] = await Promise.all([
        apiClient.getCampaign(campaignId),
        apiClient.getCampaignRuns(campaignId),
      ]);
      setCampaign(campaignData);
      setRuns(runsData);
    } catch (error) {
      console.error('Failed to load campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      setLeadsLoading(true);
      const { data } = await apiClient.getCampaignLeads(campaignId, {
        page: 1,
        limit: 50,
      });
      setLeads(data);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLeadsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadLeads();
  }, [campaignId]);

  const handleRunCampaign = async () => {
    if (!confirm('Run this campaign now? This will discover and enrich new leads.')) {
      return;
    }
    try {
      setRunning(true);
      await apiClient.runCampaign(campaignId);
      await loadData();
      await loadLeads();
      alert('Campaign run completed successfully!');
    } catch (error) {
      console.error('Failed to run campaign:', error);
      alert('Failed to run campaign');
    } finally {
      setRunning(false);
    }
  };

  if (loading || !campaign) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="grid gap-6 md:grid-cols-3 mt-8">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-muted rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const latestRun = runs[0];
  const stats = latestRun?.stats || {
    leads_discovered: 0,
    leads_enriched: 0,
    lead_ready_count: 0,
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/campaigns')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{campaign.name}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                  {campaign.status}
                </Badge>
                {campaign.client && (
                  <span className="text-muted-foreground">{campaign.client.name}</span>
                )}
                <div className="flex items-center text-muted-foreground text-sm">
                  <MapPin className="h-4 w-4 mr-1" />
                  {[campaign.geo_city, campaign.geo_state].filter(Boolean).join(', ')}
                </div>
              </div>
            </div>
            <Button
              onClick={handleRunCampaign}
              disabled={running}
              size="lg"
            >
              <Play className="mr-2 h-4 w-4" />
              {running ? 'Running...' : 'Run Campaign'}
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Leads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {campaign._count?.campaign_leads || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  {stats.leads_discovered} in last run
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Lead-Ready</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">
                  {stats.lead_ready_count}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <CheckCircle className="inline h-3 w-3 mr-1" />
                  {stats.leads_enriched} enriched
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Avg Score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {leads.length > 0
                    ? Math.round(
                        leads.reduce((sum, l) => sum + l.campaign_score, 0) / leads.length
                      )
                    : 0}
                </div>
                <Progress 
                  value={leads.length > 0
                    ? leads.reduce((sum, l) => sum + l.campaign_score, 0) / leads.length
                    : 0} 
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Last Run</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {campaign.last_run_at
                    ? new Date(campaign.last_run_at).toLocaleDateString()
                    : 'Never'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <Clock className="inline h-3 w-3 mr-1" />
                  {runs.length} total runs
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="brief">Campaign Brief</TabsTrigger>
            <TabsTrigger value="runs">Run History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-4">
            {/* Phase 13: Verification Summary */}
            {leads.length > 0 && (
              <VerificationSummaryWidget campaignId={campaignId} />
            )}

            {leadsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading leads...</p>
              </div>
            ) : leads.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No leads yet</h3>
                  <p className="text-muted-foreground mb-4 text-center">
                    Run this campaign to discover and enrich leads
                  </p>
                  <Button onClick={handleRunCampaign} disabled={running}>
                    <Play className="mr-2 h-4 w-4" />
                    {running ? 'Running...' : 'Run Campaign'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {leads.map((lead, index) => (
                  <LeadCard key={lead.id} lead={lead} index={index} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Campaign Brief Tab */}
          <TabsContent value="brief">
            <CampaignBrief
              campaignId={campaignId}
              initialBrief={campaign.client_brief}
              initialProfile={campaign.targeting_profile}
              onUpdate={loadData}
            />
          </TabsContent>

          {/* Run History Tab */}
          <TabsContent value="runs" className="space-y-4">
            {runs.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No runs yet</h3>
                  <p className="text-muted-foreground text-center">
                    This campaign hasn't been run yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {runs.map((run) => (
                  <Card key={run.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {new Date(run.started_at).toLocaleString()}
                          </CardTitle>
                          <CardDescription>
                            {run.run_type} run
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            run.status === 'success'
                              ? 'default'
                              : run.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {run.status === 'success' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {run.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {run.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Discovered</div>
                          <div className="text-2xl font-bold">{run.stats.leads_discovered}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Enriched</div>
                          <div className="text-2xl font-bold">{run.stats.leads_enriched}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Ready</div>
                          <div className="text-2xl font-bold text-green-500">
                            {run.stats.lead_ready_count}
                          </div>
                        </div>
                      </div>
                      {run.logs && run.logs.length > 0 && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <div className="text-xs font-mono space-y-1">
                            {run.logs.slice(0, 5).map((log, i) => (
                              <div key={i} className="text-muted-foreground">
                                {log}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Targeting</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vertical:</span>
                      <span className="font-medium">{campaign.vertical}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">
                        {[campaign.geo_city, campaign.geo_state, campaign.geo_country]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Radius:</span>
                      <span className="font-medium">{campaign.geo_radius_miles} miles</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Data Sources</h4>
                  <div className="flex space-x-2">
                    {campaign.sources_google_places && <Badge>Google Places</Badge>}
                    {campaign.sources_reddit_intent && <Badge>Reddit Intent</Badge>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Scoring Weights</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(campaign.scoring_weights).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">
                          {key.replace('_weight', '').replace('_', ' ')}
                        </span>
                        <span className="font-medium">{value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
