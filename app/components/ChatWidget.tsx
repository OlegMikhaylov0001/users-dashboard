"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { DashboardCtx } from "./dashboard-ctx";
import { ANTHROPIC_TOOLS, executeTool } from "../lib/chatTools";
import { type AnthropicContentBlock, type AnthropicMessage } from "../lib/anthropic";
import { addUsage, costUsd, EMPTY_USAGE, formatCost, formatTokens, totalTokens, type ChatUsage } from "../lib/pricing";
import {
  DEFAULT_KEYS,
  DEFAULT_PROVIDER,
  isProviderId,
  PROVIDER_IDS,
  PROVIDER_STORAGE_KEY,
  PROVIDERS,
  type ProviderId,
} from "../lib/providers";
import type { Filters } from "../hooks/useDashboard";
import { I } from "./icons";

// ── types ────────────────────────────────────────────────────────────────────

interface FiltersSnapshot {
  q: string;
  role: string;
  department: string;
  title: string;
  gender: string;
  country: string;
  state: string;
  ageMin: number | null;
  ageMax: number | null;
}

interface ToolCallRecord {
  name: string;
  input: unknown;
  output?: unknown;
  previousFilters?: FiltersSnapshot;
  diff?: Record<string, { from: unknown; to: unknown }>;
  undone?: boolean;
}

interface ChatTurn {
  role: "user" | "assistant" | "system";
  text?: string;
  toolCalls?: ToolCallRecord[];
}

interface FilterSnapshotForPrompt {
  q: string;
  role: string;
  department: string;
  title: string;
  gender: string;
  country: string;
  state: string;
  ageFilter: [number, number] | null;
}

// ── prompt + slash helpers ───────────────────────────────────────────────────

function buildSystem(userCount: number, snapshot: FilterSnapshotForPrompt): string {
  const activeBits = Object.entries(snapshot).filter(([, v]) => v !== "" && v !== null);
  const active = activeBits.length
    ? activeBits.map(([k, v]) => `${k}=${Array.isArray(v) ? `${v[0]}-${v[1]}` : v}`).join(", ")
    : "none";
  return [
    `You help analyse a dataset of ${userCount} dummy users shown in a dashboard.`,
    `You have tools to compute stats, query users, apply filters in the dashboard UI, and open a user card.`,
    `Prefer get_users_stats for aggregates; only call query_users when concrete names/emails are needed.`,
    `When the user asks to "show / filter / display only X", call apply_filters so the dashboard updates.`,
    `Always finish with a concise human-readable answer in the user's language.`,
    `Active dashboard filters: ${active}.`,
  ].join(" ");
}

interface SuggestionEntry {
  label: string;
  icon: "stats" | "filter";
}

const SUGGESTIONS: SuggestionEntry[] = [
  { label: "Avg age of engineering users in the US", icon: "stats" },
  { label: "Top 5 countries among moderators", icon: "stats" },
  { label: "Show only female HR users", icon: "filter" },
];

interface SlashCommand {
  name: string;
  args?: string;
  description: string;
  icon: keyof typeof I;
}

const SLASH_COMMANDS: SlashCommand[] = [
  { name: "help", description: "List available commands", icon: "HelpCircle" },
  { name: "clear", description: "Wipe chat history + cost meter", icon: "Trash" },
  { name: "cost", description: "Show token + dollar breakdown", icon: "Coin" },
  { name: "explain", description: "Explain current filter state", icon: "Sparkle" },
  { name: "compare", args: "<name1> and <name2>", description: "Compare two users by their attributes", icon: "Stats" },
];

function helpMessage(): string {
  return [
    "Slash commands:",
    ...SLASH_COMMANDS.map((c) => `  /${c.name}${c.args ? ` ${c.args}` : ""}  — ${c.description}`),
  ].join("\n");
}

function costMessage(usage: ChatUsage, providerLabel: string, pricing: import("../lib/pricing").PricingPerM): string {
  return [
    `Session usage (${providerLabel}):`,
    `  Input tokens:  ${usage.input_tokens.toLocaleString()}`,
    `  Output tokens: ${usage.output_tokens.toLocaleString()}`,
    `  Total:         ${totalTokens(usage).toLocaleString()}`,
    `  Cost:          ${formatCost(costUsd(usage, pricing))}`,
  ].join("\n");
}

