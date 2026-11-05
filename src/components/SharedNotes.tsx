"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, List, Plus, RotateCcw, UsersRound } from "lucide-react";
import { LeafButton } from "@/components/ui/leaf-button";
import { OfficerManager } from "@/components/OfficerManager";
import { NoteWindow } from "@/components/shared-notes/NoteWindow";
import { NoteEditor } from "@/components/shared-notes/NoteEditor";
import { NoteCard } from "@/components/shared-notes/NoteCard";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { StickyNote } from "@/types/partnership";

export function SharedNotes() {
  const notes=useWorkspaceStore(s=>s.notes);
  const officers=useWorkspaceStore(s=>s.officers);
  const setupRequired=useWorkspaceStore(s=>s.setupRequired);
  const loading=useWorkspaceStore(s=>s.loading);
  const connectionError=useWorkspaceStore(s=>s.error);
  const [show,setShow]=useState(true);
  const [editing,setEditing]=useState<StickyNote|null>(null);
  const [list,setList]=useState(false);
  const [archived,setArchived]=useState(false);
  const [roster,setRoster]=useState(false);
  const [busy,setBusy]=useState<string|null>(null);
  const [error,setError]=useState("");
  const board=useRef<HTMLDivElement>(null);
  const [size,setSize]=useState({width:0,height:0});
  useEffect(()=>{
    if(!board.current)return;
    const observer=new ResizeObserver(([entry])=>setSize({width:entry.contentRect.width,height:entry.contentRect.height}));
    observer.observe(board.current);return ()=>observer.disconnect();
  },[]);
  const active=notes.filter(n=>!n.archivedAt);
  const visible=notes.filter(n=>Boolean(n.archivedAt)===archived);
  const create=()=>{setShow(true);setEditing({id:`note-${crypto.randomUUID()}`,title:"",body:"",color:"yellow",officerId:null,x:.7,y:.2,zIndex:Math.max(0,...notes.map(n=>n.zIndex))+1});};
  return <>
    <div className="fixed right-4 top-3 z-30 flex max-w-[calc(100vw-32px)] flex-wrap justify-end gap-2">
      <LeafButton variant="glass" className="px-3 py-2 text-xs" onClick={create} disabled={loading}><Plus size={14}/>Add note</LeafButton>
      <LeafButton variant="glass" className="px-3 py-2 text-xs" onClick={()=>setShow(!show)} aria-pressed={show}>{show?<EyeOff size={14}/>:<Eye size={14}/>} {show?"Hide notes":"Show notes"}</LeafButton>
      <LeafButton variant="glass" className="px-3 py-2 text-xs" onClick={()=>setList(true)}><List size={14}/>Notes ({active.length})</LeafButton>
      <LeafButton variant="glass" className="px-3 py-2 text-xs" onClick={()=>setRoster(true)}><UsersRound size={14}/>Officers</LeafButton>
      {setupRequired&&!loading&&<span className="w-full text-right text-[11px] text-slate-600">Shared notes need database setup</span>}
      {connectionError&&!setupRequired&&<span className="w-full max-w-xs text-right text-[11px] text-rose-700" role="status">{connectionError}</span>}
    </div>
    <div ref={board} className="pointer-events-none fixed inset-3 z-20">{show&&size.width>0&&active.map(note=><NoteCard key={note.id} note={note} width={size.width} height={size.height} onEdit={()=>setEditing(structuredClone(note))}/>)}</div>
    {editing&&<NoteEditor key={editing.id} note={editing} onClose={()=>setEditing(null)}/>}
    {roster&&<OfficerManager onClose={()=>setRoster(false)}/>}
    {list&&<NoteWindow title="Workspace notes" onClose={()=>setList(false)}>
      <div className="mb-4 flex gap-2"><LeafButton variant={archived?"outline":"primary"} onClick={()=>setArchived(false)}>Active</LeafButton><LeafButton variant={archived?"primary":"outline"} onClick={()=>setArchived(true)}>Archived</LeafButton></div>
      {error&&<p role="alert" className="mb-3 text-sm text-rose-700">{error}</p>}
      <div className="space-y-2">{visible.map(note=><div key={note.id} className="flex items-center justify-between gap-3 rounded-lg border border-sky-100 p-3">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={()=>{if(note.archivedAt)return;setList(false);setShow(true);setEditing(structuredClone(note));}}><strong className="block truncate text-sm text-slate-700">{note.title||note.body.slice(0,60)||"Untitled note"}</strong><span className="text-xs text-slate-500">{officers.find(o=>o.id===note.officerId)?.name||"For the team"}</span></button>
        {note.archivedAt&&<LeafButton variant="outline" disabled={busy!==null||setupRequired} onClick={async()=>{setBusy(note.id);setError("");const success=await useWorkspaceStore.getState().restoreNote(note.id,note.version);setBusy(null);if(!success)setError(useWorkspaceStore.getState().error||"Could not restore this note.");}}><RotateCcw size={14}/>{busy===note.id?"Restoring…":"Restore"}</LeafButton>}
      </div>)}{!visible.length&&<p className="py-6 text-sm text-slate-500">{archived?"No archived notes.":"Leave a note for the team using Add note."}</p>}</div>
    </NoteWindow>}
  </>;
}
