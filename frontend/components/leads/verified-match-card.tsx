'use client';

import { CheckCircle2, FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { Lead, FeatureMatch } from '@/lib/types';

interface VerifiedMatchCardProps {
  lead: Lead;
  onClick?: () => void;
}

export function VerifiedMatchCard({ lead, onClick }: VerifiedMatchCardProps) {
  const [showEvidence, setShowEvidence] = useState(false);
  
  const enriched = lead.enriched_lead;
  const verifiedMatches = enriched?.feature_matches?.filter(m => m.match_type === 'verified') || [];
  const preferenceMatches = enriched?.feature_matches?.filter(m => m.match_type === 'preference') || [];
  const finalScore = enriched?.final_score || 0;

  return (
    <GlassPanel intensity="medium" className="p-4 hover:border-[#6E4AFF]/50 transition-all cursor-pointer" onClick={onClick}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#EDEEF2] mb-1">{lead.name}</h3>
          <p className="text-sm text-[#8B90A0]">
            {lead.city && lead.state ? `${lead.city}, ${lead.state}` : lead.address}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#6E4AFF]">{Math.round(finalScore)}</div>
          <div className="text-xs text-[#8B90A0]">Match Score</div>
        </div>
      </div>

      {/* Match Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {verifiedMatches.length > 0 && (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {verifiedMatches.length} Verified
          </Badge>
        )}
        {preferenceMatches.length > 0 && (
          <Badge variant="outline" className="gap-1">
            <FileText className="w-3 h-3" />
            {preferenceMatches.length} Preferences
          </Badge>
        )}
      </div>

      {/* Score Breakdown */}
      {enriched?.scoring_breakdown && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8B90A0]">Verified Match</span>
            <span className="text-[#10B981] font-medium">{enriched.scoring_breakdown.verified}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8B90A0]">Preferences</span>
            <span className="text-[#6E4AFF] font-medium">{enriched.scoring_breakdown.preference}</span>
          </div>
        </div>
      )}

      {/* Evidence Toggle */}
      {verifiedMatches.length > 0 && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowEvidence(!showEvidence);
            }}
            className="gap-2 w-full"
          >
            {showEvidence ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Evidence
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Why This Lead?
              </>
            )}
          </Button>

          {showEvidence && (
            <div className="mt-3 space-y-2">
              {verifiedMatches.slice(0, 3).map((match, i) => (
                <div key={i} className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg">
                  <div className="flex items-start gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium text-[#EDEEF2]">{match.feature}</span>
                  </div>
                  {match.evidence && (
                    <>
                      <p className="text-xs text-[#8B90A0] mb-1 pl-6">
                        "{match.evidence.snippet}"
                      </p>
                      <a
                        href={match.evidence.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-[#4DE3FF] hover:underline flex items-center gap-1 pl-6"
                      >
                        View source
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact Info */}
      <div className="mt-3 pt-3 border-t border-[#8B90A0]/20 text-xs text-[#8B90A0] space-y-1">
        {lead.email && <div>Email: {lead.email}</div>}
        {lead.phone && <div>Phone: {lead.phone}</div>}
        {lead.website && (
          <a
            href={lead.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[#4DE3FF] hover:underline flex items-center gap-1"
          >
            Website
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </GlassPanel>
  );
}