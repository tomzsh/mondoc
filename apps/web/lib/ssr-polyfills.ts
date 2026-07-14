/**
 * WalletConnect / some wallet SDKs touch indexedDB at import time.
 * Node (SSR / static generation) has no indexedDB — polyfill before any WC import.
 * Safe on the client: real browser indexedDB is already defined, so this is a no-op.
 */
if (typeof globalThis.indexedDB === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("fake-indexeddb/auto");
}

export {};
