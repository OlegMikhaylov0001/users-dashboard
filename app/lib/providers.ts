import { runChat as runChatAnthropic } from "./anthropic";
import { runChat as runChatGemini } from "./gemini";
import {
  ANTHROPIC_SONNET_46_PRICING,
  GEMINI_FLASH_25_FREE_PRICING,
  type PricingPerM,
} from "./pricing";
import type { RunChatParams, RunChatResult } from "./anthropic";

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

export type ProviderId = "anthropic" | "google";

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  shortLabel: string;
  defaultModel: string;
  apiKeyStorageKey: string;
  apiKeyPlaceholder: string;
  apiKeyConsoleUrl: string;
  apiKeyConsoleLabel: string;
  pricing: PricingPerM;
  pricingNote: string;
  runChat: (params: RunChatParams) => Promise<RunChatResult>;
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  anthropic: {
    id: "anthropic",
    label: "Anthropic (Claude)",
    shortLabel: "Claude",
    defaultModel: "claude-sonnet-4-6",
    apiKeyStorageKey: "ud_anthropic_key",
    apiKeyPlaceholder: "sk-ant-...",
    apiKeyConsoleUrl: "https://console.anthropic.com/",
    apiKeyConsoleLabel: "console.anthropic.com",
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
    pricing: GEMINI_FLASH_25_FREE_PRICING,
    pricingNote: "Free tier — ~10 req/min, 250/day. Good for dev + demos.",
    runChat: runChatGemini,
  },
};

export const PROVIDER_IDS: ProviderId[] = ["anthropic", "google"];
export const PROVIDER_STORAGE_KEY = "ud_provider";

// Map provider id → bundled fallback key (empty string if none)
export const DEFAULT_KEYS: Record<ProviderId, string> = {
  anthropic: DEFAULT_ANTHROPIC_KEY,
  google: DEFAULT_GEMINI_KEY,
};

// Default-provider rule: if a bundled key exists, prefer Gemini (free tier) so
// new visitors land on a working chat. Otherwise fall back to Anthropic so the
// settings dialog points at the Claude flow first.
export const DEFAULT_PROVIDER: ProviderId = DEFAULT_GEMINI_KEY ? "google" : "anthropic";

export function isProviderId(v: unknown): v is ProviderId {
  return v === "anthropic" || v === "google";
}
