"use client";

import { RevertExplainer } from "@/components/tx/RevertExplainer";
import { ChainGuard } from "@/components/wallet/ChainGuard";

export default function TxExplainerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Failed Transaction Explainer</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Paste a failed transaction hash. We decode the revert reason and explain it
          in plain English with a fix suggestion.
        </p>
      </div>
      <ChainGuard>
        <RevertExplainer />
      </ChainGuard>
    </div>
  );
}
