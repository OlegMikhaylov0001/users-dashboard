export interface ChatUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
}

export const EMPTY_USAGE: ChatUsage = {
  input_tokens: 0,
  output_tokens: 0,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
};

// Prices per million tokens. Update here when switching model — kept central so it can't drift.
export interface PricingPerM {
  input: number;
  output: number;
  cache_read?: number;
  cache_creation?: number;
}

export const ANTHROPIC_SONNET_46_PRICING: PricingPerM = {
  input: 3,
  output: 15,
  cache_read: 0.3,
  cache_creation: 3.75,
};

// Gemini 2.5 Flash on the free tier ($0). When the project graduates to paid Google
// Cloud billing, swap to: { input: 0.30, output: 2.50 }. Free tier limits at the time
// of writing: ~10 RPM / 250 RPD — fine for dev + low-volume demo usage.
export const GEMINI_FLASH_25_FREE_PRICING: PricingPerM = {
  input: 0,
  output: 0,
};

export function addUsage(a: ChatUsage, b: Partial<ChatUsage>): ChatUsage {
  return {
    input_tokens: a.input_tokens + (b.input_tokens ?? 0),
    output_tokens: a.output_tokens + (b.output_tokens ?? 0),
    cache_read_input_tokens: a.cache_read_input_tokens + (b.cache_read_input_tokens ?? 0),
    cache_creation_input_tokens: a.cache_creation_input_tokens + (b.cache_creation_input_tokens ?? 0),
  };
}

export function totalTokens(u: ChatUsage): number {
  return u.input_tokens + u.output_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens;
}

export function costUsd(u: ChatUsage, pricing: PricingPerM): number {
  return (
    (u.input_tokens * pricing.input +
      u.output_tokens * pricing.output +
      u.cache_read_input_tokens * (pricing.cache_read ?? 0) +
      u.cache_creation_input_tokens * (pricing.cache_creation ?? 0)) /
    1_000_000
  );
}

export function formatTokens(n: number): string {
  if (n < 1_000) return `${n}`;
  if (n < 100_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n / 1_000)}K`;
}

export function formatCost(usd: number): string {
  if (usd === 0) return "$0";
  if (usd < 0.001) return "<$0.001";
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}
