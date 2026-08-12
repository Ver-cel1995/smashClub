import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & { error?: string };


export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
        <>
            <input
                ref={ref}
                className={cn(
                    "block w-full rounded-2xl border-card bg-card px-4 py-3.5 text-sm text-white placeholder:text-neutral-500",
                    "transition-colors duration-150",
                    "focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    className
                )}
                {...props}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
        </>
    );
  }
);

Input.displayName = "Input";
