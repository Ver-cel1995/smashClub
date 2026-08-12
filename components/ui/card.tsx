import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "w-full rounded-[2rem] border border/80 bg-neutral-950 p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]",
        className
      )}
      {...props}
    />
  );
}
