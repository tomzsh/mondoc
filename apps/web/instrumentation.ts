/** Polyfill indexedDB on Node so WalletConnect does not throw during SSR. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("fake-indexeddb/auto");
  }
}
