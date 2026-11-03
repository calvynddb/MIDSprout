"use client";

import { create } from "zustand";
import type { CameraView, PartnerCategory } from "@/types/partnership";

interface CanvasState {
  view: CameraView;
  drawerOpen: boolean;
  drawerMode: "edit" | "create";
  selectedPartnerId: string | null;
  activeCategory: PartnerCategory | null;
  initialPartnerCategory: PartnerCategory | null;
  goTo: (view: CameraView) => void;
  setActiveCategory: (category: PartnerCategory) => void;
  openDrawer: (partnerId: string) => void;
  openCreateDrawer: (category?: PartnerCategory) => void;
  closeDrawer: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  view: "root",
  drawerOpen: false,
  drawerMode: "edit",
  selectedPartnerId: null,
  activeCategory: null,
  initialPartnerCategory: null,
  goTo: (view) => set({ view }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  openDrawer: (partnerId) => set({ drawerOpen: true, drawerMode: "edit", selectedPartnerId: partnerId }),
  openCreateDrawer: (category) => set({ drawerOpen: true, drawerMode: "create", selectedPartnerId: null, initialPartnerCategory: category ?? null }),
  closeDrawer: () => set({ drawerOpen: false, selectedPartnerId: null, drawerMode: "edit", initialPartnerCategory: null }),
}));
