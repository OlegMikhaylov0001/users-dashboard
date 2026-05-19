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
  // For apply_filters / clear_filters — captured at execution time so Undo can revert.
  previousFilters?: FiltersSnapshot;
  // For apply_filters — keys → from/to so we can render a diff chip.
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

function summarizeToolInput(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const obj = input as Record<string, unknown>;
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === "" || v === null) continue;
    if (typeof v === "object") parts.push(`${k}=${JSON.stringify(v)}`);
    else parts.push(`${k}=${String(v)}`);
  }
  return parts.join(" · ");
}

const SUGGESTIONS = [
  "Avg age of engineering users in the US",
  "Top 5 countries among moderators",
  "Show only female HR users",
];

interface SlashCommand {
  name: string;
  args?: string;
  description: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  { name: "help", description: "List available commands" },
  { name: "clear", description: "Wipe chat history (local, no API call)" },
  { name: "cost", description: "Show this session's token + $ usage" },
  { name: "explain", description: "Summarise current filters and the visible users" },
  { name: "compare", args: "<name1> and <name2>", description: "Compare two users by their key attributes" },
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

/** Returns null if input is not a slash command. Otherwise: {handledLocally, expandedPrompt?}. */
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
        return { handledLocally: true, localText: 'Usage: /compare <name1> and <name2>' };
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
      demo: null, // demo provider doesn't accept a user key
      anthropic: window.localStorage.getItem(PROVIDERS.anthropic.apiKeyStorageKey),
      google: window.localStorage.getItem(PROVIDERS.google.apiKeyStorageKey),
    };
  });
  // localStorage takes precedence over bundled default; default is the fallback.
  // For the keyless demo provider, DEFAULT_KEYS["demo"] holds the Worker URL.
  const apiKey = apiKeys[provider] || DEFAULT_KEYS[provider] || null;
  const providerCfg = PROVIDERS[provider];
  // "default" hint only makes sense for keyed providers; demo isn't really a "key".
  const usingDefaultKey =
    providerCfg.requiresKey && !apiKeys[provider] && !!DEFAULT_KEYS[provider];
  const [keyInput, setKeyInput] = useState("");
  const [persistKey, setPersistKey] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<ChatUsage>(EMPTY_USAGE);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [turns, pending]);

  const apiMessages = useMemo<AnthropicMessage[]>(() => {
    // Rebuild the full Anthropic message thread from turns for stateless calls.
    // We only kept summarized chat turns in state, so we replay text + tool history.
    // (For v1 we keep history simple: send back assistant text only — model already
    // explained what it did. Tool-use round-trips happen within a single runChat call.)
    const msgs: AnthropicMessage[] = [];
    for (const t of turns) {
      if (t.role === "user" && t.text) msgs.push({ role: "user", content: t.text });
      else if (t.role === "assistant" && t.text) msgs.push({ role: "assistant", content: t.text });
    }
    return msgs;
  }, [turns]);

  function saveKey() {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    setApiKeys((prev) => ({ ...prev, [provider]: trimmed }));
    if (persistKey && typeof window !== "undefined") {
      window.localStorage.setItem(providerCfg.apiKeyStorageKey, trimmed);
    }
    setKeyInput("");
    setSettingsOpen(false);
  }

  function forgetKey() {
    setApiKeys((prev) => ({ ...prev, [provider]: null }));
    if (typeof window !== "undefined") window.localStorage.removeItem(providerCfg.apiKeyStorageKey);
    setSettingsOpen(false);
  }

  function switchProvider(next: ProviderId) {
    if (next === provider) return;
    setProvider(next);
    setKeyInput(""); // avoid accidentally saving the wrong-provider key from the input draft
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

    // Slash command handling — happens before any LLM call.
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
              next[idx] = {
                ...cur,
                toolCalls: [...(cur.toolCalls ?? []), ...calls],
              };
              return next;
            });
          }
        },
        onToolResult: (name, _input, output) => {
          // Patch the matching tool-call record with its output and any diff/previous_filters.
          // Match by name + position: the latest call of this name without an output yet.
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

  // Open the settings dialog automatically when the current provider needs a key
  // and we don't have one (saved or default). Keyless demo provider skips this.
  const needsKey = (providerCfg.requiresKey && !apiKey) || settingsOpen;

  return (
    <>
      {/* Floating action button — visible when chat closed */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-[#185FA5] hover:bg-[#144d85] text-white shadow-2xl flex items-center justify-center transition-colors"
          aria-label="Open chat assistant"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 4h14v10H8l-3 3v-3H3z" />
            <circle cx="7" cy="9" r="0.8" fill="currentColor" />
            <circle cx="10" cy="9" r="0.8" fill="currentColor" />
            <circle cx="13" cy="9" r="0.8" fill="currentColor" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] h-[32rem] max-h-[calc(100vh-2rem)] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col z-40 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 h-12 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="w-7 h-7 rounded-full bg-[#185FA5] text-white flex items-center justify-center text-[12px] font-semibold">AI</div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 truncate">Ask about these users</p>
              <p
                className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate flex items-center gap-1"
                title={`${ctx.users.length} users · ${providerCfg.defaultModel} (${providerCfg.shortLabel})`}
              >
                <span>{ctx.users.length} users</span>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 -my-0.5 rounded text-[11px] font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  title="Switch provider"
                >
                  {providerCfg.shortLabel}
                  <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </button>
                {totalTokens(usage) > 0 && (
                  <span title={`Session tokens / cost (${providerCfg.pricingNote})`}>
                    · {formatTokens(totalTokens(usage))} tok · {formatCost(costUsd(usage, providerCfg.pricing))}
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Settings"
              title="Settings"
            >
              <I.Settings size={14} />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 3l10 10M13 3L3 13" />
              </svg>
            </button>
          </div>

          {needsKey ? (
            <div className="flex-1 overflow-y-auto px-4 py-4 text-[13px] text-zinc-700 dark:text-zinc-300">
              <p className="font-semibold mb-2">Provider</p>
              <div className="flex flex-col gap-1 mb-4">
                {PROVIDER_IDS.map((id) => {
                  const p = PROVIDERS[id];
                  const savedKey = Boolean(apiKeys[id]);
                  const defaultKey = Boolean(DEFAULT_KEYS[id]);
                  let badge: { text: string; color: string };
                  if (!p.requiresKey) badge = { text: "free demo", color: "text-emerald-600 dark:text-emerald-400" };
                  else if (savedKey) badge = { text: "your key", color: "text-green-600 dark:text-green-400" };
                  else if (defaultKey) badge = { text: "default", color: "text-[#6F50D9] dark:text-[#9b85e8]" };
                  else badge = { text: "no key", color: "text-zinc-400" };
                  return (
                    <label
                      key={id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer border ${
                        provider === id
                          ? "border-[#6F50D9] bg-[#6F50D9]/5"
                          : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <input
                        type="radio"
                        name="provider"
                        checked={provider === id}
                        onChange={() => switchProvider(id)}
                        className="cursor-pointer"
                      />
                      <span className="flex-1 text-[13px]">{p.label}</span>
                      <span className={`text-[10px] uppercase tracking-wider font-semibold ${badge.color}`}>
                        {badge.text}
                      </span>
                    </label>
                  );
                })}
              </div>

              {providerCfg.requiresKey ? (
                <>
                  <p className="font-semibold mb-1">{providerCfg.shortLabel} API key</p>
                  <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-3">
                    {providerCfg.pricingNote} The request goes directly from your browser to{" "}
                    <a className="underline" href={providerCfg.apiKeyConsoleUrl} target="_blank" rel="noreferrer">
                      {providerCfg.apiKeyConsoleLabel}
                    </a>
                    .
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold mb-1">Free demo — no key needed</p>
                  <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-3">
                    {providerCfg.pricingNote} Switch to Claude or Gemini if you need a higher quota or specific model.
                  </p>
                </>
              )}
              {usingDefaultKey && (
                <p className="text-[12px] text-[#6F50D9] dark:text-[#9b85e8] mb-3 bg-[#6F50D9]/5 border border-[#6F50D9]/20 rounded-lg px-2.5 py-1.5">
                  Currently using the bundled default key. Paste your own below to override (saved in localStorage, takes precedence).
                </p>
              )}
              {providerCfg.requiresKey && (
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={providerCfg.apiKeyPlaceholder}
                  className="w-full h-9 px-3 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-[13px] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:border-[#185FA5]"
                />
              )}
              {providerCfg.requiresKey && (
                <label className="flex items-center gap-2 mt-2 text-[12px] text-zinc-500 dark:text-zinc-400">
                  <input type="checkbox" checked={persistKey} onChange={(e) => setPersistKey(e.target.checked)} />
                  Remember in this browser (localStorage)
                </label>
              )}
              <div className="flex gap-2 mt-3">
                {providerCfg.requiresKey && (
                  <button
                    type="button"
                    onClick={saveKey}
                    disabled={!keyInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-[#185FA5] hover:bg-[#144d85] disabled:opacity-50 text-white text-[13px] font-medium transition-colors"
                  >
                    Save
                  </button>
                )}
                {providerCfg.requiresKey && apiKeys[provider] && (
                  <button
                    type="button"
                    onClick={forgetKey}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Forget current key
                  </button>
                )}
                {apiKey && settingsOpen && (
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(false)}
                    className="ml-auto px-3 py-1.5 rounded-lg text-[13px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {apiKey && (
                <button
                  type="button"
                  onClick={resetChat}
                  className="mt-4 text-[12px] text-zinc-400 hover:text-red-500 transition-colors"
                >
                  Clear chat history
                </button>
              )}
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {turns.length === 0 && (
                  <div className="text-[12px] text-zinc-400 dark:text-zinc-500">
                    Ask anything about the {ctx.users.length} users — counts, distributions, filters. Type <span className="font-mono">/help</span> for commands.
                  </div>
                )}
                {turns.map((t, i) => (
                  t.role === "system" ? (
                    <div key={i} className="text-[12px] text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 whitespace-pre-wrap font-mono">
                      {t.text}
                    </div>
                  ) : (
                    <div key={i} className="space-y-1.5">
                      <div className={t.role === "user" ? "flex justify-end" : "flex justify-start"}>
                        <div
                          className={
                            t.role === "user"
                              ? "max-w-[85%] bg-[#185FA5] text-white px-3 py-2 rounded-2xl rounded-br-sm text-[13px] whitespace-pre-wrap"
                              : "max-w-[85%] bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 px-3 py-2 rounded-2xl rounded-bl-sm text-[13px] whitespace-pre-wrap"
                          }
                        >
                          {t.toolCalls && t.toolCalls.length > 0 && (
                            <div className="mb-1.5 flex flex-wrap gap-1">
                              {t.toolCalls.map((c, j) => (
                                <span
                                  key={j}
                                  className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold bg-white/60 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded"
                                  title={summarizeToolInput(c.input)}
                                >
                                  <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M6 3l4 5-4 5" />
                                  </svg>
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {t.text}
                        </div>
                      </div>
                      {/* Diff card with Undo for filter-changing tools */}
                      {t.toolCalls?.map((c, j) =>
                        (c.name === "apply_filters" || c.name === "clear_filters") && c.previousFilters ? (
                          <div
                            key={`diff-${j}`}
                            className="ml-2 text-[11px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 flex items-start gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                                {c.name === "clear_filters" ? "filters cleared" : "filters changed"}
                              </div>
                              <div className="mt-0.5 flex flex-wrap gap-1">
                                {c.name === "apply_filters" && c.diff
                                  ? Object.entries(c.diff).map(([k, v]) => (
                                      <span key={k} className="font-mono text-zinc-600 dark:text-zinc-300">
                                        {k}: <span className="line-through text-zinc-400">{String(v.from || "—")}</span>{" "}
                                        →{" "}
                                        <span className="text-green-600 dark:text-green-400">{String(v.to || "—")}</span>
                                      </span>
                                    ))
                                  : (
                                      <span className="font-mono text-zinc-500 dark:text-zinc-400">all filters reset</span>
                                    )}
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={c.undone}
                              onClick={() => restoreFilters(c.previousFilters!, i, j)}
                              className="text-[11px] px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                            >
                              {c.undone ? "Undone" : "Undo"}
                            </button>
                          </div>
                        ) : null,
                      )}
                    </div>
                  )
                ))}
                {pending && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-3 py-2 rounded-2xl rounded-bl-sm text-[13px]">
                      <span className="inline-flex gap-0.5">
                        <span className="animate-pulse">·</span>
                        <span className="animate-pulse" style={{ animationDelay: "150ms" }}>·</span>
                        <span className="animate-pulse" style={{ animationDelay: "300ms" }}>·</span>
                      </span>
                    </div>
                  </div>
                )}
                {error && (() => {
                  const isDemoLimit = error.toLowerCase().includes("demo limit");
                  return (
                    <div className={
                      isDemoLimit
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2 text-[12px] space-y-2"
                        : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2 text-[12px]"
                    }>
                      <div>{error}</div>
                      {isDemoLimit && (
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setSettingsOpen(true);
                              switchProvider("anthropic");
                            }}
                            className="px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800 text-[11px] font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                          >
                            Use my Claude key
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setSettingsOpen(true);
                              switchProvider("google");
                            }}
                            className="px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800 text-[11px] font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                          >
                            Use my Gemini key
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {turns.length === 0 && (
                <div className="flex flex-wrap gap-1.5 px-4 pb-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void sendMessage(s)}
                      className="text-[11px] px-2 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => void sendMessage("/help")}
                    className="text-[11px] px-2 py-1 rounded-full border border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-mono"
                  >
                    /help
                  </button>
                </div>
              )}

              <form onSubmit={onSubmit} className="border-t border-zinc-200 dark:border-zinc-800 px-3 py-2.5 flex items-end gap-2 shrink-0">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage(input);
                    }
                  }}
                  rows={1}
                  placeholder="Ask about these users…"
                  className="flex-1 resize-none max-h-32 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-[13px] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:border-[#185FA5]"
                  disabled={pending}
                />
                {pending ? (
                  <button
                    type="button"
                    onClick={cancel}
                    className="px-3 h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="px-3 h-9 rounded-lg bg-[#185FA5] hover:bg-[#144d85] disabled:opacity-50 text-white text-[13px] font-medium transition-colors"
                  >
                    Send
                  </button>
                )}
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
