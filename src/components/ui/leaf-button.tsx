"use client";

import { cn, LEAF_CUT } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "glass" | "outline";

interface LeafButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[#007BFF] text-white shadow-[0_12px_30px_rgba(0,123,255,0.28)] hover:bg-[#0066d6]",
  ghost: "bg-transparent text-slate-700 hover:bg-white/50",
  glass:
    "bg-white/55 text-slate-800 backdrop-blur-xl border border-white/70 shadow-sm hover:bg-white/80",
  outline:
    "bg-white/40 text-slate-800 border border-[#007BFF]/25 hover:border-[#007BFF]/60 hover:bg-white/70",
};

export function LeafButton({
  className,
  variant = "primary",
  type = "button",
  ...props
}: LeafButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        LEAF_CUT,
        "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold tracking-tight transition-all duration-200 active:scale-[0.98] disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
