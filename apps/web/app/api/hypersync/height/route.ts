import { NextResponse } from "next/server";
import {
  getEnvioApiToken,
  getHypersyncHeight,
  isHypersyncSupported,
} from "@/lib/scanner/hypersync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
