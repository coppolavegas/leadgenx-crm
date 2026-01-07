'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { Lead } from '@/lib/types';
import { Database, Search, Filter, Phone, Mail, Globe, Star, MapPin, Award, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { VerificationBadge } from '@/components/leads/verification-badge';
import { EvidenceModal } from '@/components/leads/evidence-modal';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReady, setFilterReady] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<{ id: string; name: string } | null>(null);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.getLeads({
        page: 1,
        limit: 100,
        lead_ready: filterReady === 'ready' ? true : undefined,
      });
      setLeads(data);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [filterReady]);

  const filteredLeads = leads.filter((lead) =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">All Leads</h1>
          <p className="text-muted-foreground mt-1">
            Browse and manage all discovered leads across campaigns
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterReady} onValueChange={setFilterReady}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="ready">Lead-Ready Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leads Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-3/4"></div>
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
        ) : filteredLeads.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No leads found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm ? 'Try adjusting your search' : 'Run a campaign to discover leads'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredLeads.map((lead, index) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="hover:border-primary transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{lead.name}</CardTitle>
                    {lead.address && (
                      <CardDescription className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {lead.city}, {lead.state}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Phase 13: Verification Score */}
                    {lead.enriched_lead?.final_score !== undefined && (
                      <div className="flex items-center justify-between bg-primary/5 rounded-lg p-2 border border-primary/10">
                        <div className="flex items-center">
                          <Award className="h-4 w-4 text-primary mr-2" />
                          <span className="text-sm font-medium">Match Score</span>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          {lead.enriched_lead.final_score.toFixed(0)}/100
                        </span>
                      </div>
                    )}

                    {/* Rating */}
                    {lead.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{lead.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground text-sm">
                          ({lead.review_count})
                        </span>
                      </div>
                    )}

                    {/* Phase 13: Verification Badges */}
                    {lead.enriched_lead?.feature_matches && (
                      <div>
                        <VerificationBadge
                          featureMatches={lead.enriched_lead.feature_matches}
                          size="sm"
                        />
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-2">
                      {lead.phone && (
                        <Badge
                          variant="default"
                          className="bg-green-500/10 text-green-500 border-green-500/20"
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Phone
                        </Badge>
                      )}
                      {(lead.enriched_lead?.emails_found?.length ?? 0) > 0 && (
                        <Badge
                          variant="default"
                          className="bg-blue-500/10 text-blue-500 border-blue-500/20"
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Badge>
                      )}
                      {lead.website && (
                        <Badge variant="outline">
                          <Globe className="h-3 w-3 mr-1" />
                          Website
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2 border-t">
                      {/* Phase 13: View Evidence Button */}
                      {lead.enriched_lead?.feature_matches && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedLead({ id: lead.id, name: lead.name })}
                        >
                          <Info className="h-3 w-3 mr-1" />
                          Evidence
                        </Button>
                      )}
                      {lead.website && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <a href={lead.website} target="_blank" rel="noopener noreferrer">
                            Visit
                          </a>
                        </Button>
                      )}
                      {lead.phone && (
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <a href={`tel:${lead.phone}`}>Call</a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Phase 13: Evidence Modal */}
        {selectedLead && (
          <EvidenceModal
            leadId={selectedLead.id}
            leadName={selectedLead.name}
            open={!!selectedLead}
            onOpenChange={(open) => !open && setSelectedLead(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
