import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * LeadGenX Glass Badge System
 * 
 * Variants:
 * - verified: Cyan glow with check icon (evidence-backed features)
 * - preference: Neutral outline (user preferences)
 * - excluded: Red muted (exclusion criteria)
 * - success: Green for positive states
 * - warning: Amber for caution
 * - default: Basic glass badge
 */

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 border",
  {
    variants: {
      variant: {
        verified:
          "bg-[rgba(77,227,255,0.12)] border-[#4DE3FF] text-[#4DE3FF] shadow-[0_0_12px_rgba(77,227,255,0.3)]",
        preference:
          "bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.15)] text-[#8B90A0] backdrop-blur-md",
        excluded:
          "bg-[rgba(239,68,68,0.12)] border-[#EF4444] text-[#EF4444] line-through",
        success:
          "bg-[rgba(16,185,129,0.12)] border-[#10B981] text-[#10B981]",
        warning:
          "bg-[rgba(245,158,11,0.12)] border-[#F59E0B] text-[#F59E0B]",
        default:
          "bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.15)] text-[#EDEEF2] backdrop-blur-md",
        primary:
          "bg-[rgba(110,74,255,0.12)] border-[#6E4AFF] text-[#9370FF] shadow-[0_0_12px_rgba(110,74,255,0.2)]",
        secondary:
          "bg-secondary/20 border-secondary/40 text-secondary-foreground hover:bg-secondary/30",
        destructive:
          "bg-destructive/20 border-destructive/40 text-destructive hover:bg-destructive/30",
        outline:
          "bg-transparent border-border text-foreground hover:bg-accent hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }