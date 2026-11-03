import { cn, LEAF_CUT } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface LeafCardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export function LeafCard({
  className,
  padded = true,
  ...props
}: LeafCardProps) {
  return (
    <div
      className={cn(
        LEAF_CUT,
        "glass-panel border border-white/70",
        padded && "p-5",
        className,
      )}
      {...props}
    />
  );
}
