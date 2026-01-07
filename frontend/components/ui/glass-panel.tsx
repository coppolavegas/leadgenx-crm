import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * LeadGenX Glass Panel
 * 
 * A versatile glass container with different intensity levels.
 * Used for sections, modals, and content containers.
 */

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: "light" | "medium" | "strong"
  withBorder?: boolean
  withGlow?: "purple" | "cyan" | "none"
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, intensity = "light", withBorder = true, withGlow = "none", children, ...props }, ref) => {
    const intensityClasses = {
      light: "bg-[rgba(255,255,255,0.08)] backdrop-blur-xl",
      medium: "bg-[rgba(255,255,255,0.12)] backdrop-blur-2xl",
      strong: "bg-[rgba(255,255,255,0.16)] backdrop-blur-3xl",
    }

    const glowClasses = {
      purple: "shadow-[0_0_20px_rgba(110,74,255,0.3)]",
      cyan: "shadow-[0_0_20px_rgba(77,227,255,0.3)]",
      none: "",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl",
          intensityClasses[intensity],
          withBorder && "border border-[rgba(255,255,255,0.15)]",
          glowClasses[withGlow],
          "transition-all duration-200 ease-out",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassPanel.displayName = "GlassPanel"

export { GlassPanel }