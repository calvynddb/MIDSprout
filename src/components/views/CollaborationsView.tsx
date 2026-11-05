"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Archive, Copy, Home, Plus, RotateCcw, UsersRound } from "lucide-react";
import { Brand } from "@/components/Brand";
import { LeafButton } from "@/components/ui/leaf-button";
import { OfficerManager } from "@/components/OfficerManager";
import { useCanvasStore } from "@/store/canvas-store";
import { useEventStore } from "@/store/event-store";
import { useWorkspaceStore } from "@/store/workspace-store";
import { duplicateCollaboration, isOverdue, todayInManila } from "@/lib/collaboration-features";
import type { PartnershipEvent } from "@/types/partnership";

const columns = [["name", "Collaboration"], ["type", "Type / committees"], ["dates", "Dates"], ["status", "Status"], ["officer", "Officer"], ["participants", "Organizations"], ["tasks", "Tasks"]] as const;
type SortField = (typeof columns)[number][0];
const grid = "grid-cols-[minmax(220px,1.7fr)_minmax(180px,1.2fr)_150px_110px_150px_100px_110px_48px]";

export function CollaborationsView() {
  const events = useEventStore((s) => s.events);
  const openEvent = useEventStore((s) => s.openEvent);
  const openCreate = useEventStore((s) => s.openCreateEvent);
  const goTo = useCanvasStore((s) => s.goTo);
  const officers = useWorkspaceStore((s) => s.officers);
  const refresh = useWorkspaceStore((s) => s.refresh);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [committee, setCommittee] = useState("");
  const [date, setDate] = useState("all");
  const [archived, setArchived] = useState(false);
  const [officersOpen, setOfficersOpen] = useState(false);
  const [sort, setSort] = useState<{ field: SortField; descending: boolean }>({ field: "name", descending: false });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void refresh(); }, [refresh]);
  const nameOf = (id?: string | null) => officers.find((officer) => officer.id === id)?.name ?? "";
  const changeSort = (field: SortField) => setSort((current) => ({ field, descending: current.field === field && !current.descending }));
  const visible = useMemo(() => {
    const today = todayInManila();
    const get = (event: PartnershipEvent, field: SortField): string | number => field === "name" ? event.name : field === "type" ? event.collaborationType : field === "dates" ? event.startDate : field === "status" ? ["planning", "confirmed", "completed", "cancelled"].indexOf(event.status) : field === "officer" ? officers.find((officer) => officer.id === event.officerId)?.name ?? "" : field === "participants" ? event.participants.length : (event.tasks ?? []).filter((task) => !task.done).length;
    return events.filter((event) => Boolean(event.archivedAt) === archived && (!status || event.status === status) && (!type || event.collaborationType === type) && (!committee || event.committees.includes(committee)) && (date === "all" || (date === "undated" ? !event.startDate : date === "past" ? Boolean(event.startDate && (event.endDate || event.startDate) < today) : Boolean(event.startDate && (event.endDate || event.startDate) >= today))) && (!query.trim() || [event.name, event.collaborationType, event.location, event.description, ...event.committees].join(" ").toLowerCase().includes(query.trim().toLowerCase()))).sort((a, b) => {
      const left = get(a, sort.field), right = get(b, sort.field);
      if (left === "" || right === "") return left === right ? a.id.localeCompare(b.id) : left === "" ? 1 : -1;
      const result = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
      return (sort.descending ? -result : result) || a.id.localeCompare(b.id);
    });
  }, [events, officers, archived, status, type, committee, date, query, sort]);
  const duplicate = async (event: PartnershipEvent) => {
    if (busy) return;
    setBusy(event.id); setError(""); const copy = duplicateCollaboration(event);
    const saved = await useEventStore.getState().saveEvent(copy); setBusy(null);
    if (saved) openEvent(copy.id); else setError("Could not duplicate this collaboration.");
  };
  const restore = async (id: string) => {
    setBusy(id); setError(""); const saved = await useEventStore.getState().restoreEvent(id); setBusy(null);
    if (!saved) setError("Could not restore this collaboration.");
  };
  return <section className="database-view database-viewport flex h-screen w-screen items-center justify-center overflow-y-auto px-4 pt-5 pb-[clamp(40px,5vh,64px)] sm:px-8"><div className="flex h-full min-h-0 w-full max-w-[1760px] flex-col">
    <Brand compact />
    <header className="mb-3 mt-3 flex flex-wrap items-end justify-between gap-3"><h2 className="database-title font-semibold text-slate-800">Collaborations</h2><div className="flex flex-wrap items-center gap-2"><LeafButton onClick={openCreate}><Plus size={16} />Add collaboration</LeafButton><LeafButton variant="glass" onClick={() => setOfficersOpen(true)}><UsersRound size={16} />Officers</LeafButton><LeafButton variant="outline" onClick={() => goTo("root")}><Home size={16} />Back to Root</LeafButton></div></header>
    <div className="folder-tabs"><span className="folder-tab-top folder-tab-active">Collaborations</span></div>
    <div className="file-sheet flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-sky-200 pb-4"><span className="count-chip">{visible.length} records</span><input aria-label="Search collaborations" className="search-input w-auto max-w-[260px]" placeholder="Search collaborations" value={query} onChange={(e) => setQuery(e.target.value)} /><select className="form-select w-auto" aria-label="Collaboration status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{["planning", "confirmed", "completed", "cancelled"].map((value) => <option key={value} value={value}>{value}</option>)}</select>
      <details className="relative"><summary className="mini-action cursor-pointer">Filters</summary><div className="absolute left-0 top-full z-20 mt-2 grid w-64 gap-3 rounded-xl border border-sky-200 bg-white p-4 shadow-xl"><label className="text-xs text-slate-600">Type<select className="form-select mt-1" value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option>{[...new Set(events.map((event) => event.collaborationType))].map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-xs text-slate-600">Committee<select className="form-select mt-1" value={committee} onChange={(e) => setCommittee(e.target.value)}><option value="">All committees</option>{[...new Set(events.flatMap((event) => event.committees))].map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-xs text-slate-600">Dates<select className="form-select mt-1" value={date} onChange={(e) => setDate(e.target.value)}><option value="all">All dates</option><option value="upcoming">Upcoming / ongoing</option><option value="past">Past</option><option value="undated">Date TBD</option></select></label></div></details>
      <label className="flex items-center gap-2 text-sm text-slate-600"><ArrowDownUp size={15} /><select aria-label="Sort collaborations" className="form-select w-auto" value={sort.field} onChange={(e) => setSort({ field: e.target.value as SortField, descending: false })}>{columns.map(([field, label]) => <option key={field} value={field}>{label}</option>)}</select></label><button type="button" className="mini-action" aria-label={sort.descending ? "Sort ascending" : "Sort descending"} onClick={() => setSort((current) => ({ ...current, descending: !current.descending }))}>{sort.descending ? "↓" : "↑"}</button><label className="ml-auto flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} /><Archive size={14} />Archived</label></div>
      {error && <p role="alert" className="mb-3 text-sm text-rose-700">{error}</p>}
      <div className="glass-panel min-h-0 flex-1 overflow-auto rounded-[18px_18px_18px_7px] border border-white/70"><div className="min-w-[1240px]"><div className={`grid ${grid} gap-4 border-b border-sky-200 bg-white/75 px-5 py-4 text-xs font-semibold uppercase tracking-[.14em] text-slate-500`}>{columns.map(([field, label]) => <button key={field} type="button" style={{ minHeight: 0, padding: 0, font: "inherit" }} className="text-left" aria-pressed={sort.field === field} onClick={() => changeSort(field)}>{label}{sort.field === field ? sort.descending ? " ↓" : " ↑" : ""}</button>)}<span /></div>
      {visible.map((event) => <div key={event.id} className={`grid ${grid} items-center gap-4 border-b border-[#cfe6ff] px-5 py-2 text-sm text-slate-600`}><button type="button" className="text-left" onClick={() => openEvent(event.id)}><span className="font-semibold text-slate-800">{event.name}</span>{event.location && <span className="mt-1 block text-sm text-slate-500">{event.location}</span>}</button><span>{event.collaborationType}<span className="mt-1 block text-xs text-slate-500">{event.committees.join(" · ")}</span></span><span>{event.startDate || "Date TBD"}{event.endDate && event.endDate !== event.startDate && <span className="block">– {event.endDate}</span>}</span><span className={`status-chip status-${event.status}`}>{event.status}</span><span>{nameOf(event.officerId) || "Unassigned"}</span><span>{event.participants.length}</span><span>{event.tasks?.filter((task) => task.done).length ?? 0}/{event.tasks?.length ?? 0}<span className="block text-xs text-amber-700">{event.tasks?.filter((task) => isOverdue(task.dueDate, task.done)).length ? "Overdue tasks" : ""}</span></span><button type="button" className="text-sky-700" disabled={busy !== null} aria-label={`${archived ? "Restore" : "Duplicate"} ${event.name}`} onClick={() => void (archived ? restore(event.id) : duplicate(event))}>{archived ? <RotateCcw size={17} /> : <Copy size={17} />}</button></div>)}{!visible.length && <p className="px-5 py-10 text-sm text-slate-500">No collaborations match these filters.</p>}</div></div>
    </div>
    {officersOpen && <OfficerManager onClose={() => setOfficersOpen(false)} />}
  </div></section>;
}
