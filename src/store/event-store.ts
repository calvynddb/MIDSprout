"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import seed from "@/data/events.json";
import type { PartnershipEvent } from "@/types/partnership";

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
    participants: (event.participants ?? []).map(({ partnerId }) => ({ partnerId })),
  };
}

export const useEventStore = create<EventState>()(persist((set) => ({
  events: seed as PartnershipEvent[],
  collaborationTypes: DEFAULT_COLLABORATION_TYPES,
  committeeOptions: DEFAULT_COMMITTEES,
  drawerOpen: false,
  selectedEventId: null,
  openEvent: (id) => set({ drawerOpen: true, selectedEventId: id }),
  openCreateEvent: () => set({ drawerOpen: true, selectedEventId: null }),
  closeEvent: () => set({ drawerOpen: false, selectedEventId: null }),
  upsertEvent: (event) => set((state) => {
    const index = state.events.findIndex((item) => item.id === event.id);
    if (index < 0) return { events: [...state.events, event] };
    const events = [...state.events];
    events[index] = event;
    return { events };
  }),
  addCollaborationType: (value) => set((state) => ({ collaborationTypes: addUniqueOption(state.collaborationTypes, value) })),
  addCommitteeOption: (value) => set((state) => ({ committeeOptions: addUniqueOption(state.committeeOptions, value) })),
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
