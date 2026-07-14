"use client";

import { useEffect, useState } from "react";

/**
 * False on the server and on the first client render; true after mount.
 * Use to avoid hydration mismatches for wallet/theme/local-only UI.
 */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
