import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${React.useId()}`;

    return (
      <div className="flex items-start">
        <div className="relative flex items-center">
          <input
            id={checkboxId}
            type="checkbox"
            className={cn(
              "peer h-5 w-5 shrink-0 rounded border-2 border-neutral-300 bg-white",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "checked:bg-primary-600 checked:border-primary-600",
              error && "border-error-500",
              className
            )}
            ref={ref}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${checkboxId}-error` : undefined}
            {...props}
          />
          <Check
            className={cn(
              "absolute left-0.5 top-0.5 h-4 w-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100",
              "transition-opacity"
            )}
          />
        </div>
        {label && (
          <label
            htmlFor={checkboxId}
            className="ml-3 text-sm text-neutral-700 cursor-pointer select-none"
          >
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        {error && (
          <p
            id={`${checkboxId}-error`}
            className="ml-8 mt-1 text-sm text-error-500"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
