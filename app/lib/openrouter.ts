import { addUsage, EMPTY_USAGE, type ChatUsage } from "./pricing";
import type {
  AnthropicContentBlock,
  AnthropicMessage,
  AnthropicTool,
  RunChatParams,
  RunChatResult,
} from "./anthropic";

/**
 * OpenAI Chat Completion client targeting our Cloudflare Worker proxy.
 *
 * The Worker holds the OpenRouter key and decides the model — we just send
 * an OpenAI-format payload. `apiKey` is repurposed in the provider config
 * to carry the Worker URL (no real key is sent from the browser).
 */

// ── OpenAI wire format ───────────────────────────────────────────────────────

interface OpenAIToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
}

interface OpenAIResponse {
  choices?: Array<{
    message: OpenAIMessage;
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  error?: { message?: string; code?: string | number } | string;
}

// ── Format conversion ────────────────────────────────────────────────────────

function toolsToOpenAI(tools: AnthropicTool[]) {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));
}

function blocksToOpenAIMessages(
  role: "user" | "assistant",
  blocks: AnthropicContentBlock[],
): OpenAIMessage[] {
  const out: OpenAIMessage[] = [];
  const textParts: string[] = [];
  const toolCalls: OpenAIToolCall[] = [];

  for (const block of blocks) {
    if (block.type === "text") {
      textParts.push(block.text);
    } else if (block.type === "tool_use") {
      toolCalls.push({
        id: block.id,
        type: "function",
        function: {
          name: block.name,
          arguments: JSON.stringify(block.input ?? {}),
        },
      });
    } else if (block.type === "tool_result") {
      // OpenAI: one `role: tool` message per tool result, with matching call id.
      out.push({
        role: "tool",
        tool_call_id: block.tool_use_id,
        content: block.content,
      });
    }
  }

  if (role === "assistant" && (textParts.length || toolCalls.length)) {
    out.push({
      role: "assistant",
      content: textParts.join("\n") || null,
      ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
    });
  } else if (role === "user" && textParts.length) {
    out.push({ role: "user", content: textParts.join("\n") });
  }

  return out;
}

function messagesToOpenAI(system: string, msgs: AnthropicMessage[]): OpenAIMessage[] {
  const out: OpenAIMessage[] = [];
  if (system) out.push({ role: "system", content: system });
  for (const m of msgs) {
    if (typeof m.content === "string") {
      out.push({ role: m.role, content: m.content });
    } else {
      out.push(...blocksToOpenAIMessages(m.role, m.content));
    }
  }
  return out;
}

// ── runChat ──────────────────────────────────────────────────────────────────

export async function runChat({
  apiKey, // here: the Worker URL — not a secret
  // `model` is ignored — the Worker enforces its own DEFAULT_MODEL
  system,
  messages,
  tools,
  onToolCall,
  onAssistantStep,
  onToolResult,
  signal,
  maxIterations = 6,
}: RunChatParams): Promise<RunChatResult> {
  const workerUrl = apiKey;
  if (!workerUrl) {
    throw new Error("Demo worker URL not configured — set NEXT_PUBLIC_DEMO_WORKER_URL");
  }

  const convo: AnthropicMessage[] = [...messages];
  let usage: ChatUsage = EMPTY_USAGE;

  for (let i = 0; i < maxIterations; i++) {
    const body = {
      messages: messagesToOpenAI(system, convo),
      ...(tools.length
        ? { tools: toolsToOpenAI(tools), tool_choice: "auto" as const }
        : {}),
    };

    const res = await fetch(workerUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      const txt = await res.text();
      let parsed: { error?: { message?: string } | string; message?: string; scope?: string } = {};
      try {
        parsed = JSON.parse(txt);
      } catch {
        // keep raw
      }
      // Rate-limit errors carry a friendly message that ChatWidget surfaces verbatim.
      if (res.status === 429) {
        const msg =
          parsed.message ??
          `Demo limit reached (${parsed.scope ?? "rate_limit"}). Switch to a provider with your own key in settings.`;
        throw new Error(msg);
      }
      const msg =
        typeof parsed.error === "string"
          ? parsed.error
          : parsed.error?.message ?? parsed.message ?? txt;
      throw new Error(`Demo API ${res.status}: ${msg}`);
    }

    const data = (await res.json()) as OpenAIResponse;

    if (data.usage) {
      usage = addUsage(usage, {
        input_tokens: data.usage.prompt_tokens ?? 0,
        output_tokens: data.usage.completion_tokens ?? 0,
      });
    }

    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error("Demo API returned no choices");
    }

    const msg = choice.message;
    const blocks: AnthropicContentBlock[] = [];
    if (msg.content) blocks.push({ type: "text", text: msg.content });
    for (const tc of msg.tool_calls ?? []) {
      let parsedArgs: unknown = {};
      try {
        parsedArgs = JSON.parse(tc.function.arguments);
      } catch {
        parsedArgs = {};
      }
      blocks.push({
        type: "tool_use",
        id: tc.id,
        name: tc.function.name,
        input: parsedArgs,
      });
    }

    onAssistantStep?.(blocks);
    convo.push({ role: "assistant", content: blocks });

    const toolUses = blocks.filter(
      (b): b is Extract<AnthropicContentBlock, { type: "tool_use" }> => b.type === "tool_use",
    );

    if (choice.finish_reason !== "tool_calls" || toolUses.length === 0) {
      const finalText = blocks
        .filter((b): b is Extract<AnthropicContentBlock, { type: "text" }> => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { finalText, messages: convo, usage };
    }

    const toolResults: AnthropicContentBlock[] = [];
    for (const tu of toolUses) {
      try {
        const out = await onToolCall(tu.name, tu.input);
        onToolResult?.(tu.name, tu.input, out, false);
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: JSON.stringify(out),
        });
      } catch (e) {
        const errPayload = { error: e instanceof Error ? e.message : String(e) };
        onToolResult?.(tu.name, tu.input, errPayload, true);
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: JSON.stringify(errPayload),
          is_error: true,
        });
      }
    }
    convo.push({ role: "user", content: toolResults });
  }

  throw new Error(`Tool loop did not converge after ${maxIterations} iterations`);
}
