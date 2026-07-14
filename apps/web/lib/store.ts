import { create } from "zustand";
import type { RiskLevel } from "@/lib/scanner/classifyRisk";
import type { ScanRangeId } from "@/lib/scanner/scanRanges";

interface UiState {
  riskFilter: RiskLevel | "all";
  selectedKeys: string[];
  scanProgress: string | null;
  /** How far back eth_getLogs should go — default recent (fast) */
  scanRangeId: ScanRangeId;
  setRiskFilter: (f: RiskLevel | "all") => void;
  toggleSelected: (key: string) => void;
  setSelected: (keys: string[]) => void;
  clearSelected: () => void;
  setScanProgress: (msg: string | null) => void;
  setScanRangeId: (id: ScanRangeId) => void;
}

export const useUiStore = create<UiState>((set) => ({
  riskFilter: "all",
  selectedKeys: [],
  scanProgress: null,
  // Fast default — full history is opt-in (slow on public RPC)
  scanRangeId: "recent",
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
  setScanRangeId: (scanRangeId) => set({ scanRangeId, scanProgress: null }),
}));

export function approvalKey(token: string, spender: string): string {
  return `${token.toLowerCase()}-${spender.toLowerCase()}`;
}
