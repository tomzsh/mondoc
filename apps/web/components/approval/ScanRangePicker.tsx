"use client";

import { useQueryClient } from "@tanstack/react-query";
import { SCAN_RANGES, type ScanRangeId } from "@/lib/scanner/scanRanges";
import { useUiStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Props {
  /** Optional: true only while the *current* selection is scanning (still clickable others). */
  scanning?: boolean;
}

export function ScanRangePicker({ scanning }: Props) {
  const scanRangeId = useUiStore((s) => s.scanRangeId);
  const setScanRangeId = useUiStore((s) => s.setScanRangeId);
  const setScanProgress = useUiStore((s) => s.setScanProgress);
  const queryClient = useQueryClient();
  const active = SCAN_RANGES.find((r) => r.id === scanRangeId) ?? SCAN_RANGES[0];

  function select(id: ScanRangeId) {
    if (id === scanRangeId && !scanning) return;

    // Abort any long-running scan (e.g. stuck on "all") so the new range can start
    void queryClient.cancelQueries({ queryKey: ["approvals"] });
    setScanProgress(null);
    setScanRangeId(id);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-medium text-muted">History:</span>
        {SCAN_RANGES.map((r) => {
          const isActive = scanRangeId === r.id;
          return (
            <button
              key={r.id}
              type="button"
              title={r.description}
              onClick={() => select(r.id)}
              className={cn(
                "ui-chip shrink-0 !min-h-8 cursor-pointer !px-2.5 !text-[11px]",
                isActive && "border-accent bg-accent-soft text-accent",
                isActive && scanning && "opacity-90",
              )}
            >
              {r.shortLabel}
              {isActive && scanning ? "…" : ""}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted">
        {active.description}
        {scanning ? " · Scanning… click another range to cancel." : null}
      </p>
    </div>
  );
}
