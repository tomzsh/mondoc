"use client";

import { useEffect } from "react";
import { installChunkLoadRecovery } from "@/lib/chunkLoadRecovery";

/**
 * Mount once near the app root so deploy/stale-tab ChunkLoadErrors
 * auto-reload to the latest build instead of a red error overlay.
 */
export function ChunkLoadRecovery() {
  useEffect(() => installChunkLoadRecovery(), []);
  return null;
}
