"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Archive, Pencil, Plus, RotateCcw, Save, X } from "lucide-react";
import { LeafButton } from "@/components/ui/leaf-button";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { Officer } from "@/types/partnership";

export function OfficerSelect({ value, onChange, label = "Responsible officer", disabled = false }: { value?: string | null; onChange: (id: string | null) => void; label?: string; disabled?: boolean }) {
  const id = useId();
  const officers = useWorkspaceStore((s) => s.officers);
  return <label className="block text-sm text-slate-600" htmlFor={id}>{label}<select id={id} className="form-select mt-1" value={value ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value || null)}><option value="">Unassigned</option>{officers.filter((item) => !item.archivedAt || item.id === value).map((item) => <option key={item.id} value={item.id}>{item.name}{item.archivedAt ? " (archived)" : ""}</option>)}</select></label>;
}

export function OfficerManager({ onClose }: { onClose: () => void }) {
  const { officers, refresh, upsertOfficer, archiveOfficer, restoreOfficer, setupRequired } = useWorkspaceStore();
  const [editing, setEditing] = useState<Officer | null>(null);
  const [draftId, setDraftId] = useState(() => `officer-${crypto.randomUUID()}`);
  const [name, setName] = useState("");
  const [archived, setArchived] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reduceMotion = useReducedMotion();
  useEffect(() => { void refresh(); }, [refresh]);
  const close = () => { if (!busy && (!name.trim() || window.confirm("Discard the officer name you are editing?"))) onClose(); };
  const save = async () => {
    if (busy || !name.trim()) return;
    if (officers.some((officer) => !officer.archivedAt && officer.id !== editing?.id && officer.name.trim().toLowerCase() === name.trim().toLowerCase())) { setError("An active officer already has this name."); return; }
    setBusy(true); setError("");
    const saved = await upsertOfficer({ ...(editing ?? { id: draftId }), name: name.trim() });
    setBusy(false);
    if (saved) { setEditing(null); setName(""); setDraftId(`officer-${crypto.randomUUID()}`); } else setError(useWorkspaceStore.getState().error ?? "Could not save officer.");
  };
  const changeArchive = async (officer: Officer) => {
    if (busy || (!officer.archivedAt && !window.confirm(`Archive ${officer.name}? Existing assignments will be preserved.`))) return;
    setBusy(true); setError(""); const saved = await (officer.archivedAt ? restoreOfficer(officer.id, officer.version ?? 0) : archiveOfficer(officer.id, officer.version ?? 0)); setBusy(false);
    if (saved && editing?.id === officer.id) { setEditing(null); setName(""); }
    if (!saved) setError(useWorkspaceStore.getState().error ?? "Could not update officer.");
  };
  return <AnimatePresence><motion.button type="button" aria-label="Close officers" className="fixed inset-0 z-[60] bg-slate-900/25 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
    <div className="fixed inset-0 z-[70] grid place-items-center p-4 pointer-events-none"><motion.section role="dialog" aria-modal="true" aria-label="Officers" className="pointer-events-auto flex max-h-[calc(100dvh-32px)] w-[min(700px,100%)] flex-col overflow-hidden rounded-[18px_18px_18px_7px] border border-sky-200 bg-white/96 shadow-2xl backdrop-blur-2xl" initial={reduceMotion ? false : { x: "38vw", opacity: 0, scale: .97 }} animate={{ x: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={reduceMotion ? { duration: .08 } : { type: "spring", stiffness: 230, damping: 26 }}>
      <header className="flex items-center justify-between border-b border-sky-200 px-6 py-4"><h2 className="text-xl font-semibold text-slate-800">Officers</h2><button type="button" onClick={close} aria-label="Close officer manager" className="rounded-full p-2 hover:bg-slate-100"><X size={19} /></button></header>
      <div className="space-y-4 overflow-y-auto p-6">
        {setupRequired && <p role="status" className="rounded-lg bg-sky-50 p-3 text-sm text-sky-800">Shared notes and officers need the workspace setup script applied to the existing database.</p>}
        <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void save(); }}><Input aria-label="Officer name" autoFocus value={name} maxLength={120} disabled={busy || setupRequired} onChange={(e) => setName(e.target.value)} placeholder="Officer name" /><LeafButton type="submit" disabled={busy || setupRequired || !name.trim()}>{editing ? <Save size={16} /> : <Plus size={16} />}{editing ? "Save" : "Add"}</LeafButton>{editing && <LeafButton variant="ghost" disabled={busy} onClick={() => { setEditing(null); setName(""); }}>Cancel</LeafButton>}</form>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />Show archived officers</label>
        <ul className="divide-y divide-sky-100">{officers.filter((item) => Boolean(item.archivedAt) === archived).map((officer) => <li key={officer.id} className="flex items-center justify-between gap-3 py-3"><span className="text-slate-700">{officer.name}</span><div className="flex gap-1">{!archived && <LeafButton variant="ghost" disabled={busy} aria-label={`Rename ${officer.name}`} onClick={() => { setEditing(structuredClone(officer)); setName(officer.name); }}><Pencil size={15} /></LeafButton>}<LeafButton variant="outline" disabled={busy} aria-label={`${archived ? "Restore" : "Archive"} ${officer.name}`} onClick={() => void changeArchive(officer)}>{archived ? <RotateCcw size={15} /> : <Archive size={15} />}</LeafButton></div></li>)}</ul>
      </div>
    </motion.section></div></AnimatePresence>;
}
