"use client";

import { useAccount } from "wagmi";
import { ChainGuard } from "@/components/wallet/ChainGuard";
import { useCleanupHistory } from "@/hooks/useCleanupHistory";
import { shortAddress } from "@/lib/utils";
import { getExplorerAddressUrl, monadMainnet } from "@/lib/wagmi";
import { isContractConfigured, WALLET_DOCTOR_LOG } from "@/lib/contracts/addresses";
import { ScoreHistoryChart } from "@/components/score/ScoreHistoryChart";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Onchain Cleanup History</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Every successful revoke can be recorded on{" "}
          <code className="text-violet-300">WalletDoctorLog</code> — permanent and
          verifiable by anyone.
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
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 text-sm text-amber-100">
        <p className="font-semibold">Contract not configured</p>
        <p className="mt-2 text-amber-100/80">
          Deploy <code>WalletDoctorLog</code> with Foundry, then set{" "}
          <code className="rounded bg-black/30 px-1">
            NEXT_PUBLIC_LOG_ADDRESS_TESTNET
          </code>{" "}
          (and badge) in <code>.env.local</code>.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-black/40 p-4 text-xs text-zinc-300">
{`cd packages/contracts
forge script script/Deploy.s.sol --rpc-url $MONAD_TESTNET_RPC_URL --broadcast`}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500">
            Total cleanups
          </div>
          <div className="text-2xl font-bold text-white">{total}</div>
        </div>
        {logAddr && chainId && (
          <a
            href={getExplorerAddressUrl(chainId, logAddr)}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-violet-300 hover:underline"
          >
            Log contract {shortAddress(logAddr)} →
          </a>
        )}
      </div>

      <ScoreHistoryChart history={data ?? []} />

      <div className="overflow-hidden rounded-2xl border border-white/10">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-zinc-500">Loading history…</div>
        ) : !data?.length ? (
          <div className="p-10 text-center text-sm text-zinc-500">
            No events yet. Revoke an approval on the Scan page to start logging.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Token</th>
                <th className="px-4 py-3 font-medium">Spender</th>
                <th className="px-4 py-3 font-medium">Score after</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const ts = new Date(Number(row.timestamp) * 1000);
                return (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 text-zinc-300">
                      {ts.toLocaleString("en-US")}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {chainId ? (
                        <a
                          href={getExplorerAddressUrl(chainId, row.token)}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-violet-300"
                        >
                          {shortAddress(row.token)}
                        </a>
                      ) : (
                        shortAddress(row.token)
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {shortAddress(row.spender)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-300">
                      {Number(row.scoreAfter)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {address && chainId === monadMainnet.id && (
        <p className="text-xs text-zinc-600">Showing history for {shortAddress(address)}</p>
      )}
    </div>
  );
}
