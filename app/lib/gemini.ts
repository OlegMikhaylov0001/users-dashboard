import { addUsage, EMPTY_USAGE, type ChatUsage } from "./pricing";
import type {
  AnthropicContentBlock,
  AnthropicMessage,
  AnthropicTool,
  RunChatParams,
  RunChatResult,
} from "./anthropic";

// ── Gemini wire format ───────────────────────────────────────────────────────

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: GeminiContent;
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    cachedContentTokenCount?: number;
  };
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

// ── Schema cleanup ────────────────────────────────────────────────────────────
// Gemini rejects JSON Schema keywords it doesn't recognise (`additionalProperties`,
// `$schema`, etc.) and chokes on `default` inside nested `properties`. Strip them.

const GEMINI_FORBIDDEN_KEYS = new Set(["additionalProperties", "$schema", "default", "strict"]);

function cleanSchemaForGemini(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(cleanSchemaForGemini);
  if (!schema || typeof schema !== "object") return schema;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(schema as Record<string, unknown>)) {
    if (GEMINI_FORBIDDEN_KEYS.has(k)) continue;
    out[k] = cleanSchemaForGemini(v);
  }
  return out;
}

function toGeminiTools(tools: AnthropicTool[]) {
  if (!tools.length) return undefined;
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: cleanSchemaForGemini(t.input_schema),
      })),
    },
  ];
}

// ── Message format conversion ────────────────────────────────────────────────

function blocksToParts(
  blocks: AnthropicContentBlock[],
  idToName: Map<string, string>,
): GeminiPart[] {
  const parts: GeminiPart[] = [];
  for (const b of blocks) {
    if (b.type === "text") {
      parts.push({ text: b.text });
    } else if (b.type === "tool_use") {
      idToName.set(b.id, b.name);
      parts.push({
        functionCall: {
          name: b.name,
          args: (b.input as Record<string, unknown>) ?? {},
        },
      });
    } else if (b.type === "tool_result") {
      const name = idToName.get(b.tool_use_id) ?? "unknown";
      let response: Record<string, unknown>;
      try {
        const parsed = JSON.parse(b.content);
        response = parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : { result: parsed };
      } catch {
        response = { result: b.content };
      }
      parts.push({ functionResponse: { name, response } });
    }
  }
  return parts;
}

function toGeminiContents(
  messages: AnthropicMessage[],
  idToName: Map<string, string>,
): GeminiContent[] {
  const result: GeminiContent[] = [];
  for (const msg of messages) {
    const role: GeminiContent["role"] = msg.role === "user" ? "user" : "model";
    if (typeof msg.content === "string") {
      result.push({ role, parts: [{ text: msg.content }] });
    } else {
      result.push({ role, parts: blocksToParts(msg.content, idToName) });
    }
  }
  return result;
}

// ── Main loop ────────────────────────────────────────────────────────────────

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export async function runChat({
  apiKey,
  model,
  system,
  messages,
  tools,
  onToolCall,
  onAssistantStep,
  onToolResult,
  signal,
  maxIterations = 6,
}: RunChatParams): Promise<RunChatResult> {
  const convo: AnthropicMessage[] = [...messages];
  let usage: ChatUsage = EMPTY_USAGE;
  const idToName = new Map<string, string>();
  let callSeq = 0;

  // Seed idToName from any pre-existing tool_use blocks in the incoming history
  for (const msg of messages) {
    if (Array.isArray(msg.content)) {
      for (const b of msg.content) {
        if (b.type === "tool_use") idToName.set(b.id, b.name);
      }
    }
  }

  for (let i = 0; i < maxIterations; i++) {
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: toGeminiContents(convo, idToName),
      tools: toGeminiTools(tools),
      toolConfig: { functionCallingConfig: { mode: "AUTO" } },
      generationConfig: { maxOutputTokens: 1024 },
    };

    const url = `${API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      const txt = await res.text();
      let msg = txt;
      try {
        const j = JSON.parse(txt) as GeminiResponse;
        msg = j?.error?.message ?? txt;
      } catch {
        // keep raw
      }
      throw new Error(`Gemini API ${res.status}: ${msg}`);
    }

    const data = (await res.json()) as GeminiResponse;

    if (data.usageMetadata) {
      usage = addUsage(usage, {
        input_tokens: data.usageMetadata.promptTokenCount ?? 0,
        output_tokens: data.usageMetadata.candidatesTokenCount ?? 0,
        cache_read_input_tokens: data.usageMetadata.cachedContentTokenCount ?? 0,
      });
    }

    if (data.promptFeedback?.blockReason) {
      throw new Error(`Gemini blocked the prompt: ${data.promptFeedback.blockReason}`);
    }

    const candidate = data.candidates?.[0];
    if (!candidate) throw new Error("Gemini returned no candidates");

    const parts = candidate.content?.parts ?? [];
    const blocks: AnthropicContentBlock[] = [];
    for (const part of parts) {
      if (typeof part.text === "string" && part.text.length) {
        blocks.push({ type: "text", text: part.text });
      } else if (part.functionCall) {
        callSeq += 1;
        const id = `gem-${callSeq}-${part.functionCall.name}`;
        idToName.set(id, part.functionCall.name);
        blocks.push({
          type: "tool_use",
          id,
          name: part.functionCall.name,
          input: (part.functionCall.args as unknown) ?? {},
        });
      }
    }

    onAssistantStep?.(blocks);
    convo.push({ role: "assistant", content: blocks });

    const toolUses = blocks.filter(
      (b): b is Extract<AnthropicContentBlock, { type: "tool_use" }> => b.type === "tool_use",
    );

    // No tool calls → we're done (regardless of finishReason — STOP, MAX_TOKENS, etc.)
    if (toolUses.length === 0) {
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
