import { NextResponse } from "next/server";
import {
  getEnvioApiToken,
  getHypersyncHeight,
  isHypersyncSupported,
} from "@/lib/scanner/hypersync";
import { clientIp, rateLimit } from "@/lib/api/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`hs:height:${ip}`, {
      limit: 30,
      windowMs: 60_000,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }

    const token = getEnvioApiToken();
    if (!token) {
      return NextResponse.json(
        { error: "ENVIO_API_TOKEN not configured" },
        { status: 503 },
      );
    }

    const { searchParams } = new URL(req.url);
    const chainId = Number(searchParams.get("chainId"));
    if (!isHypersyncSupported(chainId)) {
      return NextResponse.json(
        { error: `HyperSync not available for chain ${chainId}` },
        { status: 400 },
      );
    }

    const height = await getHypersyncHeight(chainId, token, req.signal);
    return NextResponse.json({ height });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[hypersync/height]", message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
