import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default:
        "bg-neutral-100 text-neutral-700 border-neutral-200",
      success:
        "bg-success-50 text-success-700 border-success-200",
      warning:
        "bg-warning-50 text-warning-700 border-warning-200",
      error:
        "bg-error-50 text-error-700 border-error-200",
      info:
        "bg-primary-50 text-primary-700 border-primary-200",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
