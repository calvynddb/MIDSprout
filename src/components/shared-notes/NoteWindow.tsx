"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { LEAF_CUT } from "@/lib/utils";

export function NoteWindow({ title, onClose, children, footer }: {title: string; onClose: () => void; children: ReactNode; footer?: ReactNode}) {
  const panel = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>('input,textarea,select,button')?.focus();
    return () => previous?.focus();
  }, []);
  return <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <button type="button" aria-label="Close note window" className="absolute inset-0 bg-slate-900/25 backdrop-blur-sm" onClick={onClose} />
    <motion.div ref={panel} role="dialog" aria-modal="true" aria-label={title} className={`${LEAF_CUT} relative flex max-h-[calc(100dvh-32px)] w-[min(640px,calc(100vw-32px))] flex-col overflow-hidden border border-sky-200 bg-white/96 shadow-2xl backdrop-blur-2xl`}
      initial={reduce ? false : {opacity:0,scale:.97}} animate={{opacity:1,scale:1}} transition={{duration:reduce?0:.2}}
      onKeyDown={(event) => {
        if(event.key === "Escape") { event.stopPropagation(); onClose(); }
        if(event.key !== "Tab") return;
        const fields = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href]');
        if(!fields?.length) return;
        const first=fields[0], last=fields[fields.length-1];
        if(event.shiftKey && document.activeElement===first) {event.preventDefault();last.focus();}
        else if(!event.shiftKey && document.activeElement===last) {event.preventDefault();first.focus();}
      }}>
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-sky-200 px-6 py-5"><div><p className="eyebrow">Shared workspace</p><h2 className="mt-1 text-xl font-semibold text-slate-800">{title}</h2></div><button type="button" onClick={onClose} aria-label="Close editor" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={19}/></button></header>
      <div className="min-h-0 overflow-y-auto p-6">{children}</div>
      {footer && <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-sky-200 px-6 py-4">{footer}</footer>}
    </motion.div>
  </div>;
}
