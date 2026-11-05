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
        "w-full border border-slate-200/80 bg-white/80 px-4 py-3 text-base text-slate-800 outline-none transition focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20",
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
        "w-full min-h-[120px] border border-slate-200/80 bg-white/80 px-4 py-3 text-base text-slate-800 outline-none transition focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/20",
        className,
      )}
      {...props}
    />
  );
}

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <label title={hint} className={`mb-2 block text-sm font-semibold uppercase tracking-[0.14em] text-slate-600 ${hint ? "cursor-help" : ""}`}>
      {children}
    </label>
  );
}
