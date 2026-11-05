"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Archive, CalendarDays, Plus, RotateCcw, Save, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { OfficerSelect } from "@/components/OfficerManager";
import { isOverdue } from "@/lib/collaboration-features";
import { FieldLabel, Input } from "@/components/ui/input";
import { LeafButton } from "@/components/ui/leaf-button";
import { LEAF_CUT } from "@/lib/utils";
import { useEventStore } from "@/store/event-store";
import { usePartnerStore } from "@/store/partner-store";
import { PARTNER_CATEGORIES, type PartnerCategory, type PartnershipEvent } from "@/types/partnership";

const blankCollaboration = (): PartnershipEvent => ({
  id: "draft", name: "", collaborationType: "Joint partnership", committees: [],
  startDate: "", endDate: "", startTime: "", endTime: "", location: "",
  description: "", status: "planning", participants: [],
});

export function EventDrawer() {
  const open = useEventStore((s) => s.drawerOpen);
  const selectedId = useEventStore((s) => s.selectedEventId);
  const events = useEventStore((s) => s.events);
  const selected = events.find((item) => item.id === selectedId) ?? null;
  return <AnimatePresence>{open && <EventDrawerPanel key={selectedId ?? "new-collaboration"} selected={selected} />}</AnimatePresence>;
}

