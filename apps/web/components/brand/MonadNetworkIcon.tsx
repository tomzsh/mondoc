import { cn } from "@/lib/utils";

/** Official-style Monad network mark for chain switcher (logo only, no mascot) */
export function MonadNetworkIcon({
  className,
  size = 16,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 rounded-full", className)}
      aria-hidden
    >
      <circle cx="16" cy="16" r="16" fill="#6E54FF" />
      <path
        d="M9.5 22V10l6.5 7.5L22.5 10v12h-2.8v-7.2L16 19.4l-3.7-4.6V22H9.5z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export const MONAD_CHAIN_IDS = new Set([10143, 143]);
