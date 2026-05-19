/**
 * users-dashboard chat proxy
 *
 * Receives a chat-completion request from the dashboard, enforces rate limits
 * per source IP, then forwards to OpenRouter using a key stored in CF env.
 *
 * Endpoints:
 *   POST /chat   — proxies to OpenRouter /v1/chat/completions
 *   OPTIONS *    — CORS preflight
 *   GET  /       — health check
 */

interface Env {
  // Secret (wrangler secret put OPENROUTER_KEY)
  OPENROUTER_KEY: string;
  // Vars (wrangler.toml)
  ALLOWED_ORIGINS: string;
  DEFAULT_MODEL: string;
  MAX_RPM: string;
  MAX_RPD: string;
  // Binding (wrangler.toml)
  RATE_LIMIT_KV: KVNamespace;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get("origin") ?? "";
    const allowed = parseAllowedOrigins(env.ALLOWED_ORIGINS);
    const corsOrigin = allowed.includes(origin) ? origin : allowed[0] ?? "*";

    // ── CORS preflight ──
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(corsOrigin),
      });
    }

    // ── Health check ──
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json({ ok: true, service: "users-dashboard-chat-proxy" }, 200, corsOrigin);
    }

    // ── Only POST /chat past this point ──
    if (req.method !== "POST" || url.pathname !== "/chat") {
      return json({ error: "not_found", hint: "POST /chat with a chat-completion body" }, 404, corsOrigin);
    }

    // ── Origin allowlist (defense in depth on top of CORS) ──
    if (allowed.length > 0 && !allowed.includes(origin)) {
      return json({ error: "origin_not_allowed", origin }, 403, corsOrigin);
    }

    // ── Per-IP rate limiting ──
    const ip = req.headers.get("cf-connecting-ip") ?? "anon";
    const limit = await checkRateLimit(env, ip);
    if (!limit.ok) {
      return json(
        {
          error: "rate_limit",
          scope: limit.scope,
          retry_after_sec: limit.retryAfterSec,
          message: `Demo limit reached (${limit.scope}). Add your own API key in chat settings for unlimited use.`,
        },
        429,
        corsOrigin,
        { "retry-after": String(limit.retryAfterSec) },
      );
    }

    // ── Parse client body, enforce server-controlled model ──
    let clientBody: Record<string, unknown>;
    try {
      clientBody = (await req.json()) as Record<string, unknown>;
    } catch {
      return json({ error: "invalid_json" }, 400, corsOrigin);
    }

    const forwardBody = {
      ...clientBody,
      model: env.DEFAULT_MODEL, // always the server-side default — never trust client
      stream: false,            // streaming not supported yet; force off
    };

    // ── Forward to OpenRouter ──
    let orRes: Response;
    try {
      orRes = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${env.OPENROUTER_KEY}`,
          // OpenRouter requests these for attribution + leaderboard display
          "HTTP-Referer": corsOrigin || "https://users-dashboard-demo.local",
          "X-Title": "UserBase Dashboard Demo",
        },
        body: JSON.stringify(forwardBody),
      });
    } catch (e) {
      return json(
        { error: "upstream_unreachable", message: e instanceof Error ? e.message : String(e) },
        502,
        corsOrigin,
      );
    }

    // ── Only count successful calls toward the quota ──
    if (orRes.ok) {
      ctx.waitUntil(incrementRateLimit(env, ip));
    }

    // ── Pass through, patching CORS headers ──
    const passthroughHeaders = new Headers();
    passthroughHeaders.set("content-type", orRes.headers.get("content-type") ?? "application/json");
    Object.entries(corsHeaders(corsOrigin)).forEach(([k, v]) => passthroughHeaders.set(k, v));

    return new Response(await orRes.arrayBuffer(), {
      status: orRes.status,
      statusText: orRes.statusText,
      headers: passthroughHeaders,
    });
  },
} satisfies ExportedHandler<Env>;

// ── helpers ──────────────────────────────────────────────────────────────────

function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, GET, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    "vary": "origin",
  };
}

function json(body: unknown, status: number, corsOrigin: string, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...corsHeaders(corsOrigin),
      ...extra,
    },
  });
}

interface RateLimitResult {
  ok: boolean;
  scope?: "per_minute" | "per_day";
  retryAfterSec?: number;
}

async function checkRateLimit(env: Env, ip: string): Promise<RateLimitResult> {
  const maxRpm = parseInt(env.MAX_RPM, 10) || 10;
  const maxRpd = parseInt(env.MAX_RPD, 10) || 50;

  const now = Math.floor(Date.now() / 1000);
  const minuteBucket = Math.floor(now / 60);
  const today = new Date().toISOString().slice(0, 10);

  const minuteKey = `m:${ip}:${minuteBucket}`;
  const dayKey = `d:${ip}:${today}`;

  const [minuteRaw, dayRaw] = await Promise.all([
    env.RATE_LIMIT_KV.get(minuteKey),
    env.RATE_LIMIT_KV.get(dayKey),
  ]);

  const minuteHits = parseInt(minuteRaw ?? "0", 10);
  const dayHits = parseInt(dayRaw ?? "0", 10);

  if (minuteHits >= maxRpm) {
    return { ok: false, scope: "per_minute", retryAfterSec: 60 - (now % 60) };
  }
  if (dayHits >= maxRpd) {
    // Until midnight UTC
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    return { ok: false, scope: "per_day", retryAfterSec: Math.floor((tomorrow.getTime() - Date.now()) / 1000) };
  }
  return { ok: true };
}

async function incrementRateLimit(env: Env, ip: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const minuteBucket = Math.floor(now / 60);
  const today = new Date().toISOString().slice(0, 10);

  const minuteKey = `m:${ip}:${minuteBucket}`;
  const dayKey = `d:${ip}:${today}`;

  const [minuteRaw, dayRaw] = await Promise.all([
    env.RATE_LIMIT_KV.get(minuteKey),
    env.RATE_LIMIT_KV.get(dayKey),
  ]);

  await Promise.all([
    env.RATE_LIMIT_KV.put(minuteKey, String(parseInt(minuteRaw ?? "0", 10) + 1), {
      expirationTtl: 120, // expire after 2 min (bucket only lives 60s)
    }),
    env.RATE_LIMIT_KV.put(dayKey, String(parseInt(dayRaw ?? "0", 10) + 1), {
      expirationTtl: 90_000, // expire after ~25h
    }),
  ]);
}