function parseSlash(text: string): { handledLocally: true; localText: string } | { handledLocally: false; prompt: string } | null {
  if (!text.startsWith("/")) return null;
  const trimmed = text.trim();
  const [cmd, ...rest] = trimmed.slice(1).split(/\s+/);
  const args = rest.join(" ");
  switch (cmd) {
    case "help":
      return { handledLocally: true, localText: helpMessage() };
    case "clear":
      return { handledLocally: true, localText: "__clear__" };
    case "cost":
      return { handledLocally: true, localText: "__cost__" };
    case "explain":
      return {
        handledLocally: false,
        prompt:
          "Explain my current dashboard filters in plain English and describe what the visible users have in common (department/role/gender skew). Be concise.",
      };
    case "compare": {
      const parts = args.split(/\s+and\s+/i);
      if (parts.length !== 2) {
        return { handledLocally: true, localText: "Usage: /compare <name1> and <name2>" };
      }
      return {
        handledLocally: false,
        prompt: `Find users named "${parts[0].trim()}" and "${parts[1].trim()}" with query_users, then compare them side-by-side by age, role, department, title and location. Be brief.`,
      };
    }
    default:
      return { handledLocally: true, localText: `Unknown command: /${cmd}. Type /help for the list.` };
  }
}

// ── render helpers ───────────────────────────────────────────────────────────

const TOOL_META: Record<string, { label: string; cls: "" | "write" | "danger"; iconKey: keyof typeof I }> = {
  get_users_stats: { label: "GET_USERS_STATS", cls: "", iconKey: "Stats" },
  query_users: { label: "QUERY_USERS", cls: "", iconKey: "Search" },
  apply_filters: { label: "APPLY_FILTERS", cls: "write", iconKey: "Filter" },
  clear_filters: { label: "CLEAR_FILTERS", cls: "danger", iconKey: "Trash" },
  open_user: { label: "OPEN_USER", cls: "", iconKey: "User" },
};

function toolArgsSummary(input: unknown): React.ReactNode {
  if (!input || typeof input !== "object") return null;
  const entries = Object.entries(input as Record<string, unknown>).filter(
    ([, v]) => v !== undefined && v !== "" && v !== null && !(typeof v === "object" && Object.keys(v as object).length === 0),
  );
  if (entries.length === 0) return null;
  return (
    <div className="tool-args">
      {entries.map(([k, v], i) => (
        <span key={k}>
          {i > 0 && <span style={{ color: "var(--fg-muted)" }}>, </span>}
          <span className="tool-arg-key">{k}:</span> <span className="tool-arg-val">{JSON.stringify(v)}</span>
        </span>
      ))}
    </div>
  );
}

function statsResultPreview(out: Record<string, unknown>): React.ReactNode {
  // Prefer groupBy top-N if present
  if (out.groupBy && Array.isArray(out.top)) {
    const top = out.top as Array<{ value: string; count: number }>;
    return (
      <div className="tool-list-preview">
        {top.slice(0, 3).map((t) => (
          <div key={t.value} className="tool-list-row">
            <span className="avatar-sm" style={{ background: "var(--accent-soft)", borderColor: "transparent", color: "var(--accent-fg)" }}>•</span>
            {t.value || "—"}
            <span className="ml">{t.count}</span>
          </div>
        ))}
        {top.length > 3 && <div className="tool-list-more">+ {top.length - 3} more</div>}
      </div>
    );
  }
  const total = typeof out.total === "number" ? out.total : null;
  const avg = typeof out.avgAge === "number" ? out.avgAge : null;
  const buckets = out.ageBuckets as Record<string, number> | undefined;
  const bars = buckets ? Object.values(buckets) : [];
  const max = bars.length ? Math.max(...bars, 1) : 1;
  // Show avg age as the big number if available, otherwise total.
  const big = avg !== null ? avg : total;
  const label = avg !== null ? `avg age · ${total ?? "—"} users` : total !== null ? "users matched" : "stats";
  if (big === null) return null;
  return (
    <div className="tool-result">
      <div>
        <div className="tool-result-num">{big}</div>
        <div className="tool-result-label">{label}</div>
      </div>
      {bars.length > 0 && (
        <div className="tr-mini">
          {bars.map((b, i) => (
            <i key={i} style={{ height: `${Math.max(3, Math.round((b / max) * 18))}px` }} />
          ))}
        </div>
      )}
    </div>
  );
}

function queryResultPreview(out: Record<string, unknown>): React.ReactNode {
  const users = out.users as Array<Record<string, unknown>> | undefined;
  const total = typeof out.total_matched === "number" ? out.total_matched : 0;
  if (!users || users.length === 0) {
    return (
      <div className="tool-result">
        <div>
          <div className="tool-result-num">{total}</div>
          <div className="tool-result-label">users matched · none returned</div>
        </div>
      </div>
    );
  }
  const head = users.slice(0, 3);
  const rest = users.length - head.length;
  const truncated = Boolean(out.truncated);
  return (
    <div className="tool-list-preview">
      {head.map((u, i) => {
        const first = String((u.firstName as string) ?? "").slice(0, 1);
        const last = String((u.lastName as string) ?? "").slice(0, 1);
        const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || (u.email as string) || `User #${u.id}`;
        return (
          <div key={i} className="tool-list-row">
            <span className="avatar-sm">{(first + last).toUpperCase() || "U"}</span>
            {name}
            {typeof u.age === "number" && <span className="ml">{u.age}</span>}
          </div>
        );
      })}
      {rest > 0 && <div className="tool-list-more">+ {rest}{truncated ? ` of ${total}` : ""} more</div>}
    </div>
  );
}

