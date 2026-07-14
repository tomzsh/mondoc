"use client";

import { ConnectButton as RKConnectButton } from "@rainbow-me/rainbowkit";

export function ConnectButton() {
  return (
    <RKConnectButton
      chainStatus="icon"
      accountStatus={{
        smallScreen: "avatar",
        largeScreen: "full",
      }}
      showBalance={{
        smallScreen: false,
        largeScreen: true,
      }}
    />
  );
}
