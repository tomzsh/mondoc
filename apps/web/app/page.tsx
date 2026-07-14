"use client";

import { HomeClient } from "@/components/home/HomeClient";

/** Direct client page — no nested React.lazy that can stick on a boot skeleton. */
export default function HomePage() {
  return <HomeClient />;
}
