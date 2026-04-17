import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.08em] text-neutral-600">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "input-field focus-ring",
            error &&
              "border-red-500 bg-red-50/40 focus:border-red-500 focus-visible:ring-red-300",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
