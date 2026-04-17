import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-semibold tracking-[-0.01em] transition-all duration-200 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100";
    
    const variants = {
      primary:
        "bg-gradient-to-br from-primary-500 to-primary-700 text-paper shadow-soft hover:-translate-y-0.5 hover:shadow-premium",
      secondary:
        "bg-gradient-to-br from-accent-500 to-accent-700 text-paper shadow-soft hover:-translate-y-0.5 hover:shadow-premium",
      outline:
        "border border-neutral-300 bg-white text-ink hover:-translate-y-0.5 hover:border-neutral-400 hover:bg-neutral-50",
      ghost: "text-neutral-700 hover:bg-white/70",
      danger: "bg-red-600 text-white hover:-translate-y-0.5 hover:bg-red-700",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-2.5 text-sm",
      lg: "px-8 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
