import { cn } from "@/lib/utils";
import { FirstAidKit } from "@phosphor-icons/react";

/**
 * MonDoc brand mark — clinical seal + Phosphor FirstAidKit.
 */
export function AppLogo({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border border-border bg-surface text-foreground",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <FirstAidKit size={Math.round(size * 0.55)} weight="regular" />
    </span>
  );
}

/** Full wordmark: mark + MONDOC */
export function AppWordmark({
  className,
  size = 28,
  showTagline = true,
}: {
  className?: string;
  size?: number;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <AppLogo size={size} />
      <div className="min-w-0 leading-none">
        <div className="truncate font-body text-[13px] font-semibold tracking-[0.08em] text-foreground sm:text-sm">
          MONDOC
        </div>
        {showTagline && (
          <div className="mt-0.5 hidden font-mono text-[10px] uppercase tracking-[0.16em] text-muted sm:block">
            Monad · Clinical Scan
          </div>
        )}
      </div>
    </div>
  );
}
