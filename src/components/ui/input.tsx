import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary/20 selection:text-foreground bg-white dark:bg-[#393E47] dark:text-[#F5F5F5] border-input border dark:border-[#494E59] flex h-9 w-full min-w-0 rounded-md px-3 py-1 text-base shadow-xs outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:opacity-50 read-only:select-text md:text-sm",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
