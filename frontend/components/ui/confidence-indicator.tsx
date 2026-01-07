import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * LeadGenX Confidence Indicator
 * 
 * Circular progress ring with gradient from cyan to purple.
 * Used for displaying match scores and confidence levels.
 */

interface ConfidenceIndicatorProps {
  score: number // 0-100
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

const sizeConfig = {
  sm: {
    size: 48,
    strokeWidth: 4,
    fontSize: "text-xs",
  },
  md: {
    size: 64,
    strokeWidth: 5,
    fontSize: "text-sm",
  },
  lg: {
    size: 96,
    strokeWidth: 6,
    fontSize: "text-lg",
  },
}

export function ConfidenceIndicator({
  score,
  size = "md",
  showLabel = true,
  className,
}: ConfidenceIndicatorProps) {
  const config = sizeConfig[size]
  const normalizedScore = Math.min(Math.max(score, 0), 100)
  const radius = (config.size - config.strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (normalizedScore / 100) * circumference

  // Color based on score
  const getColor = (score: number) => {
    if (score >= 80) return "#4DE3FF" // Cyan - Excellent
    if (score >= 60) return "#6E4AFF" // Purple - Good
    if (score >= 40) return "#F59E0B" // Amber - Medium
    return "#EF4444" // Red - Low
  }

  const color = getColor(normalizedScore)

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: config.size, height: config.size }}
    >
      {/* Background Circle */}
      <svg
        className="absolute inset-0 transform -rotate-90"
        width={config.size}
        height={config.size}
      >
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={config.strokeWidth}
          fill="none"
        />
        
        {/* Progress Circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          stroke={color}
          strokeWidth={config.strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${color}40)`,
          }}
        />
      </svg>
      
      {/* Score Display */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-bold leading-none",
              config.fontSize
            )}
            style={{ color }}
          >
            {Math.round(normalizedScore)}
          </span>
          <span className="text-[10px] text-[#8B90A0] mt-0.5">score</span>
        </div>
      )}
    </div>
  )
}