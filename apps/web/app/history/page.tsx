"use client";

import { useAccount } from "wagmi";
import { ArrowSquareOut, Scroll } from "@phosphor-icons/react";
import { ChainGuard } from "@/components/wallet/ChainGuard";
import { useCleanupHistory } from "@/hooks/useCleanupHistory";
import { shortAddress } from "@/lib/utils";
import { getExplorerAddressUrl, monadMainnet } from "@/lib/wagmi";
import { isContractConfigured, WALLET_DOCTOR_LOG } from "@/lib/contracts/addresses";
import { ScoreHistoryChart } from "@/components/score/ScoreHistoryChart";

export default function HistoryPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="section-kicker">Protocol · History</p>
        <h1 className="page-title mt-2">Onchain Cleanup History</h1>
        <p className="page-desc">
          Successful revokes can be recorded on{" "}
          <code className="border border-border bg-accent-soft px-1.5 py-0.5 font-mono text-[12px]">
            MonDoc Log
          </code>{" "}
          — permanent and verifiable by anyone.
        </p>
      </div>
      <ChainGuard>
        <HistoryBody />
      </ChainGuard>
    </div>
  );
}

function HistoryBody() {
  const { address, chainId } = useAccount();
  const { data, isLoading, total } = useCleanupHistory();
  const configured = chainId ? isContractConfigured(chainId) : false;
  const logAddr = chainId ? WALLET_DOCTOR_LOG[chainId] : undefined;

  if (!configured) {
    return (
      <div className="ui-card border-warning/30 bg-warning/5 p-5 text-sm sm:p-6">
        <div className="mb-3 flex h-10 w-10 items-center justify-center border border-warning/40 bg-warning/10 text-warning">
          <Scroll size={20} weight="regular" aria-hidden />
        </div>
        <p className="font-semibold">Contract not configured</p>
        <p className="mt-2 break-words text-muted">
          Deploy MonDoc Log, then set{" "}
          <code className="rounded bg-surface px-1 font-mono text-xs">
            NEXT_PUBLIC_LOG_ADDRESS_TESTNET
          </code>{" "}
          in <code>.env.local</code>.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface p-3 font-mono text-[11px] text-muted sm:text-xs">
{`cd packages/contracts
forge script script/Deploy.s.sol --rpc-url $MONAD_TESTNET_RPC_URL --broadcast`}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="ui-card flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Total cleanups
          </div>
          <div className="text-2xl font-semibold tabular-nums sm:text-3xl">{total}</div>
        </div>
        {logAddr && chainId && (
          <a
            href={getExplorerAddressUrl(chainId, logAddr)}
            target="_blank"
            rel="noreferrer"
            className="ui-btn-secondary !min-h-9 !w-full gap-1.5 text-xs sm:!w-auto"
          >
            Log contract {shortAddress(logAddr)}
            <ArrowSquareOut size={14} weight="regular" aria-hidden />
          </a>
        )}
      </div>

      <ScoreHistoryChart history={data ?? []} />

      <div className="ui-table-wrap">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted">Loading history…</div>
        ) : !data?.length ? (
          <div className="p-10 text-center text-sm text-muted">
            No events yet. Revoke an approval on Scan to start logging.
          </div>
        ) : (
          <>
            <div className="space-y-3 p-3 sm:hidden">
              {data.map((row, i) => {
                const ts = new Date(Number(row.timestamp) * 1000);
                return (
                  <article key={i} className="rounded-xl border border-border p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs text-muted" suppressHydrationWarning>
                        {ts.toLocaleString("en-US", { timeZone: "UTC" })} UTC
                      </div>
                      <div className="text-lg font-semibold tabular-nums text-success">
                        {Number(row.scoreAfter)}
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase text-muted">Token</div>
                        {chainId ? (
                          <a
                            href={getExplorerAddressUrl(chainId, row.token)}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate font-mono hover:text-accent"
                          >
                            {shortAddress(row.token)}
                          </a>
                        ) : (
                          <span className="font-mono">{shortAddress(row.token)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase text-muted">Spender</div>
                        <span className="block truncate font-mono">
                          {shortAddress(row.spender)}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden scroll-x sm:block">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Token</th>
                    <th className="px-4 py-3">Spender</th>
                    <th className="px-4 py-3">Score after</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => {
                    const ts = new Date(Number(row.timestamp) * 1000);
                    return (
                      <tr key={i} className="border-b border-border hover:bg-accent-soft/30">
                        <td
                          className="whitespace-nowrap px-4 py-3 text-muted"
                          suppressHydrationWarning
                        >
                          {ts.toLocaleString("en-US", { timeZone: "UTC" })} UTC
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted">
                          {chainId ? (
                            <a
                              href={getExplorerAddressUrl(chainId, row.token)}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-accent"
                            >
                              {shortAddress(row.token)}
                            </a>
                          ) : (
                            shortAddress(row.token)
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted">
                          {shortAddress(row.spender)}
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums text-success">
                          {Number(row.scoreAfter)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {address && chainId === monadMainnet.id && (
        <p className="text-xs text-muted">Showing history for {shortAddress(address)}</p>
      )}
    </div>
  );
}
