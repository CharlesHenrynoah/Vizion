import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, placeholder = "Mention similar softwares that inspire you..", ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-0 focus-visible:border-0 border-0 ring-0 outline-none resize-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        placeholder={placeholder}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = "Textarea"

export { Textarea }

