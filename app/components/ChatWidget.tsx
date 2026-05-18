"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { DashboardCtx } from "./dashboard-ctx";
import { ANTHROPIC_TOOLS, executeTool } from "../lib/chatTools";
import { runChat, type AnthropicContentBlock, type AnthropicMessage } from "../lib/anthropic";

const STORAGE_KEY = "ud_anthropic_key";
const MODEL = "claude-sonnet-4-6";

interface ChatTurn {
  role: "user" | "assistant";
  text?: string;
  toolCalls?: Array<{ name: string; input: unknown }>;
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

export function ChatWidget() {
  const ctx = useContext(DashboardCtx);
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });
  const [keyInput, setKeyInput] = useState("");
  const [persistKey, setPersistKey] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setApiKey(trimmed);
    if (persistKey && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, trimmed);
    }
    setKeyInput("");
    setSettingsOpen(false);
  }

  function forgetKey() {
    setApiKey(null);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    setSettingsOpen(false);
  }

  function resetChat() {
    setTurns([]);
    setError(null);
  }

  async function sendMessage(text: string) {
    if (!ctx || !apiKey || !text.trim() || pending) return;
    setError(null);
    const userTurn: ChatTurn = { role: "user", text: text.trim() };
    const baseMessages: AnthropicMessage[] = [...apiMessages, { role: "user", content: text.trim() }];
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
      const { finalText } = await runChat({
        apiKey,
        model: MODEL,
        system,
        messages: baseMessages,
        tools: ANTHROPIC_TOOLS,
        signal: ctrl.signal,
        onAssistantStep: (blocks: AnthropicContentBlock[]) => {
          const calls = blocks
            .filter((b): b is Extract<AnthropicContentBlock, { type: "tool_use" }> => b.type === "tool_use")
            .map((b) => ({ name: b.name, input: b.input }));
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
        onToolCall: (name, toolInput) => executeTool(name, toolInput, ctx),
      });

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

  const needsKey = !apiKey || settingsOpen;

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
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">{ctx.users.length} users · {MODEL}</p>
            </div>
            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Settings"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="2" />
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3" />
              </svg>
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
              <p className="font-semibold mb-1">Anthropic API key</p>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-3">
                Demo only — your key, your bill. The request goes directly from your browser to{" "}
                <a className="underline" href="https://console.anthropic.com/" target="_blank" rel="noreferrer">
                  console.anthropic.com
                </a>
                .
              </p>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full h-9 px-3 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-[13px] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:border-[#185FA5]"
              />
              <label className="flex items-center gap-2 mt-2 text-[12px] text-zinc-500 dark:text-zinc-400">
                <input type="checkbox" checked={persistKey} onChange={(e) => setPersistKey(e.target.checked)} />
                Remember in this browser (localStorage)
              </label>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={saveKey}
                  disabled={!keyInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-[#185FA5] hover:bg-[#144d85] disabled:opacity-50 text-white text-[13px] font-medium transition-colors"
                >
                  Save
                </button>
                {apiKey && (
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
                    Ask anything about the {ctx.users.length} users — counts, distributions, filters.
                  </div>
                )}
                {turns.map((t, i) => (
                  <div key={i} className={t.role === "user" ? "flex justify-end" : "flex justify-start"}>
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
                {error && (
                  <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2 text-[12px]">
                    {error}
                  </div>
                )}
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
