"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Download } from "lucide-react";
import { LeafButton } from "@/components/ui/leaf-button";
import { organizationsCsv, organizationsXlsx } from "@/lib/organization-export";
import type { Partnership } from "@/types/partnership";

export function OrganizationExport({ all, visible, selected }: { all: Partnership[]; visible: Partnership[]; selected: Partnership[] }) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"visible" | "selected" | "all">("visible");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const records = scope === "all" ? all : scope === "selected" ? selected : visible;
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!busy && event.target instanceof Node && !wrapper.current?.contains(event.target)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) { event.stopPropagation(); setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open, busy]);
  const download = async (format: "csv" | "xlsx") => {
    if (busy || !records.length) return;
    setBusy(true); setError("");
    try {
      const content = format === "csv" ? organizationsCsv(records) : await organizationsXlsx(records);
      const blob = new Blob([content], { type: format === "csv" ? "text/csv;charset=utf-8" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = `midsprout-organizations-${scope}.${format}`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setOpen(false); trigger.current?.focus();
    } catch { setError("Could not create the export. Please try again."); }
    finally { setBusy(false); }
  };
  return <div ref={wrapper} className="relative">
    <span ref={(node) => { trigger.current = node?.querySelector("button") ?? null; }}><LeafButton variant="outline" aria-expanded={open} aria-controls={id} onClick={() => { setOpen(!open); setError(""); }} disabled={busy}><Download size={16} />Export</LeafButton></span>
    {open && <div id={id} role="region" aria-label="Export organizations" className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-sky-200 bg-white p-4 text-sm text-slate-700 shadow-xl">
      <fieldset disabled={busy} className="min-w-0 space-y-3">
        <label className="block text-xs font-semibold" htmlFor={`${id}-scope`}>Export records</label>
        <select autoFocus id={`${id}-scope`} className="w-full rounded-lg border border-sky-200 bg-white p-2 text-sm" value={scope} onChange={(event) => setScope(event.target.value as typeof scope)}>
          <option value="visible">Filtered ({visible.length})</option><option value="selected">Selected ({selected.length})</option><option value="all">All organizations ({all.length})</option>
        </select>
        <div className="flex gap-2"><LeafButton variant="outline" disabled={!records.length || busy} onClick={() => void download("csv")}>CSV</LeafButton><LeafButton disabled={!records.length || busy} onClick={() => void download("xlsx")}>{busy ? "Preparing…" : "Excel"}</LeafButton></div>
        {!records.length && <p className="text-xs text-slate-500">No records in this selection.</p>}
      </fieldset>
      {error && <p className="mt-3 text-xs text-rose-700" role="alert">{error}</p>}
    </div>}
  </div>;
}
