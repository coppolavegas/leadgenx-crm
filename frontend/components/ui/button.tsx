import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * LeadGenX Glass Button System
 * 
 * Variants:
 * - primary: Royal purple with glow (main CTAs)
 * - secondary: Cyan outline (alternative actions)
 * - ghost: Transparent with hover underline
 * - danger: Muted red for destructive actions
 * - glass: Frosted glass effect
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-[1px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        primary:
          "bg-[#6E4AFF] text-white shadow-[0_0_16px_rgba(110,74,255,0.3)] hover:shadow-[0_0_20px_rgba(110,74,255,0.4)] hover:bg-[#7D5AFF] hover:scale-[1.02] font-semibold",
        secondary:
          "border-2 border-[#4DE3FF] text-[#4DE3FF] bg-transparent hover:bg-[rgba(77,227,255,0.1)] hover:shadow-[0_0_12px_rgba(77,227,255,0.3)] hover:scale-[1.02]",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        glass:
          "bg-[rgba(255,255,255,0.08)] backdrop-blur-xl border border-[rgba(255,255,255,0.15)] text-white hover:bg-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.25)] hover:scale-[1.02]",
        ghost:
          "text-[#EDEEF2] hover:text-[#4DE3FF] hover:bg-[rgba(255,255,255,0.05)] relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[2px] after:bg-[#4DE3FF] after:transition-all hover:after:w-3/4",
        danger:
          "bg-[#7F1D1D] text-white border border-[#EF4444] hover:bg-[#991B1B] hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]",
        link:
          "text-[#4DE3FF] underline-offset-4 hover:underline hover:text-[#2FFFD5]",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }