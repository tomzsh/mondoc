import { create } from "zustand";
import type { RiskLevel } from "@/lib/scanner/classifyRisk";

interface UiState {
  riskFilter: RiskLevel | "all";
  selectedKeys: string[];
  scanProgress: string | null;
  setRiskFilter: (f: RiskLevel | "all") => void;
  toggleSelected: (key: string) => void;
  setSelected: (keys: string[]) => void;
  clearSelected: () => void;
  setScanProgress: (msg: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  riskFilter: "all",
  selectedKeys: [],
  scanProgress: null,
  setRiskFilter: (riskFilter) => set({ riskFilter }),
  toggleSelected: (key) =>
    set((s) => ({
      selectedKeys: s.selectedKeys.includes(key)
        ? s.selectedKeys.filter((k) => k !== key)
        : [...s.selectedKeys, key],
    })),
  setSelected: (selectedKeys) => set({ selectedKeys }),
  clearSelected: () => set({ selectedKeys: [] }),
  setScanProgress: (scanProgress) => set({ scanProgress }),
}));

export function approvalKey(token: string, spender: string): string {
  return `${token.toLowerCase()}-${spender.toLowerCase()}`;
}
