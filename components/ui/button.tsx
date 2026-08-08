import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-lime-400 hover:bg-lime-500 text-neutral-950 shadow-[0_8px_20px_-6px_rgba(163,230,53,0.6)]",
  secondary: "bg-neutral-800 hover:bg-neutral-700 text-white",
  ghost: "bg-transparent hover:bg-neutral-800/60 text-neutral-300",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex w-full items-center justify-center rounded-2xl px-4 py-3.5 text-sm font-semibold tracking-wide transition-all duration-150",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950",
          "active:scale-[0.98]",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
