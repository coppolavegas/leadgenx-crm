'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CampaignLead } from '@/lib/types';
import { 
  Phone, 
  Mail, 
  Globe, 
  MessageSquare, 
  Flame, 
  Star, 
  MapPin,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

interface LeadCardProps {
  lead: CampaignLead;
  index: number;
}

export function LeadCard({ lead, index }: LeadCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const enriched = lead.lead.enriched_lead;

  const hasPhone = !!lead.lead.phone;
  const hasEmail = enriched && enriched.emails_found.length > 0;
  const hasForm = !!enriched?.contact_form_url;
  const isFresh = new Date(lead.lead.discovered_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card
          className="hover:border-primary transition-all cursor-pointer group"
          onClick={() => setDrawerOpen(true)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {lead.lead.name}
                </CardTitle>
                {lead.lead.address && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {lead.lead.city}, {lead.lead.state}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{lead.campaign_score}</div>
                <p className="text-xs text-muted-foreground">score</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Rating */}
            {lead.lead.rating && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{lead.lead.rating.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm">
                  ({lead.lead.review_count} reviews)
                </span>
              </div>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {hasPhone && (
                <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <Phone className="h-3 w-3 mr-1" />
                  Phone
                </Badge>
              )}
              {hasEmail && (
                <Badge variant="default" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Badge>
              )}
              {hasForm && (
                <Badge variant="default" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Form
                </Badge>
              )}
              {isFresh && (
                <Badge variant="default" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                  <Flame className="h-3 w-3 mr-1" />
                  Fresh
                </Badge>
              )}
              {enriched?.enrichment_status === 'success' && (
                <Badge variant="outline">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Enriched
                </Badge>
              )}
            </div>

            {/* Stage */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Badge variant="secondary">{lead.stage}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(lead.created_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lead Proof Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{lead.lead.name}</SheetTitle>
            <SheetDescription>
              Score: {lead.campaign_score} | {lead.stage}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Why This Lead */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <Flame className="h-4 w-4 mr-2 text-orange-500" />
                Why This Lead
              </h3>
              <ul className="space-y-2 text-sm">
                {hasPhone && (
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <span>Direct phone number available</span>
                  </li>
                )}
                {hasEmail && (
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <span>Email address found ({enriched?.emails_found.length})</span>
                  </li>
                )}
                {hasForm && (
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <span>Contact form available</span>
                  </li>
                )}
                {lead.lead.rating && lead.lead.rating >= 4 && (
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <span>High rating ({lead.lead.rating.toFixed(1)} stars)</span>
                  </li>
                )}
                {isFresh && (
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <span>Recently discovered (within 7 days)</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="space-y-3">
                {lead.lead.phone && (
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <Phone className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <a href={`tel:${lead.lead.phone}`} className="font-medium hover:underline">
                        {lead.lead.phone}
                      </a>
                    </div>
                  </div>
                )}

                {enriched?.emails_found && enriched.emails_found.length > 0 && (
                  <div className="space-y-2">
                    {enriched.emails_found.map((email, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                        <Mail className="h-5 w-5 text-blue-500" />
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground">Email</div>
                          <a
                            href={`mailto:${email.email}`}
                            className="font-medium hover:underline"
                          >
                            {email.email}
                          </a>
                          <div className="text-xs text-muted-foreground mt-1">
                            Confidence: {email.confidence}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {enriched?.contact_form_url && (
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">Contact Form</div>
                      <a
                        href={enriched.contact_form_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline flex items-center"
                      >
                        View Form <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Source Links */}
            <div>
              <h3 className="font-semibold mb-3">Sources</h3>
              <div className="space-y-2">
                {lead.lead.google_place_id && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        lead.lead.name
                      )}&query_place_id=${lead.lead.google_place_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      View on Google Maps
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  </Button>
                )}
                {lead.lead.website && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a
                      href={lead.lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Visit Website
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* About */}
            {enriched?.about_text && (
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-sm text-muted-foreground">
                  {enriched.about_text.slice(0, 200)}
                  {enriched.about_text.length > 200 && '...'}
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Discovered</div>
                  <div className="font-medium">
                    {new Date(lead.lead.discovered_at).toLocaleDateString()}
                  </div>
                </div>
                {enriched && (
                  <div>
                    <div className="text-muted-foreground">Pages Crawled</div>
                    <div className="font-medium">{enriched.pages_crawled}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
