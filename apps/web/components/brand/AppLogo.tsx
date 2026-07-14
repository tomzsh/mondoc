import { cn } from "@/lib/utils";

/** Minimal app mark — clean geometric monogram, not a mascot */
export function AppLogo({
  className,
  size = 28,
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
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="#6E54FF" />
      <path
        d="M9 22V10l7 8 7-8v12h-3.2v-6.6L16 19.2l-3.8-3.8V22H9z"
        fill="white"
      />
    </svg>
  );
}
