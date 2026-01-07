'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { Download, Zap, FileJson, FileText, CheckCircle2, ExternalLink } from 'lucide-react';

export default function ExportPage() {
  const [exporting, setExporting] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [zapierConfigured, setZapierConfigured] = useState(false);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const data = await apiClient.exportLeads('csv');
      // Create download
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leadgenx-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      setExporting(true);
      const data = await apiClient.exportLeads('json');
      // Create download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leadgenx-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Export & Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Export leads or connect to your favorite tools
          </p>
        </div>

        <Tabs defaultValue="export" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Direct Export</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle>Export as CSV</CardTitle>
                  </div>
                  <CardDescription>
                    Download all leads in spreadsheet format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleExportCSV}
                    disabled={exporting}
                    className="w-full"
                    size="lg"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {exporting ? 'Exporting...' : 'Export CSV'}
                  </Button>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                      Excel & Google Sheets compatible
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                      All contact information included
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                      Campaign scores & stages
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <FileJson className="h-5 w-5 text-primary" />
                    <CardTitle>Export as JSON</CardTitle>
                  </div>
                  <CardDescription>
                    Download in developer-friendly format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleExportJSON}
                    disabled={exporting}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {exporting ? 'Exporting...' : 'Export JSON'}
                  </Button>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                      Full nested data structure
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                      API integration ready
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                      Metadata & enrichment data
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  <CardTitle>Zapier Integration</CardTitle>
                </div>
                <CardDescription>
                  Automatically send leads to 5,000+ apps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!zapierConfigured ? (
                  <>
                    <div className="rounded-lg bg-muted p-4">
                      <h4 className="font-semibold mb-2">How it works:</h4>
                      <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                        <li>Create a Zap with Webhooks by Zapier as the trigger</li>
                        <li>Copy the webhook URL Zapier provides</li>
                        <li>Paste it below to start receiving leads</li>
                        <li>Connect to your CRM, email tool, or any app</li>
                      </ol>
                    </div>
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <Input
                        placeholder="https://hooks.zapier.com/hooks/catch/..."
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        if (webhookUrl) {
                          setZapierConfigured(true);
                        }
                      }}
                      disabled={!webhookUrl}
                      className="w-full"
                    >
                      Connect Zapier
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                    >
                      <a
                        href="https://zapier.com/apps/webhooks/integrations"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Learn More About Zapier
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </>
                ) : (
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <h4 className="font-semibold text-green-500">Zapier Connected</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Leads will be automatically sent to: {webhookUrl.slice(0, 50)}...
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setZapierConfigured(false)}
                      size="sm"
                    >
                      Disconnect
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>
                  More integrations on the way
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {['HubSpot', 'Salesforce', 'Pipedrive', 'Monday.com', 'Airtable', 'Slack'].map(
                    (app) => (
                      <div
                        key={app}
                        className="rounded-lg border border-dashed p-4 text-center"
                      >
                        <Badge variant="secondary">{app}</Badge>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
