"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, FolderOpen, Copy, Filter, Home, Plus, RotateCcw, Search, UsersRound } from "lucide-react";
import { Brand } from "@/components/Brand";
import { OfficerManager } from "@/components/OfficerManager";
import { LeafButton } from "@/components/ui/leaf-button";
import { useCanvasStore } from "@/store/canvas-store";
import { useEventStore } from "@/store/event-store";
import { useWorkspaceStore } from "@/store/workspace-store";
import { duplicateCollaboration, isOverdue, todayInManila } from "@/lib/collaboration-features";
import { cn } from "@/lib/utils";
import type { PartnershipEvent } from "@/types/partnership";

const columns = [
  ["name", "Collaboration"],
  ["type", "Type / committees"],
  ["dates", "Dates"],
  ["status", "Status"],
  ["officer", "Officer"],
  ["participants", "Orgs"],
  ["tasks", "Tasks"],
] as const;

type SortField = (typeof columns)[number][0];

const grid = "grid-cols-[minmax(220px,1.7fr)_minmax(180px,1.2fr)_140px_110px_140px_80px_100px_48px]";

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
  const [sort, setSort] = useState<{ field: SortField; descending: boolean }>({
    field: "name",
    descending: false,
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const nameOf = (id?: string | null) =>
    officers.find((officer) => officer.id === id)?.name ?? "";

  const changeSort = (field: SortField) =>
    setSort((current) => ({
      field,
      descending: current.field === field && !current.descending,
    }));

  const visible = useMemo(() => {
    const today = todayInManila();
    const get = (event: PartnershipEvent, field: SortField): string | number => {
      switch (field) {
        case "name": return event.name;
        case "type": return event.collaborationType;
        case "dates": return event.startDate || "";
        case "status": return ["planning", "confirmed", "completed", "cancelled"].indexOf(event.status);
        case "officer": return officers.find((o) => o.id === event.officerId)?.name ?? "";
        case "participants": return event.participants.length;
        case "tasks": return (event.tasks ?? []).filter((t) => !t.done).length;
        default: return "";
      }
    };

    return events
      .filter(
        (event) =>
          Boolean(event.archivedAt) === archived &&
          (!status || event.status === status) &&
          (!type || event.collaborationType === type) &&
          (!committee || event.committees.includes(committee)) &&
          (date === "all" ||
            (date === "undated"
              ? !event.startDate
              : date === "past"
              ? Boolean(event.startDate && (event.endDate || event.startDate) < today)
              : Boolean(event.startDate && (event.endDate || event.startDate) >= today))) &&
          (!query.trim() ||
            [
              event.name,
              event.collaborationType,
              event.location,
              event.description,
              ...event.committees,
            ]
              .join(" ")
              .toLowerCase()
              .includes(query.trim().toLowerCase()))
      )
      .sort((a, b) => {
        const left = get(a, sort.field),
          right = get(b, sort.field);
        if (left === "" || right === "")
          return left === right ? a.id.localeCompare(b.id) : left === "" ? 1 : -1;
        const result =
          typeof left === "number" && typeof right === "number"
            ? left - right
            : String(left).localeCompare(String(right), undefined, {
                numeric: true,
                sensitivity: "base",
              });
        return (sort.descending ? -result : result) || a.id.localeCompare(b.id);
      });
  }, [events, officers, archived, status, type, committee, date, query, sort]);

  const duplicate = async (event: PartnershipEvent) => {
    if (busy) return;
    setBusy(event.id);
    setError("");
    const copy = duplicateCollaboration(event);
    const saved = await useEventStore.getState().saveEvent(copy);
    setBusy(null);
    if (saved) openEvent(copy.id);
    else setError("Could not duplicate this collaboration.");
  };

  const restore = async (id: string) => {
    setBusy(id);
    setError("");
    const saved = await useEventStore.getState().restoreEvent(id);
    setBusy(null);
    if (!saved) setError("Could not restore this collaboration.");
  };

  return (
    <section className="database-view database-viewport flex h-screen w-screen items-center justify-center overflow-y-auto px-4 pt-5 pb-[clamp(40px,5vh,64px)] sm:px-8">
      <div className="flex h-full min-h-0 w-full max-w-[1760px] flex-col">
        <Brand compact />
        <header className="mb-3 mt-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="database-title font-semibold text-slate-800">Collaborations</h2>
          <div className="flex flex-wrap items-center gap-2">
            <LeafButton onClick={openCreate}>
              <Plus size={16} />
              Add collaboration
            </LeafButton>
            <LeafButton variant="glass" onClick={() => setOfficersOpen(true)}>
              <UsersRound size={16} />
              Officers
            </LeafButton>
            <LeafButton variant="outline" onClick={() => goTo("root")}>
              <Home size={16} />
              Back to Root
            </LeafButton>
            <button 
              type="button" 
              onClick={() => setArchived(!archived)}
              aria-label={archived ? "Show active collaborations" : "Show archived collaborations"}
              title={archived ? "Show active collaborations" : "Show archived collaborations"}
              aria-pressed={archived}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-[18px_18px_18px_7px] transition-all duration-200"
              style={{
                backgroundColor: archived ? "#eff6ff" : "rgba(255,255,255,0.4)",
                border: archived ? "2px solid #0ea5e9" : "1px solid #BAE6FD",
                color: archived ? "#0c4a6e" : "#0f172a",
                boxShadow: archived ? "0 4px 12px rgba(14,165,233,0.15)" : "0 2px 6px rgba(0,0,0,0.08)"
              }}
            >
              <Archive size={16} />
              
            </button>
          </div>
        </header>

        <div className="folder-tabs">
          <span className="folder-tab-top folder-tab-active">Collaborations</span>
        </div>

        <div className="file-sheet flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="directory-sheet-heading collaboration-sheet-heading mb-4 flex flex-wrap items-center gap-3 border-b border-slate-100 pb-4">
            <span className="tile-icon"><FolderOpen size={19} /></span><span className="count-chip">{visible.length} records</span>
            
            <label className="directory-search" aria-label="Search collaborations">
              <Search size={17} aria-hidden="true" />
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Search collaborations" 
              />
            </label>

            <div className="flex items-center gap-2">
              <label className="directory-sort" aria-label="Collaboration status">
                <Filter size={15} aria-hidden="true" />
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All statuses</option>
                  {["planning", "confirmed", "completed", "cancelled"].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </label>

              <details className="relative">
                <summary className="mini-action cursor-pointer list-none flex items-center gap-1">
                  <span>Advanced Filters</span>
                </summary>
                <div className="absolute left-0 top-full z-20 mt-2 grid w-64 gap-3 rounded-xl border border-sky-200 bg-white p-4 shadow-xl">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Type
                    <select className="form-select mt-1" value={type} onChange={(e) => setType(e.target.value)}>
                      <option value="">All types</option>
                      {[...new Set(events.map((e) => e.collaborationType))].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Committee
                    <select className="form-select mt-1" value={committee} onChange={(e) => setCommittee(e.target.value)}>
                      <option value="">All committees</option>
                      {[...new Set(events.flatMap((e) => e.committees))].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Dates
                    <select className="form-select mt-1" value={date} onChange={(e) => setDate(e.target.value)}>
                      <option value="all">All dates</option>
                      <option value="upcoming">Upcoming / ongoing</option>
                      <option value="past">Past</option>
                      <option value="undated">Date TBD</option>
                    </select>
                  </label>
                </div>
              </details>
            </div>


          </div>

          {error && <p role="alert" className="mb-3 px-2 text-sm font-medium text-rose-600">{error}</p>}

          <div className="glass-panel min-h-0 flex-1 overflow-hidden border border-white/70 flex flex-col rounded-[30px_6px_30px_6px]">
            <div className="overflow-auto min-h-0 flex-1">
              <div className="min-w-[1100px]">
                <div className={`grid ${grid} gap-4 border-b border-sky-200 bg-white/75 px-5 py-4 text-xs font-semibold uppercase tracking-[.14em] text-slate-500 sticky top-0 z-10`}>
                  {columns.map(([field, label]) => (
                    <button
                      key={field}
                      type="button"
                      className="text-left hover:text-sky-700 transition-colors"
                      style={{ minHeight: 0, padding: 0, font: "inherit" }}
                      aria-pressed={sort.field === field}
                      onClick={() => changeSort(field)}
                    >
                      {label}
                      {sort.field === field ? (sort.descending ? " ↓" : " ↑") : ""}
                    </button>
                  ))}
                  <span />
                </div>

                <div className="divide-y divide-[#cfe6ff]">
                  {visible.map((event) => (
                    <div 
                      key={event.id} 
                      className="group relative"
                    >
                      <button
                        type="button"
                        className={`grid ${grid} w-full items-center gap-4 px-5 py-3 text-left transition hover:bg-sky-50/80`}
                        onClick={() => openEvent(event.id)}
                      >
                        <div className="min-w-0">
                          <p className="text-base font-semibold text-slate-800 truncate">{event.name}</p>
                          {event.location && (
                            <p className="mt-0.5 truncate text-sm text-slate-500">{event.location}</p>
                          )}
                        </div>
                        
                        <div className="min-w-0">
                          <p className="text-sm text-slate-700 truncate">{event.collaborationType}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {event.committees.join(" · ")}
                          </p>
                        </div>

                        <div className="text-sm text-slate-600">
                          {event.startDate || "Date TBD"}
                          {event.endDate && event.endDate !== event.startDate && (
                            <span className="block text-xs text-slate-400">to {event.endDate}</span>
                          )}
                        </div>

                        <div>
                          <span className={cn("status-chip inline-flex", `status-${event.status}`)}>
                            {event.status}
                          </span>
                        </div>

                        <div className="text-sm text-slate-600 truncate">
                          {nameOf(event.officerId) || <span className="text-slate-400 italic">Unassigned</span>}
                        </div>

                        <div className="text-sm font-medium text-slate-700 text-center">
                          {event.participants.length}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-700">
                              {event.tasks?.filter((t) => t.done).length ?? 0}/{event.tasks?.length ?? 0}
                            </span>
                          </div>
                          {event.tasks?.some((t) => isOverdue(t.dueDate, t.done)) && (
                            <span className="mt-0.5 block text-[10px] font-bold text-rose-600 uppercase tracking-tight">
                              Overdue
                            </span>
                          )}
                        </div>
                        
                        {/* The action button is handled separately but occupies the last grid cell */}
                        <div />
                      </button>

                      {/* Action button overlay for the last cell */}
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <button
                          type="button"
                          className="p-2 text-sky-700 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-30"
                          disabled={busy !== null}
                          aria-label={`${archived ? "Restore" : "Duplicate"} ${event.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            void (archived ? restore(event.id) : duplicate(event));
                          }}
                        >
                          {archived ? <RotateCcw size={18} /> : <Copy size={18} />}
                        </button>
                      </div>
                    </div>
                  ))}

                  {!visible.length && (
                    <div className="px-5 py-20 text-center">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-3">
                        <Search size={24} />
                      </div>
                      <p className="text-sm text-slate-500">No collaborations match your filters.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {officersOpen && <OfficerManager onClose={() => setOfficersOpen(false)} />}
      </div>
    </section>
  );
}