function openUserResultPreview(out: Record<string, unknown>): React.ReactNode {
  const opened = out.opened as { id: number; name: string } | undefined;
  if (!opened) return null;
  return (
    <div className="tool-result">
      <div>
        <div className="tool-result-num" style={{ fontSize: 13, fontWeight: 600 }}>{opened.name}</div>
        <div className="tool-result-label">opened · USR-{opened.id}</div>
      </div>
    </div>
  );
}

function clearFiltersDiff(prev: FiltersSnapshot | undefined): Record<string, { from: unknown; to: unknown }> | undefined {
  if (!prev) return undefined;
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const [k, v] of Object.entries(prev)) {
    if (v !== "" && v !== null && v !== undefined) out[k] = { from: v, to: null };
  }
  return Object.keys(out).length ? out : undefined;
}

// ── component ────────────────────────────────────────────────────────────────

export function ChatWidget() {
  const ctx = useContext(DashboardCtx);
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<ProviderId>(() => {
    if (typeof window === "undefined") return DEFAULT_PROVIDER;
    const stored = window.localStorage.getItem(PROVIDER_STORAGE_KEY);
    return isProviderId(stored) ? stored : DEFAULT_PROVIDER;
  });
  const [apiKeys, setApiKeys] = useState<Record<ProviderId, string | null>>(() => {
    if (typeof window === "undefined") return { demo: null, anthropic: null, google: null };
    return {
      demo: null,
      anthropic: window.localStorage.getItem(PROVIDERS.anthropic.apiKeyStorageKey),
      google: window.localStorage.getItem(PROVIDERS.google.apiKeyStorageKey),
    };
  });
  const apiKey = apiKeys[provider] || DEFAULT_KEYS[provider] || null;
  const providerCfg = PROVIDERS[provider];
  const usingDefaultKey =
    providerCfg.requiresKey && !apiKeys[provider] && !!DEFAULT_KEYS[provider];
  const [keyInput, setKeyInput] = useState("");
  const [keyVisible, setKeyVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<ChatUsage>(EMPTY_USAGE);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [turns, pending]);

  const apiMessages = useMemo<AnthropicMessage[]>(() => {
    const msgs: AnthropicMessage[] = [];
    for (const t of turns) {
      if (t.role === "user" && t.text) msgs.push({ role: "user", content: t.text });
      else if (t.role === "assistant" && t.text) msgs.push({ role: "assistant", content: t.text });
    }
    return msgs;
  }, [turns]);

  // Slash autocomplete is shown when input starts with "/" and we haven't typed args yet.
  const showSlashPopover = input.startsWith("/") && !input.includes(" ") && !pending;
  const slashMatches = useMemo(
    () => SLASH_COMMANDS.filter((c) => `/${c.name}`.startsWith(input.toLowerCase())),
    [input],
  );

  function saveKey() {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    setApiKeys((prev) => ({ ...prev, [provider]: trimmed }));
    if (typeof window !== "undefined") {
      window.localStorage.setItem(providerCfg.apiKeyStorageKey, trimmed);
    }
    setKeyInput("");
    setKeyVisible(false);
  }

  function forgetKey(target: ProviderId = provider) {
    setApiKeys((prev) => ({ ...prev, [target]: null }));
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PROVIDERS[target].apiKeyStorageKey);
    }
  }

  function switchProvider(next: ProviderId) {
    if (next === provider) return;
    setProvider(next);
    setKeyInput("");
    setKeyVisible(false);
    setError(null);
    if (typeof window !== "undefined") window.localStorage.setItem(PROVIDER_STORAGE_KEY, next);
  }

  function resetChat() {
    setTurns([]);
    setError(null);
    setUsage(EMPTY_USAGE);
  }

  function restoreFilters(prev: FiltersSnapshot, turnIdx: number, callIdx: number) {
    if (!ctx) return;
    ctx.clear();
    const keys: Array<keyof Filters> = ["q", "role", "department", "title", "gender", "country", "state"];
    for (const k of keys) {
      const v = prev[k as keyof FiltersSnapshot];
      if (typeof v === "string" && v) ctx.setFilter(k, v);
    }
    if (typeof prev.ageMin === "number" || typeof prev.ageMax === "number") {
      ctx.onAgeChange([prev.ageMin ?? 0, prev.ageMax ?? 200]);
    }
    setTurns((prevTurns) => {
      const next = [...prevTurns];
      const t = next[turnIdx];
      if (!t || !t.toolCalls) return prevTurns;
      const newCalls = [...t.toolCalls];
      newCalls[callIdx] = { ...newCalls[callIdx], undone: true };
      next[turnIdx] = { ...t, toolCalls: newCalls };
      return next;
    });
  }

  async function sendMessage(rawText: string) {
    if (!ctx || !rawText.trim() || pending) return;
    setError(null);

    const slash = parseSlash(rawText.trim());
    let promptText = rawText.trim();
    if (slash) {
      if (slash.handledLocally) {
        if (slash.localText === "__clear__") {
          resetChat();
          setInput("");
          return;
        }
        if (slash.localText === "__cost__") {
          setTurns((t) => [
            ...t,
            { role: "user", text: rawText.trim() },
            { role: "system", text: costMessage(usage, providerCfg.shortLabel, providerCfg.pricing) },
          ]);
          setInput("");
          return;
        }
        setTurns((t) => [...t, { role: "user", text: rawText.trim() }, { role: "system", text: slash.localText }]);
        setInput("");
        return;
      }
      promptText = slash.prompt;
    }

    if (!apiKey) {
      setError(
        providerCfg.requiresKey
          ? `${providerCfg.shortLabel} API key required — open settings.`
          : `Demo endpoint not configured (NEXT_PUBLIC_DEMO_WORKER_URL).`,
      );
      return;
    }

    const userTurn: ChatTurn = { role: "user", text: rawText.trim() };
    const baseMessages: AnthropicMessage[] = [...apiMessages, { role: "user", content: promptText }];
    setTurns((t) => [...t, userTurn]);
    setInput("");
    setPending(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const assistantTurn: ChatTurn = { role: "assistant", text: "", toolCalls: [] };
    let stepIdx = -1;
    setTurns((t) => {
      stepIdx = t.length;
      return [...t, assistantTurn];
    });

    try {
      const snapshot = ctx.getCurrentFilters();
      const system = buildSystem(ctx.users.length, snapshot);
      const { finalText, usage: runUsage } = await providerCfg.runChat({
        apiKey,
        model: providerCfg.defaultModel,
        system,
        messages: baseMessages,
        tools: ANTHROPIC_TOOLS,
        signal: ctrl.signal,
        onAssistantStep: (blocks: AnthropicContentBlock[]) => {
          const calls = blocks
            .filter((b): b is Extract<AnthropicContentBlock, { type: "tool_use" }> => b.type === "tool_use")
            .map((b): ToolCallRecord => ({ name: b.name, input: b.input }));
          if (calls.length) {
            setTurns((prev) => {
              const next = [...prev];
              const idx = stepIdx >= 0 ? stepIdx : next.length - 1;
              const cur = next[idx] ?? { role: "assistant", text: "", toolCalls: [] };
              next[idx] = { ...cur, toolCalls: [...(cur.toolCalls ?? []), ...calls] };
              return next;
            });
          }
        },
        onToolResult: (name, _input, output) => {
          setTurns((prev) => {
            const next = [...prev];
            const idx = stepIdx >= 0 ? stepIdx : next.length - 1;
            const cur = next[idx];
            if (!cur || !cur.toolCalls) return prev;
            const calls = [...cur.toolCalls];
            const matchIdx = calls.findIndex((c) => c.name === name && c.output === undefined);
            if (matchIdx === -1) return prev;
            const out = output as Record<string, unknown> | undefined;
            calls[matchIdx] = {
              ...calls[matchIdx],
              output,
              previousFilters: (out?.previous_filters as FiltersSnapshot | undefined) ?? undefined,
              diff: (out?.diff as Record<string, { from: unknown; to: unknown }> | undefined) ?? undefined,
            };
            next[idx] = { ...cur, toolCalls: calls };
            return next;
          });
        },
        onToolCall: (name, toolInput) => executeTool(name, toolInput, ctx),
      });
      setUsage((prev) => addUsage(prev, runUsage));

      setTurns((prev) => {
        const next = [...prev];
        const idx = stepIdx >= 0 ? stepIdx : next.length - 1;
        next[idx] = { ...next[idx], text: finalText || "(no answer)" };
        return next;
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setTurns((prev) => prev.slice(0, -1));
    } finally {
      setPending(false);
      abortRef.current = null;
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  function cancel() {
    abortRef.current?.abort();
  }

  if (!ctx) return null;

  // For the keyed providers without a key (or default), force the key-setup view.
  const needsKeySetup = providerCfg.requiresKey && !apiKey;
  const showFlyout = settingsOpen;
  const showSetup = !showFlyout && needsKeySetup;
  const tokensTotal = totalTokens(usage);
  const sessionCost = costUsd(usage, providerCfg.pricing);

  const providerThumbClass: Record<ProviderId, string> = {
    demo: "demo",
    anthropic: "claude",
    google: "gemini",
  };
  const providerThumbInitial: Record<ProviderId, string> = {
    demo: "D",
    anthropic: "C",
    google: "G",
  };

  // Demo rate-limit detection (Cloudflare worker returns "Demo limit reached…")
  const isDemoRateLimit = (error ?? "").toLowerCase().includes("demo limit");

  return (
    <>
      {/* ── FAB ── */}
      {!open && (
        <button type="button" className="fab" onClick={() => setOpen(true)} aria-label="Open chat assistant">
          <span className="fab-pill">
            <span>Ask AI</span>
            <span className="kbd">⌘K</span>
          </span>
          <span className="fab-btn">
            <I.Sparkle size={20} stroke={2} />
            <span className="fab-dot" />
          </span>
        </button>
      )}

      {/* ── Widget panel ── */}
      {open && (
        <div className="widget" role="dialog" aria-label="Ask about these users">
          {/* Header */}
          <div className="w-header">
            <div className="w-header-row">
              <div className="w-avatar"><I.Sparkle size={14} stroke={2} /></div>
              <div className="w-header-titles">
                <div className="w-title">Ask about these users</div>
                <div className="w-sub">{ctx.users.length} users · ready to query</div>
              </div>
              <div className="w-header-actions">
                <button
                  type="button"
                  className="w-iconbtn"
                  onClick={() => setSettingsOpen((v) => !v)}
                  aria-label="Settings"
                  title="Settings"
                >
                  <I.Settings size={14} />
                </button>
                <button
                  type="button"
                  className="w-iconbtn"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  title="Close"
                >
                  <I.X size={14} />
                </button>
              </div>
            </div>
            <div className="w-meta">
              <button type="button" className="w-provider-chip" onClick={() => setSettingsOpen(true)} title="Switch provider">
                <span className={`pl ${providerThumbClass[provider]}`}>{providerThumbInitial[provider]}</span>
                {providerCfg.shortLabel}
                <I.ChevDown size={11} />
              </button>
              {tokensTotal > 0 && (
                <div className="w-cost" title={`${providerCfg.shortLabel} · ${providerCfg.defaultModel}`}>
                  <span><b>{formatTokens(tokensTotal)}</b> tok</span>
                  <span className="vsep" />
                  <span><b>{formatCost(sessionCost)}</b></span>
                </div>
              )}
            </div>
          </div>

          {/* Settings flyout */}
          {showFlyout && (
            <div className="flyout">
              <div className="flyout-header">
                <button type="button" className="flyout-back" onClick={() => setSettingsOpen(false)} aria-label="Back">
                  <I.ArrowLeft size={14} />
                </button>
                <div className="flyout-title">Settings</div>
                <div style={{ marginLeft: "auto" }}>
                  <button type="button" className="w-iconbtn" onClick={() => { setSettingsOpen(false); setOpen(false); }} aria-label="Close">
                    <I.X size={14} />
                  </button>
                </div>
              </div>
              <div className="flyout-body">
                {/* Provider thumbnail grid */}
                <div>
                  <div className="section-label">Provider</div>
                  <div className="prov-grid">
                    {PROVIDER_IDS.map((id) => {
                      const p = PROVIDERS[id];
                      const savedKey = Boolean(apiKeys[id]);
                      const defaultKey = Boolean(DEFAULT_KEYS[id]);
                      let badge: { text: string; cls: string } | null;
                      if (!p.requiresKey) badge = { text: "free demo", cls: "emerald" };
                      else if (savedKey) badge = { text: "your key", cls: "green" };
                      else if (defaultKey) badge = { text: "default", cls: "indigo" };
                      else badge = { text: "no key", cls: "gray" };
                      const isActive = provider === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          className={`prov-card ${isActive ? "selected" : ""}`}
                          onClick={() => switchProvider(id)}
                        >
                          <div className={`prov-logo ${providerThumbClass[id]}`}>{providerThumbInitial[id]}</div>
                          <div className="prov-card-name">{p.shortLabel}</div>
                          <div className="prov-card-meta">{p.defaultModel}</div>
                          {badge && <span className={`badge ${badge.cls}`}>{badge.text}</span>}
                          {isActive && (
                            <span className="prov-card-check"><I.Check size={10} stroke={3} /></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* API keys section */}
                <div>
                  <div className="section-label">API keys</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {PROVIDER_IDS.filter((id) => PROVIDERS[id].requiresKey).map((id) => {
                      const p = PROVIDERS[id];
                      const saved = apiKeys[id];
                      const last4 = saved ? saved.slice(-4) : null;
                      if (saved) {
                        return (
                          <div key={id} className="key-saved">
                            <span
                              className={`prov-logo ${providerThumbClass[id]}`}
                              style={{ width: 20, height: 20, fontSize: 9, borderRadius: 5 }}
                            >
                              {providerThumbInitial[id]}
                            </span>
                            <span style={{ flex: 1 }}>
                              {p.shortLabel} key saved · <code>•••{last4}</code>
                            </span>
                            <button
                              type="button"
                              className="btn-ghost-sm"
                              style={{ height: 24, padding: "0 8px" }}
                              onClick={() => forgetKey(id)}
                            >
                              Forget
                            </button>
                          </div>
                        );
                      }
                      // No saved key — inline key-block for entry. Only show input for the active provider.
                      const isActive = provider === id;
                      const usingDefault = !!DEFAULT_KEYS[id];
                      return (
                        <div key={id} className="key-block">
                          <div className="key-block-head">
                            <span
                              className={`prov-logo ${providerThumbClass[id]}`}
                              style={{ width: 20, height: 20, fontSize: 9, borderRadius: 5 }}
                            >
                              {providerThumbInitial[id]}
                            </span>
                            <span className="key-block-title">{p.shortLabel} key</span>
                            <span className={`badge ${usingDefault ? "indigo" : "gray"}`} style={{ marginLeft: "auto" }}>
                              {usingDefault ? "default" : "no key"}
                            </span>
                          </div>
                          {isActive && (
                            <>
                              <div className="key-input-row">
                                <input
                                  type={keyVisible ? "text" : "password"}
                                  value={keyInput}
                                  onChange={(e) => setKeyInput(e.target.value)}
                                  placeholder={p.apiKeyPlaceholder}
                                />
                                <button
                                  type="button"
                                  className="key-eye"
                                  onClick={() => setKeyVisible((v) => !v)}
                                  title={keyVisible ? "Hide" : "Show"}
                                >
                                  {keyVisible ? <I.EyeOff size={13} /> : <I.Eye size={13} />}
                                </button>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                <a
                                  className="console-link"
                                  href={p.apiKeyConsoleUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {p.apiKeyConsoleLabel} <I.ArrowRight size={10} />
                                </a>
                                <button
                                  type="button"
                                  className="btn-primary-sm"
                                  onClick={saveKey}
                                  disabled={!keyInput.trim()}
                                >
                                  Save key
                                </button>
                              </div>
                            </>
                          )}
                          {!isActive && (
                            <button
                              type="button"
                              className="btn-ghost-sm"
                              onClick={() => switchProvider(id)}
                              style={{ alignSelf: "flex-start" }}
                            >
                              Switch & paste key
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Session actions */}
                <div>
                  <div className="section-label">Session</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="btn-ghost-sm"
                      style={{ flex: 1, justifyContent: "center" }}
                      onClick={() => { resetChat(); setSettingsOpen(false); }}
                    >
                      <I.Trash size={11} /> Clear chat
                    </button>
                    <button
                      type="button"
                      className="btn-ghost-sm"
                      style={{ flex: 1, justifyContent: "center" }}
                      onClick={() => setUsage(EMPTY_USAGE)}
                    >
                      <I.Refresh size={11} /> Reset cost meter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Provider-key setup hero (when not in settings) */}
          {showSetup && !showFlyout && (
            <div className="w-body" style={{ paddingTop: 4 }}>
              <div className="setup-hero">
                <div className={`prov-logo ${providerThumbClass[provider]}`}>{providerThumbInitial[provider]}</div>
                <div>
                  <div className="setup-hero-title">Bring your own {providerCfg.shortLabel} key</div>
                  <div className="setup-hero-sub">
                    Your key lives in this browser&apos;s localStorage and is sent only to {providerCfg.apiKeyConsoleLabel}. Paste a key to continue.
                  </div>
                </div>
              </div>
              <div className="key-block">
                <div className="key-block-head">
                  <span className="key-block-title">{providerCfg.shortLabel} API key</span>
                  <span className="badge gray" style={{ marginLeft: "auto" }}>no key</span>
                </div>
                {usingDefaultKey && (
                  <div style={{ fontSize: 11, color: "var(--accent-fg)", padding: "0 2px" }}>
                    A bundled default key is active. Paste your own below to override.
                  </div>
                )}
                <div className="key-input-row">
                  <input
                    type={keyVisible ? "text" : "password"}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder={providerCfg.apiKeyPlaceholder}
                  />
                  <button
                    type="button"
                    className="key-eye"
                    onClick={() => setKeyVisible((v) => !v)}
                  >
                    {keyVisible ? <I.EyeOff size={13} /> : <I.Eye size={13} />}
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <a
                    className="console-link"
                    href={providerCfg.apiKeyConsoleUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {providerCfg.apiKeyConsoleLabel} <I.ArrowRight size={10} />
                  </a>
                  <div className="key-actions">
                    {DEFAULT_KEYS.demo && (
                      <button type="button" className="btn-ghost-sm" onClick={() => switchProvider("demo")}>
                        Use Demo instead
                      </button>
                    )}
                    <button type="button" className="btn-primary-sm" onClick={saveKey} disabled={!keyInput.trim()}>
                      Save &amp; continue
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--fg-tertiary)", lineHeight: 1.5, padding: "0 2px" }}>
                Switch providers anytime from the chip in the header above.
                {DEFAULT_KEYS.demo && (
                  <> The <b style={{ color: "var(--accent-fg)" }}>Demo</b> provider is free and requires no setup.</>
                )}
              </div>
            </div>
          )}

          {/* Main conversation body (only when settings closed + key OK) */}
          {!showFlyout && !showSetup && (
            <>
              <div ref={scrollRef} className="w-body">
                {turns.length === 0 ? (
                  <div className="w-empty">
                    <div className="w-empty-pitch">
                      <div className="w-empty-headline">Ask anything about the {ctx.users.length} users.</div>
                      <div className="w-empty-sub">
                        I can crunch counts, distributions, and top-N — or just drive the dashboard. Try a chip below, or type <code>/help</code> for commands.
                      </div>
                    </div>
                    <div style={{ flex: 1 }} />
                    <div>
                      <div className="w-suggest-label">Try one of these</div>
                      <div className="w-suggest-list">
                        {SUGGESTIONS.map((s) => (
                          <button key={s.label} type="button" className="w-suggest" onClick={() => void sendMessage(s.label)}>
                            <span className="w-suggest-icon">
                              {s.icon === "stats" ? <I.Stats size={11} /> : <I.Filter size={11} />}
                            </span>
                            <span className="w-suggest-text">{s.label}</span>
                            <I.ArrowRight size={12} className="w-suggest-arrow" />
                          </button>
                        ))}
                        <button type="button" className="w-suggest slash" onClick={() => void sendMessage("/help")}>
                          <span className="w-suggest-icon"><I.Slash size={11} /></span>
                          <span className="w-suggest-text">/help</span>
                          <I.ArrowRight size={12} className="w-suggest-arrow" />
                        </button>
                      </div>
                    </div>
                    <div className="w-kbdhints">
                      <span><span className="kbd">⌘K</span>open</span>
                      <span><span className="kbd">/</span>slash command</span>
                      <span><span className="kbd">Esc</span>close</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {turns.map((t, i) => {
                      if (t.role === "user") {
                        return (
                          <div key={i} className="msg user">
                            <div className="bubble user">{t.text}</div>
                          </div>
                        );
                      }
                      if (t.role === "system") {
                        return (
                          <div key={i} className="msg system">
                            <div className="bubble system">{t.text}</div>
                          </div>
                        );
                      }
                      // assistant — may have toolCalls, text, or both
                      return (
                        <div key={i} className="msg assistant">
                          {t.toolCalls && t.toolCalls.length > 0 && (
                            <div className="tool-calls">
                              {t.toolCalls.map((c, j) => {
                                const meta = TOOL_META[c.name];
                                if (!meta) return null;
                                const out = (c.output as Record<string, unknown> | undefined) ?? undefined;
                                const hasError = Boolean(out?.error);
                                const stillRunning = c.output === undefined;
                                const IconComp = I[meta.iconKey];
                                let preview: React.ReactNode = null;
                                if (out && !hasError) {
                                  if (c.name === "get_users_stats") preview = statsResultPreview(out);
                                  else if (c.name === "query_users") preview = queryResultPreview(out);
                                  else if (c.name === "open_user") preview = openUserResultPreview(out);
                                }
                                const argsNode = toolArgsSummary(c.input);
                                const showBody = Boolean(preview || argsNode);
                                return (
                                  <div key={j}>
                                    <div className="tool-card">
                                      <div className={`tool-card-head ${showBody ? "" : "nodivider"}`}>
                                        <span className={`tool-glyph ${meta.cls}`}><IconComp size={11} /></span>
                                        <span className="tool-name">{meta.label}</span>
                                        <span className={`tool-status ${stillRunning ? "running" : hasError ? "error" : ""}`}>
                                          {stillRunning ? (
                                            <><span className="tick" /> running…</>
                                          ) : hasError ? (
                                            <><span className="tick">!</span> error</>
                                          ) : (
                                            <><span className="tick"><I.Check size={7} stroke={3} /></span> done</>
                                          )}
                                        </span>
                                      </div>
                                      {argsNode}
                                      {preview}
                                    </div>
                                    {/* Diff card under apply/clear filter tool calls */}
                                    {(c.name === "apply_filters" || c.name === "clear_filters") && (() => {
                                      const diff = c.name === "apply_filters"
                                        ? c.diff
                                        : clearFiltersDiff(c.previousFilters);
                                      if (!diff || Object.keys(diff).length === 0) return null;
                                      const matched = c.name === "apply_filters"
                                        ? (out?.matched_count as number | undefined)
                                        : (out?.total_users as number | undefined);
                                      const subBits: string[] = [];
                                      subBits.push(`${Object.keys(diff).length} keys ${c.name === "apply_filters" ? "updated" : "reset"}`);
                                      if (typeof matched === "number") subBits.push(`${matched} users now visible`);
                                      return (
                                        <div className="diff-card" style={{ marginTop: 6 }}>
                                          <div className="diff-head">
                                            <span className={`diff-head-icon ${c.name === "clear_filters" ? "danger" : ""}`}>
                                              {c.name === "clear_filters" ? <I.Trash size={12} /> : <I.Filter size={12} />}
                                            </span>
                                            <div>
                                              <div className="diff-head-title">
                                                {c.name === "clear_filters" ? "All filters cleared" : "Dashboard filters changed"}
                                              </div>
                                              <div className="diff-head-sub">{subBits.join(" · ")}</div>
                                            </div>
                                            <button
                                              type="button"
                                              className={`diff-undo ${c.undone ? "done" : ""}`}
                                              disabled={c.undone}
                                              onClick={() => c.previousFilters && restoreFilters(c.previousFilters, i, j)}
                                            >
                                              {c.undone ? (
                                                <><I.Check size={11} stroke={2.5} /> Undone</>
                                              ) : (
                                                <><I.Undo size={11} /> Undo</>
                                              )}
                                            </button>
                                          </div>
                                          <div className="diff-timeline">
                                            {Object.entries(diff).map(([key, v]) => (
                                              <div key={key} className="diff-row">
                                                <div className="diff-row-key">{key}</div>
                                                <div className="diff-row-vals">
                                                  <span className={`diff-pill ${v.from == null || v.from === "" ? "empty" : ""}`}>
                                                    {v.from == null || v.from === "" ? "unset" : String(v.from)}
                                                  </span>
                                                  <span className="diff-arrow">→</span>
                                                  <span className={`diff-pill ${v.to == null || v.to === "" ? "empty" : "new"}`}>
                                                    {v.to == null || v.to === "" ? "unset" : String(v.to)}
                                                  </span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {t.text && <div className="bubble assistant" style={{ marginTop: t.toolCalls?.length ? 6 : 0 }}>{t.text}</div>}
                        </div>
                      );
                    })}
                    {pending && <div className="pending-bubble"><i /><i /><i /></div>}
                  </>
                )}

                {/* Error banner */}
                {error && (
                  <div className={`banner ${isDemoRateLimit ? "amber" : "red"}`}>
                    <span className="banner-icon"><I.Warn size={11} /></span>
                    <div className="banner-body">
                      <div className="banner-title">
                        {isDemoRateLimit ? "Demo provider rate-limit hit" : "Request failed"}
                      </div>
                      <div className="banner-msg">{error}</div>
                      <div className="banner-actions">
                        {isDemoRateLimit ? (
                          <>
                            <button
                              type="button"
                              className="banner-btn primary"
                              onClick={() => { setError(null); setSettingsOpen(true); switchProvider("anthropic"); }}
                            >
                              <span className="pl claude" style={{ width: 12, height: 12, fontSize: 7, borderRadius: 3 }}>C</span>
                              Use my Claude key
                            </button>
                            <button
                              type="button"
                              className="banner-btn"
                              onClick={() => { setError(null); setSettingsOpen(true); switchProvider("google"); }}
                            >
                              <span className="pl gemini" style={{ width: 12, height: 12, fontSize: 7, borderRadius: 3 }}>G</span>
                              Use my Gemini key
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" className="banner-btn primary" onClick={() => setError(null)}>
                              <I.Refresh size={11} /> Dismiss
                            </button>
                            {DEFAULT_KEYS.demo && (
                              <button type="button" className="banner-btn" onClick={() => { setError(null); switchProvider("demo"); }}>
                                Switch to Demo
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input area */}
              <form onSubmit={onSubmit} className="w-input-wrap">
                {showSlashPopover && slashMatches.length > 0 && (
                  <div className="slash-popover">
                    {slashMatches.map((c, i) => (
                      <button
                        key={c.name}
                        type="button"
                        className={`slash-item ${i === 0 ? "active" : ""}`}
                        onMouseDown={(e) => {
                          // Prevent textarea from losing focus before click handler runs
                          e.preventDefault();
                        }}
                        onClick={() => {
                          // Auto-fill the command + space; user types args if needed
                          const next = c.args ? `/${c.name} ` : `/${c.name}`;
                          setInput(next);
                          if (!c.args) {
                            // For arg-less commands, send immediately
                            void sendMessage(next);
                          }
                        }}
                      >
                        <span className="sl-icon">{(() => { const Ic = I[c.icon]; return <Ic size={12} />; })()}</span>
                        <span className="sl-name">/{c.name}</span>
                        <span className="sl-desc">{c.description}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className={`w-input-card ${inputFocused ? "focus" : ""}`}>
                  <textarea
                    className="w-textarea"
                    value={input}
                    placeholder="Ask about these users…"
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage(input);
                      }
                    }}
                    rows={1}
                    disabled={pending}
                  />
                  {pending ? (
                    <button type="button" className="w-send stop" onClick={cancel}>
                      <I.Stop size={11} /> Stop
                    </button>
                  ) : (
                    <button type="submit" className={`w-send ${input.trim() ? "" : "dim"}`} disabled={!input.trim()}>
                      <I.Send size={12} />
                    </button>
                  )}
                </div>
                <div className="w-input-foot">
                  <span>Enter to send · Shift+Enter for newline</span>
                  <span><span className="kbd">/</span> slash</span>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
