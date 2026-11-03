"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import seed from "@/data/partnerships.json";
import type { Partnership } from "@/types/partnership";

interface PartnerState {
  partners: Partnership[];
  upsertPartner: (partner: Partnership) => void;
}

export const usePartnerStore = create<PartnerState>()(persist((set) => ({
  partners: seed as Partnership[],
  upsertPartner: (partner) =>
    set((state) => {
      const index = state.partners.findIndex((item) => item.id === partner.id);
      if (index === -1) {
        return { partners: [partner, ...state.partners] };
      }
      const next = [...state.partners];
      next[index] = partner;
      return { partners: next };
    }),
}), { name: "midsprout-organizations", storage: createJSONStorage(() => localStorage), partialize: (state) => ({ partners: state.partners }) }));
