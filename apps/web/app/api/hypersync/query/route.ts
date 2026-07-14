import { NextResponse } from "next/server";
import type { Hex } from "viem";
import {
  getEnvioApiToken,
  getHypersyncBaseUrl,
  isHypersyncSupported,
} from "@/lib/scanner/hypersync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Single HyperSync page proxy — token never leaves the server.
 * Client drives pagination for progress + shorter request timeouts.
 */
export async function POST(req: Request) {
  try {
    const token = getEnvioApiToken();
    if (!token) {
      return NextResponse.json(
        { error: "ENVIO_API_TOKEN not configured" },
        { status: 503 },
      );
    }

    const body = (await req.json()) as {
      chainId?: number;
      fromBlock?: number;
      toBlock?: number;
      topics?: Array<Hex | null>;
      address?: `0x${string}`;
    };

    const chainId = Number(body.chainId);
    const base = getHypersyncBaseUrl(chainId);
    if (!base || !isHypersyncSupported(chainId)) {
      return NextResponse.json(
        { error: `HyperSync not available for chain ${chainId}` },
        { status: 400 },
      );
    }

    if (body.fromBlock == null || !Array.isArray(body.topics)) {
      return NextResponse.json(
        { error: "fromBlock and topics are required" },
        { status: 400 },
      );
    }

    const payload: Record<string, unknown> = {
      from_block: Number(body.fromBlock),
      logs: [
        {
          address: body.address ? [body.address] : undefined,
          topics: body.topics.map((t) => (t ? [t] : [])),
        },
      ],
      field_selection: {
        log: [
          "address",
          "data",
          "topic0",
          "topic1",
          "topic2",
          "topic3",
          "block_number",
          "transaction_hash",
          "log_index",
          "transaction_index",
        ],
      },
    };

    if (body.toBlock != null && Number.isFinite(body.toBlock)) {
      // HyperSync to_block is exclusive
      payload.to_block = Number(body.toBlock) + 1;
    }

    const res = await fetch(`${base}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal: req.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: `HyperSync HTTP ${res.status}: ${text.slice(0, 200)}` },
        { status: 502 },
      );
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Invalid HyperSync JSON" },
        { status: 502 },
      );
    }

    return NextResponse.json(json);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("aborted") || message.includes("AbortError")) {
      return NextResponse.json({ error: "aborted" }, { status: 499 });
    }
    console.error("[hypersync/query]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
