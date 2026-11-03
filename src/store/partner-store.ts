"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import seed from "@/data/partnerships.json";
import type { Partnership } from "@/types/partnership";
import { sendDatabaseMutation } from "@/lib/sync-client";

interface PartnerState {
  partners: Partnership[];
  upsertPartner: (partner: Partnership) => void;
  replacePartners: (partners: Partnership[]) => void;
}

export const usePartnerStore = create<PartnerState>()(persist((set) => ({
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
}), { name: "midsprout-organizations", storage: createJSONStorage(() => localStorage), partialize: (state) => ({ partners: state.partners }) }));
