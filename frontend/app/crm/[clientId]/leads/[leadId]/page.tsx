'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  CheckCircle2, 
  FileText, 
  ExternalLink, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  Send,
  Calendar,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import type { Lead } from '@/lib/types';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { clientId, leadId } = params as { clientId: string; leadId: string };
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'evidence' | 'notes' | 'tasks'>('evidence');
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://leadgenx.app';
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE}/leads/${leadId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch lead');
      
      const data = await response.json();
      setLead(data);
    } catch (error) {
      console.error('Failed to fetch lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;

    try {
      setSavingNote(true);
      // TODO: Connect to API
      // POST /crm/:clientId/activities
      await new Promise(resolve => setTimeout(resolve, 500));
      
      alert('Note saved successfully!');
      setNewNote('');
    } catch (error) {
      alert('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSendToAutoGenX = () => {
    // TODO: Implement AutoGenX integration
    alert(`Send ${lead?.name} to AutoGenX for automated outreach - Coming soon!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#6E4AFF] animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[#8B90A0]">
        Lead not found
      </div>
    );
  }

  const enriched = lead.enriched_lead;
  const verifiedMatches = enriched?.feature_matches?.filter(m => m.match_type === 'verified') || [];
  const preferenceMatches = enriched?.feature_matches?.filter(m => m.match_type === 'preference') || [];
  const finalScore = enriched?.final_score || 0;

  return (
    <div className="min-h-screen bg-[#0B0E14] p-6">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6E4AFF] rounded-full blur-[128px] opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4DE3FF] rounded-full blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Header */}
            <GlassPanel intensity="strong" className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-[#EDEEF2] mb-2">{lead.name}</h1>
                  <div className="flex items-center gap-2 text-[#8B90A0]">
                    {lead.city && lead.state && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {lead.city}, {lead.state}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-[#6E4AFF]">{Math.round(finalScore)}</div>
                  <div className="text-sm text-[#8B90A0]">Match Score</div>
                </div>
              </div>

              {/* Match Summary */}
              <div className="flex gap-3">
                {verifiedMatches.length > 0 && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {verifiedMatches.length} Verified Matches
                  </Badge>
                )}
                {preferenceMatches.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <FileText className="w-4 h-4" />
                    {preferenceMatches.length} Preferences
                  </Badge>
                )}
              </div>

              {/* Score Breakdown */}
              {enriched?.scoring_breakdown && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg">
                    <div className="text-xs text-[#8B90A0] mb-1">Verified Match</div>
                    <div className="text-2xl font-bold text-[#10B981]">{enriched.scoring_breakdown.verified}</div>
                  </div>
                  <div className="p-3 bg-[#6E4AFF]/10 border border-[#6E4AFF]/30 rounded-lg">
                    <div className="text-xs text-[#8B90A0] mb-1">Preferences</div>
                    <div className="text-2xl font-bold text-[#6E4AFF]">{enriched.scoring_breakdown.preference}</div>
                  </div>
                </div>
              )}
            </GlassPanel>

            {/* Tabs */}
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'evidence' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('evidence')}
                className="flex-1"
              >
                Evidence
              </Button>
              <Button
                variant={activeTab === 'notes' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('notes')}
                className="flex-1"
              >
                Notes
              </Button>
              <Button
                variant={activeTab === 'tasks' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('tasks')}
                className="flex-1"
              >
                Tasks
              </Button>
            </div>

            {/* Evidence Tab */}
            {activeTab === 'evidence' && (
              <div className="space-y-4">
                {/* Verified Matches */}
                {verifiedMatches.length > 0 && (
                  <GlassPanel intensity="medium" className="p-6">
                    <h3 className="text-lg font-bold text-[#EDEEF2] mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                      Verified Matches
                    </h3>
                    <div className="space-y-3">
                      {verifiedMatches.map((match, i) => (
                        <div key={i} className="p-4 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg">
                          <div className="font-medium text-[#EDEEF2] mb-2">{match.feature}</div>
                          {match.evidence && (
                            <>
                              <p className="text-sm text-[#8B90A0] mb-2 italic">
                                "{match.evidence.snippet}"
                              </p>
                              <a
                                href={match.evidence.page_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[#4DE3FF] hover:underline flex items-center gap-1"
                              >
                                View source page
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="success" className="text-xs">
                              {Math.round(match.confidence * 100)}% confidence
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassPanel>
                )}

                {/* Preference Matches */}
                {preferenceMatches.length > 0 && (
                  <GlassPanel intensity="medium" className="p-6">
                    <h3 className="text-lg font-bold text-[#EDEEF2] mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#6E4AFF]" />
                      Preference Matches
                    </h3>
                    <div className="space-y-2">
                      {preferenceMatches.map((match, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-[#EDEEF2]">
                          <FileText className="w-4 h-4 text-[#6E4AFF]" />
                          {match.feature}
                        </div>
                      ))}
                    </div>
                  </GlassPanel>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <GlassPanel intensity="medium" className="p-6">
                <h3 className="text-lg font-bold text-[#EDEEF2] mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Notes
                </h3>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Add a note about this lead..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={4}
                  />
                  <Button
                    onClick={handleSaveNote}
                    disabled={savingNote || !newNote.trim()}
                    className="gap-2"
                  >
                    {savingNote ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Note'
                    )}
                  </Button>
                  <div className="pt-4 border-t border-[#8B90A0]/20 text-center text-sm text-[#8B90A0]">
                    No notes yet. Add your first note above.
                  </div>
                </div>
              </GlassPanel>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <GlassPanel intensity="medium" className="p-6">
                <h3 className="text-lg font-bold text-[#EDEEF2] mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Tasks
                </h3>
                <div className="text-center py-8 text-[#8B90A0]">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Task management coming soon</p>
                  <p className="text-xs mt-1">Schedule follow-ups, calls, and meetings</p>
                </div>
              </GlassPanel>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <GlassPanel intensity="strong" className="p-4">
              <h3 className="text-sm font-bold text-[#EDEEF2] mb-3">Actions</h3>
              <div className="space-y-2">
                <Button
                  className="w-full gap-2"
                  onClick={handleSendToAutoGenX}
                >
                  <Send className="w-4 h-4" />
                  Send to AutoGenX
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Mail className="w-4 h-4" />
                  Send Email
                </Button>
              </div>
            </GlassPanel>

            {/* Contact Info */}
            <GlassPanel intensity="medium" className="p-4">
              <h3 className="text-sm font-bold text-[#EDEEF2] mb-3">Contact Information</h3>
              <div className="space-y-3">
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center gap-2 text-sm text-[#EDEEF2] hover:text-[#4DE3FF] transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    {lead.email}
                  </a>
                )}
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center gap-2 text-sm text-[#EDEEF2] hover:text-[#4DE3FF] transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {lead.phone}
                  </a>
                )}
                {lead.website && (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#EDEEF2] hover:text-[#4DE3FF] transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {lead.address && (
                  <div className="flex items-start gap-2 text-sm text-[#8B90A0]">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    {lead.address}
                  </div>
                )}
              </div>
            </GlassPanel>

            {/* Enrichment Status */}
            {enriched && (
              <GlassPanel intensity="medium" className="p-4">
                <h3 className="text-sm font-bold text-[#EDEEF2] mb-3">Enrichment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8B90A0]">Status</span>
                    <Badge variant="success" className="text-xs">
                      {enriched.enrichment_status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B90A0]">Pages Crawled</span>
                    <span className="text-[#EDEEF2]">{enriched.pages_crawled}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B90A0]">Emails Found</span>
                    <span className="text-[#EDEEF2]">{enriched.emails_found?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B90A0]">Phones Found</span>
                    <span className="text-[#EDEEF2]">{enriched.phones_found?.length || 0}</span>
                  </div>
                </div>
              </GlassPanel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}