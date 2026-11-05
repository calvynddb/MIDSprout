"use client";

import { useEffect, useId, useState } from "react";
import { Archive, Save } from "lucide-react";
import { LeafButton } from "@/components/ui/leaf-button";
import { OfficerSelect } from "@/components/OfficerManager";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { StickyNote } from "@/types/partnership";
import { NoteWindow } from "./NoteWindow";

export const noteColors = { yellow:"#fff4be", blue:"#dcefff", pink:"#ffe4ed", green:"#e3f2d6" };

export function NoteEditor({ note, onClose }: {note:StickyNote; onClose:()=>void}) {
  const [draft,setDraft]=useState(note);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const setupRequired=useWorkspaceStore(s=>s.setupRequired);
  const id=useId();
  const dirty=JSON.stringify(note)!==JSON.stringify(draft);
  useEffect(()=>{
    if(!dirty && !busy) return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
    window.addEventListener("beforeunload",warn);
    return ()=>window.removeEventListener("beforeunload",warn);
  },[dirty,busy]);
  const close=()=>{if(!busy && (!dirty || window.confirm("Discard your unsaved note changes?"))) onClose();};
  const save=async()=>{
    if(busy || setupRequired) return;
    if(!draft.title.trim()&&!draft.body.trim()){setError("Write a title or note before saving.");return;}
    setBusy(true);setError("");
    const success=await useWorkspaceStore.getState().upsertNote({...draft,title:draft.title.trim(),body:draft.body.trim()});
    setBusy(false);
    if(success) onClose();else setError(useWorkspaceStore.getState().error || "Could not save your note. Your text is still here.");
  };
  const archive=async()=>{
    if(busy || !window.confirm(dirty?"Archive this note and discard unsaved changes?":"Archive this note? You can restore it later.")) return;
    setBusy(true);setError("");
    const success=await useWorkspaceStore.getState().archiveNote(note.id,note.version);
    setBusy(false);
    if(success)onClose();else setError(useWorkspaceStore.getState().error || "Could not archive this note.");
  };
  return <NoteWindow title={note.version?"Edit sticky note":"New sticky note"} onClose={close} footer={<>
    {note.version?<LeafButton variant="outline" disabled={busy} onClick={()=>void archive()}><Archive size={15}/>Archive</LeafButton>:<span className="text-xs text-slate-500">Visible to the whole team</span>}
    <LeafButton disabled={busy||setupRequired} onClick={()=>void save()}><Save size={15}/>{busy?"Saving…":"Save note"}</LeafButton>
  </>}>
    <form onSubmit={e=>{e.preventDefault();void save();}}><fieldset disabled={busy} className="space-y-4">
      <div><label htmlFor={`${id}-title`} className="mb-1 block text-xs font-semibold text-slate-500">Title (optional)</label><input id={`${id}-title`} className="form-select" maxLength={120} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></div>
      <div><label htmlFor={`${id}-body`} className="mb-1 block text-xs font-semibold text-slate-500">Note</label><textarea id={`${id}-body`} className="form-select min-h-36" rows={6} maxLength={4000} value={draft.body} onChange={e=>setDraft({...draft,body:e.target.value})}/></div>
      <OfficerSelect value={draft.officerId} onChange={officerId=>setDraft({...draft,officerId})} label="Tag an officer" disabled={busy}/>
      <div role="group" aria-label="Note color" className="flex gap-3">{(Object.keys(noteColors) as StickyNote["color"][]).map(color=><button key={color} type="button" aria-label={color} aria-pressed={draft.color===color} className={`h-8 w-8 rounded-full border-2 ${draft.color===color?"border-sky-500":"border-transparent"}`} style={{backgroundColor:noteColors[color]}} onClick={()=>setDraft({...draft,color})}/>)}</div>
    </fieldset></form>
    {setupRequired&&<p className="mt-4 text-sm text-amber-700">Shared notes need database setup before saving.</p>}
    {error&&<p className="mt-4 text-sm text-rose-700" role="alert">{error}</p>}
  </NoteWindow>;
}
