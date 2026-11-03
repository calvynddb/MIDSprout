import { cn, LEAF_CUT } from "@/lib/utils";
import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        LEAF_CUT,
        "w-full border border-slate-200/80 bg-white/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        LEAF_CUT,
        "w-full min-h-[96px] border border-slate-200/80 bg-white/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20",
        className,
      )}
      {...props}
    />
  );
}

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <label title={hint} className={`mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 ${hint ? "cursor-help" : ""}`}>
      {children}
    </label>
  );
}
