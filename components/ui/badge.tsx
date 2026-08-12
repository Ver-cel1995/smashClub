import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-neutral-800 text-white hover:bg-neutral-800/80",
        secondary:
          "border-transparent bg-[var(--accent-color,#a3e635)] text-[var(--accent-foreground,#09090b)] hover:bg-[var(--accent-hover,#84cc16)]",
        destructive:
          "border-transparent bg-rose-500/20 text-rose-400 border-rose-500/30",
        outline: "text-neutral-200 border-neutral-700",
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
