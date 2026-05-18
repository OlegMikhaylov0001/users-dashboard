import { addUsage, EMPTY_USAGE, type ChatUsage } from "./pricing";

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
}

export interface RunChatParams {
  apiKey: string;
  model: string;
  system: string;
  messages: AnthropicMessage[];
  tools: AnthropicTool[];
  onToolCall: (name: string, input: unknown) => Promise<unknown> | unknown;
  onAssistantStep?: (blocks: AnthropicContentBlock[]) => void;
  onToolResult?: (name: string, input: unknown, output: unknown, isError: boolean) => void;
  signal?: AbortSignal;
  maxIterations?: number;
}

export interface RunChatResult {
  finalText: string;
  messages: AnthropicMessage[];
  usage: ChatUsage;
}

const API_URL = "https://api.anthropic.com/v1/messages";

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

  for (let i = 0; i < maxIterations; i++) {
    const body = {
      model,
      max_tokens: 1024,
      system,
      tools,
      messages: convo,
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      const txt = await res.text();
      let msg = txt;
      try {
        const j = JSON.parse(txt);
        msg = j?.error?.message ?? txt;
      } catch {
        // keep raw text
      }
      throw new Error(`Anthropic API ${res.status}: ${msg}`);
    }

    const data = (await res.json()) as {
      content: AnthropicContentBlock[];
      stop_reason: string;
      usage?: Partial<ChatUsage>;
    };

    if (data.usage) usage = addUsage(usage, data.usage);

    const blocks = data.content ?? [];
    onAssistantStep?.(blocks);
    convo.push({ role: "assistant", content: blocks });

    const toolUses = blocks.filter((b): b is Extract<AnthropicContentBlock, { type: "tool_use" }> => b.type === "tool_use");

    if (data.stop_reason !== "tool_use" || toolUses.length === 0) {
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
