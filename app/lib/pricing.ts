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

// Prices per million tokens, current as of 2026-05 for Sonnet 4.x.
// Update here when switching model — kept central so it can't drift.
const SONNET_PRICING_PER_M = {
  input: 3,
  output: 15,
  cache_read: 0.3,
  cache_creation_5m: 3.75,
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

export function costUsd(u: ChatUsage): number {
  const p = SONNET_PRICING_PER_M;
  return (
    (u.input_tokens * p.input +
      u.output_tokens * p.output +
      u.cache_read_input_tokens * p.cache_read +
      u.cache_creation_input_tokens * p.cache_creation_5m) /
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
