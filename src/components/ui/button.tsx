import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98] active:translate-y-[1px] hover:scale-[1.05]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary/20 shadow-xs hover:bg-primary/90 hover:border-primary/60 hover:ring-2 hover:ring-primary/30 dark:border-primary/30 dark:hover:border-primary/60 active:bg-primary/80",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 hover:ring-2 hover:ring-destructive/30 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 active:bg-destructive/80",
        outline:
          "border border-border/80 bg-background shadow-xs hover:bg-accent hover:text-accent-foreground hover:border-primary/50 hover:ring-2 hover:ring-primary/20 dark:bg-transparent dark:border-border/60 dark:hover:bg-accent/60 dark:hover:border-primary/50 active:bg-accent/70 dark:active:bg-accent/40",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 hover:ring-2 hover:ring-secondary/30 active:bg-secondary/70",
        ghost:
          "hover:bg-accent hover:text-accent-foreground hover:ring-2 hover:ring-primary/20 dark:hover:bg-accent/50 active:bg-accent/70 dark:active:bg-accent/40",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 hover:scale-[1.02] active:text-primary/70",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
