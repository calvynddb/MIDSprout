"use client";

import { useRef, useState } from "react";
import { GripHorizontal, Pencil, UserRound } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { StickyNote } from "@/types/partnership";
import { normalizedPosition, notePosition } from "@/lib/note-position";
import { noteColors } from "./NoteEditor";

export function NoteCard({note,width,height,onEdit}:{note:StickyNote;width:number;height:number;onEdit:()=>void}) {
  const base=notePosition(note.x,note.y,width,height);
  const [position,setPosition]=useState<{left:number;top:number}|null>(null);
  const [error,setError]=useState("");
  const [saving,setSaving]=useState(false);
  const pending=useRef(false);
  const drag=useRef<{x:number;y:number;left:number;top:number;note:StickyNote}|null>(null);
  const officer=useWorkspaceStore(s=>s.officers.find(o=>o.id===note.officerId));
  const left=position?.left??base.left,top=position?.top??base.top;
  const clamp=(value:number,max:number)=>Math.max(0,Math.min(value,max));
  const persist=async(nextLeft:number,nextTop:number,original:StickyNote)=>{
    if(pending.current)return;
    pending.current=true;setSaving(true);setError("");
    const state=useWorkspaceStore.getState();
    const success=await state.upsertNote({...original,...normalizedPosition(nextLeft,nextTop,base.horizontal,base.vertical),zIndex:Math.max(0,...state.notes.map(n=>n.zIndex))+1});
    pending.current=false;setSaving(false);setPosition(null);
    if(!success)setError(useWorkspaceStore.getState().error||"Move could not be saved.");
  };
  return <article aria-label={note.title||"Sticky note"} className="pointer-events-auto absolute flex h-56 w-[248px] max-w-full flex-col overflow-hidden rounded-br-2xl border border-black/10 shadow-xl" style={{left,top,zIndex:position?10000:note.zIndex,backgroundColor:noteColors[note.color]}}>
    <header className="flex items-center justify-between border-b border-black/5 bg-white/20 px-3 py-1">
      <button type="button" className="flex min-h-8 touch-none items-center gap-1 text-xs text-slate-600" aria-disabled={saving} aria-label={`Move ${note.title||"note"}; use arrow keys to reposition`}
        onPointerDown={e=>{if(pending.current||e.button!==0)return;e.preventDefault();drag.current={x:e.clientX,y:e.clientY,left,top,note:structuredClone(note)};e.currentTarget.setPointerCapture(e.pointerId);}}
        onPointerMove={e=>{const origin=drag.current;if(origin)setPosition({left:clamp(origin.left+e.clientX-origin.x,base.horizontal),top:clamp(origin.top+e.clientY-origin.y,base.vertical)});}}
        onPointerUp={e=>{const origin=drag.current;if(!origin)return;drag.current=null;e.currentTarget.releasePointerCapture(e.pointerId);const x=clamp(origin.left+e.clientX-origin.x,base.horizontal),y=clamp(origin.top+e.clientY-origin.y,base.vertical);if(Math.abs(x-origin.left)+Math.abs(y-origin.top)>2)void persist(x,y,origin.note);else setPosition(null);}}
        onPointerCancel={()=>{drag.current=null;setPosition(null);}}
        onKeyDown={e=>{if(!e.key.startsWith("Arrow"))return;e.preventDefault();if(pending.current)return;const step=e.shiftKey?40:12;void persist(left+(e.key==="ArrowRight"?step:e.key==="ArrowLeft"?-step:0),top+(e.key==="ArrowDown"?step:e.key==="ArrowUp"?-step:0),note);}}>
        <GripHorizontal size={16}/>{saving?"Saving…":"Move"}
      </button>
      <button type="button" aria-label={`Edit ${note.title||"note"}`} disabled={saving} className="rounded-full p-2 text-slate-600 hover:bg-white/40" onClick={onEdit}><Pencil size={14}/></button>
    </header>
    <div className="min-h-0 flex-1 overflow-auto px-4 py-3">{note.title&&<h3 className="mb-2 text-sm font-semibold text-slate-700">{note.title}</h3>}<p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-600">{note.body}</p></div>
    <footer className="flex items-center gap-1 px-4 pb-3 text-[11px] text-slate-500"><UserRound size={12}/>{officer?.name||"For the team"}{error&&<span className="ml-auto text-rose-700" title={error} role="status">Not saved</span>}</footer>
  </article>;
}
