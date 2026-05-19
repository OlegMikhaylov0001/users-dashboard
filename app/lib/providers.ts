import { runChat as runChatAnthropic } from "./anthropic";
import { runChat as runChatGemini } from "./gemini";
import { runChat as runChatOpenRouter } from "./openrouter";
import {
  ANTHROPIC_SONNET_46_PRICING,
  GEMINI_FLASH_25_FREE_PRICING,
  type PricingPerM,
} from "./pricing";
import type { RunChatParams, RunChatResult } from "./anthropic";

// URL of the Cloudflare Worker that proxies the chat to OpenRouter using a
// server-side key. When set, the "demo" provider lights up and becomes the
// default — visitors can use the chat without bringing their own API key.
// Set via .env.local (dev) or GitHub Actions repo variable (production).
const DEMO_WORKER_URL = process.env.NEXT_PUBLIC_DEMO_WORKER_URL ?? "";
export const DEMO_AVAILABLE = Boolean(DEMO_WORKER_URL);

// ── Default keys ─────────────────────────────────────────────────────────────
// Paste a Google AI Studio key below to enable the chat for any visitor without
// asking them to sign up. Leave empty to require every user to provide their own.
//
// SECURITY: the key is bundled into the public JS — anyone can scrape it from
// the deployed site. Use a Gemini key on the **free tier only** (250 RPD,
// 10 RPM), so abuse caps out at quota exhaustion rather than a bill. NEVER
// put an Anthropic / OpenAI / paid key here.
//
// Get one: https://aistudio.google.com/apikey
export const DEFAULT_GEMINI_KEY = "";

// Same idea for Anthropic, but DO NOT use unless you understand the cost risk —
// Claude has no free tier and any scraper can burn through your credit budget.
export const DEFAULT_ANTHROPIC_KEY = "";

export type ProviderId = "demo" | "anthropic" | "google";

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  shortLabel: string;
  defaultModel: string;
  // For keyed providers: localStorage key + UI placeholder + console URL.
  // For the keyless demo provider: storage key is empty, placeholder/console blank.
  apiKeyStorageKey: string;
  apiKeyPlaceholder: string;
  apiKeyConsoleUrl: string;
  apiKeyConsoleLabel: string;
  /** True when the user must provide their own key; false for keyless demo provider. */
  requiresKey: boolean;
  /** The URL we hit if requiresKey is false (e.g. our Cloudflare Worker). */
  endpointUrl?: string;
  pricing: PricingPerM;
  pricingNote: string;
  runChat: (params: RunChatParams) => Promise<RunChatResult>;
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  demo: {
    id: "demo",
    label: "Demo (no key — free tier)",
    shortLabel: "Demo",
    defaultModel: "openrouter/free",
    apiKeyStorageKey: "",
    apiKeyPlaceholder: "",
    apiKeyConsoleUrl: "",
    apiKeyConsoleLabel: "",
    requiresKey: false,
    endpointUrl: DEMO_WORKER_URL,
    pricing: GEMINI_FLASH_25_FREE_PRICING, // $0; usage meter still tracks tokens
    pricingNote:
      "Free shared demo via the project's OpenRouter proxy. Rate-limited per IP (~10 req/min, 50/day). Add your own key for unlimited use.",
    runChat: runChatOpenRouter,
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic (Claude)",
    shortLabel: "Claude",
    defaultModel: "claude-sonnet-4-6",
    apiKeyStorageKey: "ud_anthropic_key",
    apiKeyPlaceholder: "sk-ant-...",
    apiKeyConsoleUrl: "https://console.anthropic.com/",
    apiKeyConsoleLabel: "console.anthropic.com",
    requiresKey: true,
    pricing: ANTHROPIC_SONNET_46_PRICING,
    pricingNote: "Paid — your key, your bill.",
    runChat: runChatAnthropic,
  },
  google: {
    id: "google",
    label: "Google (Gemini, free tier)",
    shortLabel: "Gemini",
    defaultModel: "gemini-2.5-flash",
    apiKeyStorageKey: "ud_google_key",
    apiKeyPlaceholder: "AIzaSy...",
    apiKeyConsoleUrl: "https://aistudio.google.com/apikey",
    apiKeyConsoleLabel: "aistudio.google.com",
    requiresKey: true,
    pricing: GEMINI_FLASH_25_FREE_PRICING,
    pricingNote: "Free tier — ~10 req/min, 250/day. Good for dev + demos.",
    runChat: runChatGemini,
  },
};

// Demo first so it shows on top in settings; only listed if the worker URL is set.
export const PROVIDER_IDS: ProviderId[] = DEMO_AVAILABLE
  ? ["demo", "anthropic", "google"]
  : ["anthropic", "google"];
export const PROVIDER_STORAGE_KEY = "ud_provider";

// Map provider id → bundled fallback key (empty string if none).
// Demo has no key — the worker URL substitutes for one.
export const DEFAULT_KEYS: Record<ProviderId, string> = {
  demo: DEMO_WORKER_URL,
  anthropic: DEFAULT_ANTHROPIC_KEY,
  google: DEFAULT_GEMINI_KEY,
};

// Pick the default provider in this priority:
//   1. demo (when DEMO_WORKER_URL is set) — visitor gets a working chat with no setup
//   2. google (when DEFAULT_GEMINI_KEY is bundled) — free tier, still needs key in bundle
//   3. anthropic — surfaces the Claude flow first in settings
export const DEFAULT_PROVIDER: ProviderId = DEMO_AVAILABLE
  ? "demo"
  : DEFAULT_GEMINI_KEY
    ? "google"
    : "anthropic";

export function isProviderId(v: unknown): v is ProviderId {
  return v === "demo" || v === "anthropic" || v === "google";
}
