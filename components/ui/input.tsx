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
                    "block w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3.5 text-sm text-white placeholder:text-neutral-500",
                    "transition-colors duration-150",
                    "focus:outline-none focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20",
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