function EventDrawerPanel({ selected }: { selected: PartnershipEvent | null }) {
  const reduceMotion = useReducedMotion();
  const closeDrawer = useEventStore((s) => s.closeEvent);
  const saveEvent = useEventStore((s) => s.saveEvent);
  const archiveEvent = useEventStore((s) => s.archiveEvent);
  const restoreEvent = useEventStore((s) => s.restoreEvent);
  const deleteEvent = useEventStore((s) => s.deleteEvent);
  const collaborationTypes = useEventStore((s) => s.collaborationTypes);
  const committeeOptions = useEventStore((s) => s.committeeOptions);
  const addCollaborationType = useEventStore((s) => s.addCollaborationType);
  const addCommitteeOption = useEventStore((s) => s.addCommitteeOption);
  const partners = usePartnerStore((s) => s.partners);
  const [form, setForm] = useState<PartnershipEvent>(() => selected ? {
    ...blankCollaboration(), ...structuredClone(selected), committees: selected.committees ?? [],
    collaborationType: selected.collaborationType || "Joint partnership",
  } : blankCollaboration());
  const [initial] = useState(() => JSON.stringify(form));
  const [saving, setSaving] = useState(false);
  const [draftId] = useState(() => `collaboration-${crypto.randomUUID()}`);
  const [saveError, setSaveError] = useState("");
  const dirty = initial !== JSON.stringify(form);
  const close = () => { if (!saving && !deleting && (!dirty || window.confirm("Discard unsaved collaboration changes?"))) closeDrawer(); };
  useEffect(() => {
    if (!dirty && !saving) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PartnerCategory | "All branches">("All branches");
  const [addingType, setAddingType] = useState(false);
  const [newType, setNewType] = useState("");
  const [addingCommittee, setAddingCommittee] = useState(false);
  const [newCommittee, setNewCommittee] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const visiblePartners = useMemo(() => partners.filter((partner) =>
    (!partner.archivedAt || form.participants.some((item) => item.partnerId === partner.id)) && (categoryFilter === "All branches" || partner.category === categoryFilter) &&
    `${partner.organizationName} ${partner.acronym}`.toLowerCase().includes(query.toLowerCase()),
  ), [partners, categoryFilter, query, form.participants]);
  const participantIds = new Set(form.participants.map((item) => item.partnerId));

  const setParticipant = (id: string, checked: boolean) => setForm((current) => ({
    ...current,
    participants: checked
      ? [...current.participants, { partnerId: id }]
      : current.participants.filter((item) => item.partnerId !== id),
  }));

  const addFilteredPartners = () => setForm((current) => {
    const selectedIds = new Set(current.participants.map((item) => item.partnerId));
    const additions = visiblePartners.filter((partner) => !selectedIds.has(partner.id)).map((partner) => ({ partnerId: partner.id }));
    return { ...current, participants: [...current.participants, ...additions] };
  });
  const removeFilteredPartners = () => setForm((current) => {
    const visibleIds = new Set(visiblePartners.map((partner) => partner.id));
    return { ...current, participants: current.participants.filter((item) => !visibleIds.has(item.partnerId)) };
  });

  const patch = <K extends keyof PartnershipEvent>(key: K, value: PartnershipEvent[K]) => setForm((current) => ({ ...current, [key]: value }));
  const updateCommittees = (value: string) => {
    if (value && !form.committees.includes(value)) patch("committees", [...form.committees, value]);
  };
  const saveNewType = () => {
    const draft = newType.trim();
    const value = collaborationTypes.find((item) => item.toLowerCase() === draft.toLowerCase()) ?? draft;
    if (!value) return;
    if (!collaborationTypes.some((item) => item.toLowerCase() === value.toLowerCase())) addCollaborationType(value);
    patch("collaborationType", value);
    setNewType("");
    setAddingType(false);
  };
  const saveNewCommittee = () => {
    const draft = newCommittee.trim();
    const value = committeeOptions.find((item) => item.toLowerCase() === draft.toLowerCase()) ?? draft;
    if (!value) return;
    if (!committeeOptions.some((item) => item.toLowerCase() === value.toLowerCase())) addCommitteeOption(value);
    updateCommittees(value);
    setNewCommittee("");
    setAddingCommittee(false);
  };
  const save = async () => {
    if (saving) return;
    if (!form.name.trim()) { setSaveError("Enter a collaboration name."); return; }
    if (form.tasks?.some((task) => !task.title.trim())) { setSaveError("Give each task a title or remove the empty task."); return; }
    if (form.startDate && form.endDate && form.endDate < form.startDate) { setSaveError("End date must not be before start date."); return; }
    setSaving(true); setSaveError("");
    const collaboration = { ...form, name: form.name.trim(), id: form.id === "draft" ? draftId : form.id };
    const saved = await saveEvent(collaboration);
    setSaving(false);
    if (saved) closeDrawer();
    else setSaveError("Could not save this collaboration. Your changes are still here; try again.");
  };
  const removeCollaboration = async () => {
    if (!selected?.id || deleting) return;
    setDeleting(true);
    setDeleteError("");
    const deleted = await deleteEvent(selected.id);
    setDeleting(false);
    if (deleted) closeDrawer();
    else setDeleteError("Could not delete this collaboration. Check your database connection and try again.");
  };

  return <>
    <motion.button type="button" aria-label="Close collaboration" className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
    <motion.aside className={`${LEAF_CUT} profile-drawer fixed left-1/2 top-1/2 z-50 flex h-[min(920px,calc(100dvh-28px))] w-[min(1280px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-sky-200 bg-white/96 shadow-2xl backdrop-blur-2xl`}
      initial={reduceMotion ? false : { x: "38vw", opacity: 0, scale: .97 }} animate={{ x: 0, opacity: 1, scale: 1 }} exit={reduceMotion ? { opacity: 0 } : { x: "38vw", opacity: 0, scale: .97 }} transition={reduceMotion ? { duration: .08 } : { type: "spring", stiffness: 230, damping: 26 }}>
      <header className="profile-drawer-header flex shrink-0 items-center justify-between gap-4 border-b border-sky-200 px-6 py-4">
        <div className="flex items-center gap-3"><span className="tile-icon"><CalendarDays size={19} /></span><h2 className="text-xl font-semibold text-slate-800">{form.name || "New collaboration"}</h2></div>
        <button type="button" aria-label="Close collaboration editor" onClick={close} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
      </header>

      <fieldset disabled={saving || deleting || Boolean(selected?.archivedAt)} className="grid min-h-0 flex-1 gap-7 overflow-y-auto p-5 lg:grid-cols-[minmax(330px,.78fr)_minmax(560px,1.22fr)] lg:p-7">
        <section className="event-fields grid content-start grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <div className="col-span-full"><FieldLabel>Collaboration name</FieldLabel><Input value={form.name} onChange={(e) => patch("name", e.target.value)} placeholder="e.g. MIDSAccelerate" /></div>
          <div className="col-span-full"><FieldLabel>Collaboration type</FieldLabel><div className="flex gap-2"><select className="form-select min-w-0 flex-1" value={form.collaborationType} onChange={(e) => patch("collaborationType", e.target.value)}>{collaborationTypes.map((type) => <option key={type}>{type}</option>)}</select><button type="button" className="mini-action shrink-0" onClick={() => setAddingType((value) => !value)}>Add type</button></div>{addingType && <div className="mt-2 flex gap-2"><Input autoFocus value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="New collaboration type" /><button type="button" className="mini-action" onClick={saveNewType}>Add</button></div>}</div>
          <div><FieldLabel>Status</FieldLabel><select className="form-select" value={form.status} onChange={(e) => patch("status", e.target.value as PartnershipEvent["status"])}><option value="planning">Planning</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
          <div className="col-span-full"><OfficerSelect value={form.officerId} onChange={(value) => patch("officerId", value)} /></div>
          <div><FieldLabel>Location</FieldLabel><Input value={form.location} onChange={(e) => patch("location", e.target.value)} /></div>
          <div><FieldLabel hint="When the collaboration begins">Start date</FieldLabel><Input type="date" value={form.startDate} onChange={(e) => patch("startDate", e.target.value)} /></div>
          <div><FieldLabel hint="Leave blank for a one-day collaboration">End date</FieldLabel><Input type="date" value={form.endDate} onChange={(e) => patch("endDate", e.target.value)} /></div>
          <div><FieldLabel hint="Optional">Start time</FieldLabel><Input type="time" value={form.startTime} onChange={(e) => patch("startTime", e.target.value)} /></div>
          <div><FieldLabel hint="Optional">End time</FieldLabel><Input type="time" value={form.endTime} onChange={(e) => patch("endTime", e.target.value)} /></div>
          <div className="col-span-full"><FieldLabel>Concerned committees</FieldLabel><div className="flex gap-2"><select className="form-select min-w-0 flex-1" value="" onChange={(e) => updateCommittees(e.target.value)}><option value="">Select a committee</option>{committeeOptions.map((committee) => <option key={committee} value={committee} disabled={form.committees.includes(committee)}>{committee}</option>)}</select><button type="button" className="mini-action shrink-0" onClick={() => setAddingCommittee((value) => !value)}>Add committee</button></div>{addingCommittee && <div className="mt-2 flex gap-2"><Input autoFocus value={newCommittee} onChange={(e) => setNewCommittee(e.target.value)} placeholder="New committee" /><button type="button" className="mini-action" onClick={saveNewCommittee}>Add</button></div>}<div className="mt-2 flex flex-wrap gap-2">{form.committees.map((committee) => <button key={committee} type="button" title="Remove committee" onClick={() => patch("committees", form.committees.filter((item) => item !== committee))} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">{committee} ×</button>)}</div></div>
        </section>

        <section className="event-partners-panel flex min-h-[440px] flex-col lg:border-l lg:border-sky-200 lg:pl-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold text-slate-800">Organizations <span className="count-chip ml-2">{form.participants.length}</span></h3><div className="flex items-center gap-2"><select aria-label="Filter branch" className="form-select w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as PartnerCategory | "All branches")}><option>All branches</option>{PARTNER_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select><button type="button" className="mini-action" onClick={addFilteredPartners}>Add visible</button><button type="button" className="mini-action" onClick={removeFilteredPartners}>Remove visible</button></div></div>
          <label className="relative mt-3 block"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find an organization" /></label>
          <div className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto border-y border-sky-100 py-2">
            {visiblePartners.map((partner) => <div key={partner.id} className="rounded-lg border-b border-sky-50 px-2 py-2"><label title={partner.category} className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={participantIds.has(partner.id)} onChange={(e) => setParticipant(partner.id, e.target.checked)} className="h-4 w-4 accent-sky-600" /><span className="min-w-0 text-sm font-medium text-slate-700">{partner.organizationName}{partner.archivedAt ? " (archived)" : ""}</span></label>{participantIds.has(partner.id) && <div className="mt-2 grid gap-2 pl-7 sm:grid-cols-[140px_1fr]"><select aria-label={`Participation status for ${partner.organizationName}`} className="form-select" value={form.participants.find((item) => item.partnerId === partner.id)?.status ?? "planned"} onChange={(e) => patch("participants", form.participants.map((item) => item.partnerId === partner.id ? { ...item, status: e.target.value as NonNullable<typeof item.status> } : item))}>{["planned", "invited", "confirmed", "declined", "withdrawn"].map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select><Input aria-label={`Participation notes for ${partner.organizationName}`} value={form.participants.find((item) => item.partnerId === partner.id)?.notes ?? ""} maxLength={1000} placeholder="Participation note" onChange={(e) => patch("participants", form.participants.map((item) => item.partnerId === partner.id ? { ...item, notes: e.target.value } : item))} /></div>}</div>)}

            {!visiblePartners.length && <p className="py-4 text-sm text-slate-400">No matching organizations.</p>}
          </div>
        </section>
        <section className="col-span-full border-t border-sky-100 pt-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-semibold text-slate-800">Tasks <span className="count-chip">{(form.tasks ?? []).filter((task) => task.done).length}/{form.tasks?.length ?? 0}</span></h3><button type="button" className="mini-action" onClick={() => patch("tasks", [...(form.tasks ?? []), { id: `task-${crypto.randomUUID()}`, title: "", officerId: form.officerId ?? null, dueDate: "", done: false }])}><Plus size={15} />Add task</button></div><div className="space-y-3">{(form.tasks ?? []).map((task) => <div key={task.id} className={`grid items-end gap-3 rounded-lg border p-3 lg:grid-cols-[24px_minmax(160px,1fr)_180px_160px_36px] ${isOverdue(task.dueDate, task.done) ? "border-amber-300 bg-amber-50/40" : "border-sky-100"}`}><input aria-label={`Complete ${task.title || "task"}`} type="checkbox" checked={task.done} onChange={(e) => patch("tasks", form.tasks!.map((item) => item.id === task.id ? { ...item, done: e.target.checked } : item))} className="mb-3 h-4 w-4 accent-sky-600" /><div><FieldLabel>Task</FieldLabel><Input value={task.title} maxLength={200} placeholder="What needs to be done?" onChange={(e) => patch("tasks", form.tasks!.map((item) => item.id === task.id ? { ...item, title: e.target.value } : item))} /></div><OfficerSelect value={task.officerId} onChange={(value) => patch("tasks", form.tasks!.map((item) => item.id === task.id ? { ...item, officerId: value } : item))} /><div><FieldLabel>Due date {isOverdue(task.dueDate, task.done) && "· Overdue"}</FieldLabel><Input type="date" value={task.dueDate} onChange={(e) => patch("tasks", form.tasks!.map((item) => item.id === task.id ? { ...item, dueDate: e.target.value } : item))} /></div><button type="button" className="mb-2 rounded p-2 text-slate-500 hover:bg-slate-100" aria-label={`Remove ${task.title || "task"}`} onClick={() => patch("tasks", form.tasks!.filter((item) => item.id !== task.id))}><X size={16} /></button></div>)}{!form.tasks?.length && <p className="text-sm text-slate-400">No tasks yet.</p>}</div></section>
      </fieldset>

      <footer className="drawer-footer flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-sky-200 px-6 py-4">
        {selected && <div className="flex flex-wrap items-center gap-2">
          {!confirmDelete ? <LeafButton variant="outline" className="border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50" onClick={() => { setConfirmDelete(true); setDeleteError(""); }}><Trash2 size={16} /> Delete collaboration</LeafButton> : <div className="flex flex-wrap items-center gap-2" role="alert">
            <span className="mr-1 text-sm font-medium text-rose-800">Permanently delete this collaboration and its organization links?</span>
            <LeafButton variant="ghost" className="px-3 py-2 text-slate-600" disabled={deleting} onClick={() => { setConfirmDelete(false); setDeleteError(""); }}>Cancel</LeafButton>
            <LeafButton className="bg-rose-600 px-3 py-2 text-white hover:bg-rose-700" disabled={deleting} onClick={() => void removeCollaboration()}>{deleting ? "Deleting…" : "Delete permanently"}</LeafButton>
          </div>}
          {deleteError && <span role="status" className="text-sm text-rose-700">{deleteError}</span>}
        </div>}
        <div className="ml-auto flex flex-wrap items-center gap-2">{saveError && <span role="alert" className="text-sm text-rose-700">{saveError}</span>}{selected && <LeafButton variant="outline" disabled={saving || deleting} onClick={async () => { if (dirty && !window.confirm("Discard unsaved changes and update archive status?")) return; setSaving(true); const saved = await (selected.archivedAt ? restoreEvent(selected.id) : archiveEvent(selected.id)); setSaving(false); if (saved) closeDrawer(); else setSaveError("Could not update archive status."); }}>{selected.archivedAt ? <RotateCcw size={16} /> : <Archive size={16} />}{selected.archivedAt ? "Restore" : "Archive"}</LeafButton>}<LeafButton disabled={saving || deleting || Boolean(selected?.archivedAt)} onClick={() => void save()}><Save size={16} />{saving ? "Saving…" : "Save collaboration"}</LeafButton></div>
      </footer>
    </motion.aside>
  </>;
}

