"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type View =
  | "overview"
  | "sites"
  | "content"
  | "keywords"
  | "reports"
  | "settings";

type UIState = {
  view: View;
  selectedSiteId: string | null;
  setView: (v: View) => void;
  setSelectedSiteId: (id: string | null) => void;
};

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      view: "overview",
      selectedSiteId: null,
      setView: (view) => set({ view }),
      setSelectedSiteId: (selectedSiteId) => set({ selectedSiteId }),
    }),
    {
      name: "seoscout-ui",
      partialize: (s) => ({ selectedSiteId: s.selectedSiteId, view: s.view }),
    }
  )
);
