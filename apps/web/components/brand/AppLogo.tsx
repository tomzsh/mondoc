import { cn } from "@/lib/utils";

/**
 * Authentic Wallet Doctor brand mark.
 * Clinical seal: ring + cross + diagnostic pulse — monochrome research aesthetic.
 */
export function AppLogo({
  className,
  size = 32,
  variant = "auto",
}: {
  className?: string;
  size?: number;
  /** dark = white-on-black mark (for dark UI), light = black-on-paper */
  variant?: "auto" | "dark" | "light" | "mono";
}) {
  const invert =
    variant === "light"
      ? false
      : variant === "dark" || variant === "mono"
        ? true
        : true; // default dark mark; CSS can invert in light mode via class

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "shrink-0",
        variant === "auto" && "logo-mark",
        className,
      )}
      aria-hidden
      data-invert={invert ? "1" : "0"}
    >
      <rect
        width="64"
        height="64"
        rx="14"
        className="logo-mark-bg"
        fill="currentColor"
        fillOpacity="0.06"
      />
      <rect
        x="1.5"
        y="1.5"
        width="61"
        height="61"
        rx="12.5"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="1.5"
      />
      <circle
        cx="32"
        cy="32"
        r="20"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeOpacity="0.95"
      />
      <circle
        cx="32"
        cy="32"
        r="16.5"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeOpacity="0.35"
      />
      {/* medical cross */}
      <path
        d="M30 20h4v8h8v4h-8v8h-4v-8h-8v-4h8v-8z"
        fill="currentColor"
      />
      {/* ECG pulse */}
      <path
        d="M14 44h8l2.5-5 3 10 3.5-14 2.5 9H50"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="square"
        strokeLinejoin="miter"
        opacity="0.55"
        fill="none"
      />
    </svg>
  );
}

/** Full wordmark: mark + WALLET DOCTOR / MONAD */
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
      <AppLogo size={size} variant="auto" />
      <div className="min-w-0 leading-none">
        <div className="truncate font-body text-[13px] font-semibold tracking-[0.04em] text-foreground sm:text-sm">
          WALLET DOCTOR
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
