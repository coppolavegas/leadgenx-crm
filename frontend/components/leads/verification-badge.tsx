'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, FileText } from 'lucide-react';
import { FeatureMatch } from '@/lib/types';

interface VerificationBadgeProps {
  featureMatches?: FeatureMatch[];
  size?: 'sm' | 'md' | 'lg';
}

export function VerificationBadge({
  featureMatches,
  size = 'md',
}: VerificationBadgeProps) {
  if (!featureMatches || featureMatches.length === 0) {
    return null;
  }

  const verifiedCount = featureMatches.filter(
    (m) => m.match_type === 'verified'
  ).length;
  const preferenceCount = featureMatches.filter(
    (m) => m.match_type === 'preference'
  ).length;

  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const badgeSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex flex-wrap gap-1.5">
      {verifiedCount > 0 && (
        <Badge
          className={`bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20 ${badgeSize}`}
        >
          <CheckCircle2 className={`${iconSize} mr-1`} />
          {verifiedCount} Verified
        </Badge>
      )}
      {preferenceCount > 0 && (
        <Badge
          variant="outline"
          className={`bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900 ${badgeSize}`}
        >
          <FileText className={`${iconSize} mr-1`} />
          {preferenceCount} Preference
        </Badge>
      )}
    </div>
  );
}
