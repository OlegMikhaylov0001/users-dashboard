import { runChat as runChatAnthropic } from "./anthropic";
import { runChat as runChatGemini } from "./gemini";
import {
  ANTHROPIC_SONNET_46_PRICING,
  GEMINI_FLASH_25_FREE_PRICING,
  type PricingPerM,
} from "./pricing";
import type { RunChatParams, RunChatResult } from "./anthropic";

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
export const DEFAULT_PROVIDER: ProviderId = "anthropic";

export function isProviderId(v: unknown): v is ProviderId {
  return v === "anthropic" || v === "google";
}
