import { create } from "zustand";
import type { RiskLevel } from "@/lib/scanner/classifyRisk";
import type { ScanRangeId } from "@/lib/scanner/scanRanges";

interface UiState {
  riskFilter: RiskLevel | "all";
  selectedKeys: string[];
  scanProgress: string | null;
  /** How far back eth_getLogs should go — default recent (fast) */
  scanRangeId: ScanRangeId;
  /**
   * Cleanups logged this session but not yet in onchain historyLength.
   * Score uses onchainTotal + pendingCleanups until chain catches up.
   */
  pendingCleanups: number;
  /**
   * Tombstones: approval keys revoked this session. Filters scan results so a
   * stale HyperSync rescan cannot resurrect them until a fresh scan confirms 0.
   */
  revokedKeys: string[];
  setRiskFilter: (f: RiskLevel | "all") => void;
  toggleSelected: (key: string) => void;
  setSelected: (keys: string[]) => void;
  clearSelected: () => void;
  setScanProgress: (msg: string | null) => void;
  setScanRangeId: (id: ScanRangeId) => void;
  addPendingCleanups: (n: number) => void;
  /** Reduce pending when onchain historyLength increases by `delta`. */
  consumePendingCleanups: (delta: number) => void;
  clearPendingCleanups: () => void;
  markRevoked: (keys: string[]) => void;
  /**
   * After a successful full scan, drop tombstones for pairs no longer present
   * (confirmed gone) and keep any still-listed (scan lag).
   */
  reconcileRevokedWithScan: (activeKeys: string[]) => void;
  resetSessionCache: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  riskFilter: "all",
  selectedKeys: [],
  scanProgress: null,
  scanRangeId: "recent",
  pendingCleanups: 0,
  revokedKeys: [],
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
  setScanRangeId: (scanRangeId) =>
    set({ scanRangeId, scanProgress: null }),
  addPendingCleanups: (n) =>
    set((s) => ({
      pendingCleanups: Math.max(0, s.pendingCleanups + n),
    })),
  consumePendingCleanups: (delta) =>
    set((s) => ({
      pendingCleanups: Math.max(0, s.pendingCleanups - Math.max(0, delta)),
    })),
  clearPendingCleanups: () => set({ pendingCleanups: 0 }),
  markRevoked: (keys) =>
    set((s) => {
      const next = new Set(s.revokedKeys);
      for (const k of keys) next.add(k);
      return { revokedKeys: [...next] };
    }),
  reconcileRevokedWithScan: (activeKeys) =>
    set((s) => {
      if (s.revokedKeys.length === 0) return s;
      const active = new Set(activeKeys);
      // Keep tombstone only if scan still lists it (indexer lag)
      const kept = s.revokedKeys.filter((k) => active.has(k));
      return kept.length === s.revokedKeys.length
        ? s
        : { revokedKeys: kept };
    }),
  resetSessionCache: () =>
    set({
      pendingCleanups: 0,
      revokedKeys: [],
      selectedKeys: [],
      scanProgress: null,
    }),
}));

export function approvalKey(token: string, spender: string): string {
  return `${token.toLowerCase()}-${spender.toLowerCase()}`;
}
