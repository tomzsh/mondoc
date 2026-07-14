import { NextResponse } from "next/server";
import type { Hex } from "viem";
import {
  getEnvioApiToken,
  getHypersyncBaseUrl,
  isHypersyncSupported,
} from "@/lib/scanner/hypersync";
import { clientIp, rateLimit } from "@/lib/api/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

const MAX_TOPICS = 4;
const MAX_TOPIC_LEN = 66; // 0x + 64 hex
const MAX_BLOCK_SPAN = 50_000_000; // generous for HyperSync; still caps abuse

/**
 * Single HyperSync page proxy — token never leaves the server.
 * Hackathon hardening: rate limit + input caps + upstream timeout.
 */
export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`hs:query:${ip}`, {
      limit: 60,
      windowMs: 60_000,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again shortly." },
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
        { status: 503 },
      );
    }

    let body: {
      chainId?: number;
      fromBlock?: number;
      toBlock?: number;
      topics?: Array<Hex | null>;
      address?: `0x${string}`;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

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

    if (body.topics.length > MAX_TOPICS) {
      return NextResponse.json(
        { error: `At most ${MAX_TOPICS} topics` },
        { status: 400 },
      );
    }

    const fromBlock = Number(body.fromBlock);
    if (!Number.isFinite(fromBlock) || fromBlock < 0) {
      return NextResponse.json({ error: "Invalid fromBlock" }, { status: 400 });
    }

    let toBlock: number | undefined;
    if (body.toBlock != null) {
      toBlock = Number(body.toBlock);
      if (!Number.isFinite(toBlock)) {
        return NextResponse.json(
          { error: "Invalid toBlock" },
          { status: 400, headers: NO_STORE },
        );
      }
      // Stale tip vs next_block: clamp instead of 400 so pagination can recover
      if (toBlock < fromBlock) {
        toBlock = fromBlock;
      }
      if (toBlock - fromBlock > MAX_BLOCK_SPAN) {
        return NextResponse.json(
          { error: "Block range too large" },
          { status: 400, headers: NO_STORE },
        );
      }
    }

    const topics = body.topics.map((t) => {
      if (!t) return [];
      if (typeof t !== "string" || t.length > MAX_TOPIC_LEN) {
        throw new Error("Invalid topic");
      }
      return [t];
    });

    if (body.address && !/^0x[a-fA-F0-9]{40}$/.test(body.address)) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      from_block: fromBlock,
      logs: [
        {
          address: body.address ? [body.address] : undefined,
          topics,
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

    if (toBlock != null && Number.isFinite(toBlock)) {
      // HyperSync to_block is exclusive
      payload.to_block = toBlock + 1;
    }

    const upstream = AbortSignal.any([
      req.signal,
      AbortSignal.timeout(45_000),
    ]);

    const res = await fetch(`${base}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
      body: JSON.stringify(payload),
      signal: upstream,
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("[hypersync/query] upstream", res.status, text.slice(0, 200));
      return NextResponse.json(
        { error: "Upstream log provider error" },
        { status: 502, headers: NO_STORE },
      );
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Invalid upstream response" },
        { status: 502, headers: NO_STORE },
      );
    }

    return NextResponse.json(json, { headers: NO_STORE });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (
      message.includes("aborted") ||
      message.includes("AbortError") ||
      message.includes("TimeoutError")
    ) {
      return NextResponse.json(
        { error: "Request timed out" },
        { status: 504, headers: NO_STORE },
      );
    }
    if (message === "Invalid topic") {
      return NextResponse.json(
        { error: "Invalid topic" },
        { status: 400, headers: NO_STORE },
      );
    }
    console.error("[hypersync/query]", message);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500, headers: NO_STORE },
    );
  }
}
