import OpenAI from "openai";
import { executeTool } from "./tools.ts";
import { CHAT_TOOLS } from "./toolDef.ts";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an AI employee for a D2C (direct-to-consumer) brand. You have unified access to data from Shopify (orders/inventory), Shiprocket (shipments/logistics), and Google Sheets (expenses/ops).

## CITATION CONTRACT — NON-NEGOTIABLE

Every numerical claim MUST be followed by a citation in square brackets referencing the exact source row.

Examples:
- ₹1,850 [shopify:order:SHPFY-1001]
- ₹85 freight [shiprocket:shipment:SR-001]
- ₹12,500 ad spend [google_sheets:expense:row_2]

For aggregated figures, state which tool call produced them:
"Total revenue: ₹27,330 (sum of 10 Shopify orders from query_orders)"

NEVER state a number without a citation. If you cannot cite it, do not state it.

## TOOL RULES

1. Call get_overview first for any general / summary question.
2. For specific data, use the most targeted tool.
3. For margin/profit questions, use cross_analysis.
4. You may call multiple tools in sequence.

## PERSONA

You are analytical, direct, and India D2C-savvy. You understand RTO, COD dynamics, contribution margin, and Shiprocket courier selection. When you spot something concerning (high RTO rate, bad shipping-to-revenue ratio, low-stock SKUs), call it out proactively.`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  tool_calls: Array<{
    tool: string;
    input: Record<string, unknown>;
    result_summary: string;
  }>;
}

export async function chat(
  messages: ChatMessage[],
  merchantId: string,
): Promise<ChatResponse> {
  const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map(
      (m) =>
        ({
          role: m.role,
          content: m.content,
        }) as OpenAI.Chat.ChatCompletionMessageParam,
    ),
  ];

  const toolCallLog: ChatResponse["tool_calls"] = [];

  // Tool-use loop
  while (true) {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 4096,
      tools: CHAT_TOOLS,
      messages: apiMessages,
    });

    const choice = response.choices[0];
    const assistantMessage = choice?.message;

    if (!assistantMessage) {
      throw new Error("No assistant message returned");
    }

    // Push the assistant message into history
    apiMessages.push(assistantMessage);

    // Final response (No tool calls)
    if (
      !assistantMessage.tool_calls ||
      assistantMessage.tool_calls.length === 0
    ) {
      return {
        message: assistantMessage.content ?? "",
        tool_calls: toolCallLog,
      };
    }

    // Execute tool calls
    for (const tc of assistantMessage.tool_calls) {
      // Narrow to function tool calls only
      if (tc.type !== "function") {
        continue;
      }

      let input: Record<string, unknown> = {};

      try {
        input = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      } catch {
        throw new Error(`Invalid JSON arguments for tool: ${tc.function.name}`);
      }

      const result = await executeTool(tc.function.name, input, merchantId);
      const resultStr = JSON.stringify(result);

      const rows =
        typeof result === "object" &&
        result !== null &&
        "rows" in result &&
        Array.isArray((result as { rows?: unknown[] }).rows)
          ? (result as { rows: unknown[] }).rows.length
          : null;

      toolCallLog.push({
        tool: tc.function.name,
        input,
        result_summary:
          rows !== null ? `Returned ${rows} rows` : "Returned summary data",
      });

      // Push tool result back into message history
      apiMessages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: resultStr,
      });
    }
  }
}
