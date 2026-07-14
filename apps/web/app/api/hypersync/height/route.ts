import { NextResponse } from "next/server";
import {
  getEnvioApiToken,
  getHypersyncHeight,
  probeHypersyncArchiveHeight,
  isHypersyncSupported,
} from "@/lib/scanner/hypersync";
import { clientIp, rateLimit } from "@/lib/api/rateLimit";
import { createResilientPublicClient } from "@/lib/rpc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

export async function GET(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`hs:height:${ip}`, {
      limit: 60,
      windowMs: 60_000,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            ...NO_STORE,
            "Retry-After": String(limited.retryAfterSec),
          },
        },
      );
    }

    const token = getEnvioApiToken();
    if (!token) {
      return NextResponse.json(
        { error: "ENVIO_API_TOKEN not configured" },
        { status: 503, headers: NO_STORE },
      );
    }

    const { searchParams } = new URL(req.url);
    const chainId = Number(searchParams.get("chainId"));
    if (!isHypersyncSupported(chainId)) {
      return NextResponse.json(
        { error: `HyperSync not available for chain ${chainId}` },
        { status: 400, headers: NO_STORE },
      );
    }

    const [hs, archiveProbe, rpcTip] = await Promise.all([
      getHypersyncHeight(chainId, token, req.signal),
      probeHypersyncArchiveHeight(chainId, token, req.signal),
      (async () => {
        try {
          const client = createResilientPublicClient(chainId);
          return Number(await client.getBlockNumber());
        } catch {
          return 0;
        }
      })(),
    ]);

    const candidates = [
      hs.height,
      hs.archive_height ?? 0,
      archiveProbe ?? 0,
      rpcTip,
    ].filter((n) => Number.isFinite(n) && n > 0);

    const height = Math.max(...candidates);

    return NextResponse.json(
      {
        height,
        hypersync_height: hs.height,
        archive_height: hs.archive_height ?? archiveProbe ?? null,
        rpc_height: rpcTip || null,
      },
      { headers: NO_STORE },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[hypersync/height]", message);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500, headers: NO_STORE },
    );
  }
}
