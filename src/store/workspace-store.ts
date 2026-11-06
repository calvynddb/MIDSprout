"use client";
import { create } from "zustand";
import { sameRecords, type DataSnapshot } from "@/lib/data-snapshot";
import type { Officer, StickyNote } from "@/types/partnership";
interface WorkspaceState {
  notes: StickyNote[];
  officers: Officer[];
  error: string | null;
  loading: boolean;
  refresh: () => Promise<DataSnapshot | null>;
  upsertNote: (note: StickyNote) => Promise<boolean>;
  upsertOfficer: (officer: Officer) => Promise<boolean>;
  archiveNote: (id: string, expectedVersion?: number) => Promise<boolean>;
  restoreNote: (id: string, expectedVersion?: number) => Promise<boolean>;
  archiveOfficer: (id: string, expectedVersion?: number) => Promise<boolean>;
  restoreOfficer: (id: string, expectedVersion?: number) => Promise<boolean>;
}
let epoch = 0;
let refreshing = false;
async function request(body?: Record<string, unknown>) {
  const response = await fetch("/api/data", { method: body ? "POST" : "GET", cache: "no-store", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not connect to the shared workspace.");
  return { ...result, notes: result.notes || [], officers: result.officers || [] } as DataSnapshot;
}
async function mutate(body: Record<string, unknown>) {
  epoch += 1;
  useWorkspaceStore.setState({ error: null });
  try { const snapshot = await request(body); epoch += 1; useWorkspaceStore.setState({ notes: snapshot.notes, officers: snapshot.officers, error: null }); return true; }
  catch (error) { epoch += 1; useWorkspaceStore.setState({ error: error instanceof Error ? error.message : "Could not save." }); return false; }
}
export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  notes: [], officers: [], error: null, loading: true,
  refresh: async () => {
    if (refreshing) return null;
    refreshing = true; const started = epoch;
    try {
      const snapshot = await request();
      if (started !== epoch) return null;
      set((state) => ({
        notes: sameRecords(state.notes, snapshot.notes) ? state.notes : snapshot.notes,
        officers: sameRecords(state.officers, snapshot.officers) ? state.officers : snapshot.officers,
        error: null,
      }));
      return snapshot;
    }
    catch (error) { if (started === epoch) set({ error: error instanceof Error ? error.message : "Could not load the workspace." }); return null; }
    finally { refreshing = false; set({ loading: false }); }
  },
  upsertNote: (note) => mutate({ action: "upsert-note", note, expectedVersion: note.version ?? 0 }),
  upsertOfficer: (officer) => mutate({ action: "upsert-officer", officer, expectedVersion: officer.version ?? 0 }),
  archiveNote: (id, expectedVersion) => mutate({ action: "archive", kind: "note", id, expectedVersion: expectedVersion ?? get().notes.find((note) => note.id === id)?.version ?? 0 }),
  restoreNote: (id, expectedVersion) => mutate({ action: "restore", kind: "note", id, expectedVersion: expectedVersion ?? get().notes.find((note) => note.id === id)?.version ?? 0 }),
  archiveOfficer: (id, expectedVersion) => mutate({ action: "archive", kind: "officer", id, expectedVersion: expectedVersion ?? get().officers.find((officer) => officer.id === id)?.version ?? 0 }),
  restoreOfficer: (id, expectedVersion) => mutate({ action: "restore", kind: "officer", id, expectedVersion: expectedVersion ?? get().officers.find((officer) => officer.id === id)?.version ?? 0 }),
}));
