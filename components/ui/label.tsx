import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn("mb-1 block text-xs font-medium text-neutral-300", className)}
        {...props}
      />
    );
  }
);

Label.displayName = "Label";
