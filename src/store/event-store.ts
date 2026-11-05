"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import seed from "@/data/events.json";
import type { PartnershipEvent } from "@/types/partnership";
import { deleteDatabaseRecord, sendDatabaseMutation } from "@/lib/sync-client";

interface EventState {
  events: PartnershipEvent[];
  collaborationTypes: string[];
  committeeOptions: string[];
  drawerOpen: boolean;
  selectedEventId: string | null;
  openEvent: (id: string) => void;
  openCreateEvent: () => void;
  closeEvent: () => void;
  upsertEvent: (event: PartnershipEvent) => void;
  saveEvent: (event: PartnershipEvent) => Promise<boolean>;
  archiveEvent: (id: string) => Promise<boolean>;
  restoreEvent: (id: string) => Promise<boolean>;
  lastError: string | null;
  replaceRemoteData: (events: PartnershipEvent[], collaborationTypes: string[], committeeOptions: string[]) => void;
  deleteEvent: (id: string) => Promise<boolean>;
  addCollaborationType: (value: string) => void;
  addCommitteeOption: (value: string) => void;
}

const DEFAULT_COLLABORATION_TYPES = ["Media partnership", "Joint partnership"];
const DEFAULT_COMMITTEES = ["Academics Committee", "Environment and Community Extensions Committee"];
const addUniqueOption = (items: string[], value: string) => {
  const cleaned = value.trim();
  return cleaned && !items.some((item) => item.toLowerCase() === cleaned.toLowerCase()) ? [...items, cleaned] : items;
};

type LegacyEvent = Partial<PartnershipEvent> & {
  id: string;
  participants?: Array<{ partnerId: string; committees?: string[] }>;
};

function migrateEvent(event: LegacyEvent): PartnershipEvent {
  const committees = [...new Set([
    ...(event.committees ?? []),
    ...(event.participants ?? []).flatMap((participant) => participant.committees ?? []),
  ])];
  return {
    id: event.id,
    name: event.name ?? "Untitled collaboration",
    collaborationType: event.collaborationType ?? "Joint partnership",
    committees,
    startDate: event.startDate ?? "",
    endDate: event.endDate ?? "",
    startTime: event.startTime ?? "",
    endTime: event.endTime ?? "",
    location: event.location ?? "",
    description: event.description ?? "",
    status: event.status ?? "planning",
    participants: (event.participants ?? []).map((item) => ({ ...item, partnerId: item.partnerId })),
    archivedAt: event.archivedAt ?? null,
    officerId: event.officerId ?? null,
    tasks: event.tasks ?? [],
  };
}

export const useEventStore = create<EventState>()(persist((set) => ({
  lastError: null,
  events: seed as PartnershipEvent[],
  collaborationTypes: DEFAULT_COLLABORATION_TYPES,
  committeeOptions: DEFAULT_COMMITTEES,
  drawerOpen: false,
  selectedEventId: null,
  openEvent: (id) => set({ drawerOpen: true, selectedEventId: id }),
  openCreateEvent: () => set({ drawerOpen: true, selectedEventId: null }),
  closeEvent: () => set({ drawerOpen: false, selectedEventId: null }),
  upsertEvent: (event) => {
    set((state) => {
      const index = state.events.findIndex((item) => item.id === event.id);
      if (index < 0) return { events: [...state.events, event] };
      const events = [...state.events];
      events[index] = event;
      return { events };
    });
    void sendDatabaseMutation({ action: "upsert-collaboration", event });
  },
  saveEvent: async (event) => {
    set({ lastError: null });
    try {
      const response = await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "upsert-collaboration", event }) });
      if (!response.ok) throw new Error((await response.json()).error || "Could not save collaboration.");
      set((state) => ({ events: state.events.some((item) => item.id === event.id) ? state.events.map((item) => item.id === event.id ? event : item) : [...state.events, event] }));
      return true;
    } catch (error) { set({ lastError: error instanceof Error ? error.message : "Could not save collaboration." }); return false; }
  },
  archiveEvent: (id) => setCollaborationArchived(id, true),
  restoreEvent: (id) => setCollaborationArchived(id, false),
  replaceRemoteData: (events, collaborationTypes, committeeOptions) => set({
    events,
    collaborationTypes: [...new Set([...DEFAULT_COLLABORATION_TYPES, ...collaborationTypes, ...events.map((event) => event.collaborationType)])],
    committeeOptions: [...new Set([...DEFAULT_COMMITTEES, ...committeeOptions, ...events.flatMap((event) => event.committees)])],
  }),
  deleteEvent: async (id) => {
    const deleted = await deleteDatabaseRecord("collaboration", id);
    if (deleted) set((state) => ({ events: state.events.filter((event) => event.id !== id) }));
    return deleted;
  },
  addCollaborationType: (value) => {
    const before = useEventStore.getState().collaborationTypes;
    set((state) => ({ collaborationTypes: addUniqueOption(state.collaborationTypes, value) }));
    if (!before.some((item) => item.toLowerCase() === value.trim().toLowerCase())) void sendDatabaseMutation({ action: "add-option", kind: "collaboration_type", value });
  },
  addCommitteeOption: (value) => {
    const before = useEventStore.getState().committeeOptions;
    set((state) => ({ committeeOptions: addUniqueOption(state.committeeOptions, value) }));
    if (!before.some((item) => item.toLowerCase() === value.trim().toLowerCase())) void sendDatabaseMutation({ action: "add-option", kind: "committee", value });
  },
}), {
  name: "midsprout-events",
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({ events: state.events, collaborationTypes: state.collaborationTypes, committeeOptions: state.committeeOptions }),
  version: 3,
  migrate: (persistedState) => {
    const persisted = persistedState as { events?: LegacyEvent[]; collaborationTypes?: string[]; committeeOptions?: string[] };
    const events = (persisted.events ?? []).map(migrateEvent);
    const collaborationTypes = events.reduce((types, event) => addUniqueOption(types, event.collaborationType), [...DEFAULT_COLLABORATION_TYPES, ...(persisted.collaborationTypes ?? [])]);
    const committeeOptions = events.flatMap((event) => event.committees).reduce(addUniqueOption, [...DEFAULT_COMMITTEES, ...(persisted.committeeOptions ?? [])]);
    return { events, collaborationTypes, committeeOptions };
  },
}));

async function setCollaborationArchived(id: string, archive: boolean): Promise<boolean> {
  useEventStore.setState({ lastError: null });
  try {
    const response = await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: archive ? "archive" : "restore", entity: "collaboration", id }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not update collaboration archive.");
    useEventStore.setState((state) => ({ events: state.events.map((event) => event.id === id ? { ...event, archivedAt: result.archivedAt } : event) }));
    return true;
  } catch (error) { useEventStore.setState({ lastError: error instanceof Error ? error.message : "Could not update collaboration archive." }); return false; }
}
