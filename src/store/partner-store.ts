"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import seed from "@/data/partnerships.json";
import type { Partnership } from "@/types/partnership";
import { deleteDatabaseRecord, deleteDatabaseRecords, sendDatabaseMutation } from "@/lib/sync-client";

interface PartnerState {
  partners: Partnership[];
  upsertPartner: (partner: Partnership) => void;
  replacePartners: (partners: Partnership[]) => void;
  deletePartner: (id: string) => Promise<boolean>;
  deletePartners: (ids: string[]) => Promise<boolean>;
  archivePartner: (id: string) => Promise<boolean>;
  restorePartner: (id: string) => Promise<boolean>;
  lastError: string | null;
}

export const usePartnerStore = create<PartnerState>()(persist((set) => ({
  lastError: null,
  archivePartner: (id) => setPartnerArchived(id, true),
  restorePartner: (id) => setPartnerArchived(id, false),
  partners: seed as Partnership[],
  upsertPartner: (partner) => {
    set((state) => {
      const index = state.partners.findIndex((item) => item.id === partner.id);
      if (index === -1) {
        return { partners: [partner, ...state.partners] };
      }
      const next = [...state.partners];
      next[index] = partner;
      return { partners: next };
    });
    void sendDatabaseMutation({ action: "upsert-organization", partner });
  },
  replacePartners: (partners) => set({ partners }),
  deletePartner: async (id) => {
    const deleted = await deleteDatabaseRecord("organization", id);
    if (deleted) set((state) => ({ partners: state.partners.filter((partner) => partner.id !== id) }));
    return deleted;
  },
  deletePartners: async (ids) => {
    if (ids.length === 0) return true;
    const deleted = await deleteDatabaseRecords("organizations", ids);
    if (deleted) {
      const selected = new Set(ids);
      set((state) => ({ partners: state.partners.filter((partner) => !selected.has(partner.id)) }));
    }
    return deleted;
  },
}), { name: "midsprout-organizations", storage: createJSONStorage(() => localStorage), partialize: (state) => ({ partners: state.partners }) }));

async function setPartnerArchived(id: string, archive: boolean): Promise<boolean> {
  usePartnerStore.setState({ lastError: null });
  try {
    const response = await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: archive ? "archive" : "restore", entity: "organization", id }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not update organization archive.");
    usePartnerStore.setState((state) => ({ partners: state.partners.map((partner) => partner.id === id ? { ...partner, archivedAt: result.archivedAt } : partner) }));
    return true;
  } catch (error) { usePartnerStore.setState({ lastError: error instanceof Error ? error.message : "Could not update organization archive." }); return false; }
}
