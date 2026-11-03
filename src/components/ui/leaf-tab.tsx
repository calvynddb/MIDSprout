import { cn, LEAF_CUT } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface LeafTabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function LeafTab({
  className,
  active = false,
  ...props
}: LeafTabProps) {
  return (
    <button
      type="button"
      className={cn(
        LEAF_CUT,
        "px-3 py-2 text-left text-sm font-medium transition",
        active
          ? "bg-[#007BFF] text-white shadow-md"
          : "border border-[#007BFF]/20 bg-white/80 text-slate-700 hover:border-[#007BFF] hover:text-[#007BFF]",
        className,
      )}
      {...props}
    />
  );
}
