import Link from "next/link";
import { AppLogo } from "@/components/brand/AppLogo";

const TWITTER = "https://x.com/0xTomzsh";
const GITHUB = "https://github.com/tomzsh/wallet-doctor";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AppLogo size={28} />
            Wallet Doctor
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-muted">
            Never custodies funds. Revoke goes straight to the token contract.
            Onchain cleanup proof on Monad.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={TWITTER}
            target="_blank"
            rel="noreferrer"
            className="ui-btn-secondary !w-auto !min-h-9 px-3 text-xs"
          >
            <XIcon />
            @0xTomzsh
          </a>
          <a
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            className="ui-btn-secondary !w-auto !min-h-9 px-3 text-xs"
          >
            <GitHubIcon />
            GitHub
          </a>
        </div>
      </div>
      <div className="border-t border-border px-4 py-3 text-center text-[11px] text-muted sm:px-6">
        Built for{" "}
        <a href="https://www.monad.xyz" target="_blank" rel="noreferrer" className="ui-link">
          Monad
        </a>
        {" · "}
        <Link href="/" className="ui-link">
          Wallet Doctor
        </Link>
        {" · "}
        <a href={GITHUB} target="_blank" rel="noreferrer" className="ui-link">
          GitHub
        </a>
      </div>
    </footer>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}
