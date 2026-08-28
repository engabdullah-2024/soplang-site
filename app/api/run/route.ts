import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_CODE_LENGTH = 20_000;
const RUNNER_TIMEOUT_MS = 10_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

// Best-effort per-instance rate limit. This is a secondary guard only — the
// runner service itself must enforce its own limits, since serverless
// instances are ephemeral and this map does not survive cold starts or scale
// across replicas.
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  let body: { code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const code = body.code;
  if (typeof code !== "string" || code.trim().length === 0) {
    return NextResponse.json({ error: "`code` must be a non-empty string." }, { status: 400 });
  }
  if (code.length > MAX_CODE_LENGTH) {
    return NextResponse.json(
      { error: `Code exceeds the ${MAX_CODE_LENGTH.toLocaleString()} character limit.` },
      { status: 413 }
    );
  }

  const runnerUrl = process.env.SOPLANG_RUNNER_URL;
  const runnerSecret = process.env.SOPLANG_RUNNER_SECRET;

  if (!runnerUrl) {
    return NextResponse.json(
      {
        error:
          "The playground runner isn't configured yet. Set SOPLANG_RUNNER_URL (and SOPLANG_RUNNER_SECRET) to enable code execution — see runner/README.md.",
      },
      { status: 503 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RUNNER_TIMEOUT_MS);

  try {
    const res = await fetch(runnerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(runnerSecret ? { "X-Runner-Secret": runnerSecret } : {}),
      },
      body: JSON.stringify({ code }),
      signal: controller.signal,
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Runner returned an error (status ${res.status}).` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Execution timed out." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Could not reach the playground runner." },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
