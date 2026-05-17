// Uses the same tools as the chat layer
// but runs goal-directed with no human in the loop.
//
// Flow:
//      system prompt with goal
//      LLM calls tools iteratively
//      LLM reasons over results
//      outputs structured ProposedAction[]

import OpenAI from "openai";
import { v4 as uuid } from "uuid";
import { executeTool } from "../chat/tools.ts";
import { saveAgentRun } from "../db/queries.ts";
import { CHAT_TOOLS } from "../chat/toolDef.ts";
import { computeSavings } from "./computeSavings.ts";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MAX_STEPS = 12;
const MAX_TOOL_CALLS = 30;

const AGENT_SYSTEM_PROMPT = `You are an autonomous cost-optimization agent for a D2C brand in India.
 
## YOUR GOAL
Analyse the merchant's unified data (Shopify orders, Shiprocket shipments, Google Sheets expenses) and identify the most impactful ₹-saving or ops-saving opportunities.
 
## HOW TO WORK
1. Start with get_overview to understand the business at a glance.
2. Drill into shipments, orders, and expenses using the available tools.
3. Look for: high shipping-cost-to-order-value ratios, elevated RTO rates by courier, expensive return processing, marketing spend with weak ROI signals, low-stock SKUs at risk of stockout.
4. Cross-reference across sources — the most valuable insights come from joining data (e.g. a courier that is both expensive AND has high RTO).
5. Call as many tools as you need. Be thorough.
 
## OUTPUT FORMAT
When you are done analysing, respond with a JSON object and nothing else.
 
IMPORTANT: Do NOT invent or estimate savings numbers. Set estimated_savings_inr to 0 for all actions.
Instead, populate affected_row_ids with the exact citation strings of every row that supports your finding.
The system will compute the actual savings from the row data.
 
{
  "summary": "one sentence summary of the overall situation",
  "reasoning": "2-4 sentences explaining what you found and why these actions matter",
  "proposed_actions": [
    {
      "type": "courier_optimization | rto_reduction | stockout_risk | marketing_efficiency | margin_alert",
      "priority": "high | medium | low",
      "estimated_savings_inr": 0,
      "affected_row_ids": ["exact citation strings from the tool results, e.g. [shiprocket:shipment:SR-001]"],
      "title": "short title",
      "description": "what you found with specific numbers and citations from the data",
      "recommendation": "concrete action the merchant should take",
      "savings_basis": "pct_freight_reduction | rto_cost_avoidance | stockout_lost_revenue | none"
    }
  ],
  "failure_modes": ["caveats or assumptions that could make this analysis wrong"]
}
 
Do not wrap the JSON in markdown. Output raw JSON only.`;

export interface AgentStep {
  step: number;
  name: string;
  description: string;
  data_points?: number;
  finding?: string;
}

export interface ProposedAction {
  type: string;
  priority: "high" | "medium" | "low";
  estimated_savings_inr: number;
  affected_row_ids: string[];
  title: string;
  description: string;
  recommendation: string;
}

export interface AgentRunLog {
  run_id: string;
  merchant_id: string;
  agent_name: string;
  triggered_at: string;
  completed_at: string;
  status: "completed" | "failed" | "no_action";
  rows_examined: number;
  steps: AgentStep[];
  proposed_actions: ProposedAction[];
  reasoning: string;
  summary: string;
  failure_modes: string[];
}

export interface LLMAction {
  type: string;
  priority: "high" | "medium" | "low";
  estimated_savings_inr: number;
  affected_row_ids: string[];
  title: string;
  description: string;
  recommendation: string;
  savings_basis:
    | "pct_freight_reduction"
    | "rto_cost_avoidance"
    | "stockout_lost_revenue"
    | "none";
}

interface LLMOutput {
  summary: string;
  reasoning: string;
  proposed_actions: LLMAction[];
  failure_modes: string[];
}

export async function runShippingCostAgent(
  merchantId: string,
): Promise<AgentRunLog> {
  const runId = uuid();
  const triggered_at = new Date().toISOString();
  const steps: AgentStep[] = [];
  let rowsExamined = 0;

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: AGENT_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyse merchant "${merchantId}" and produce your recommendations now.`,
      },
    ];

    // Tool-use loop
    let toolCallsUsed = 0;

    while (steps.length < MAX_STEPS && toolCallsUsed < MAX_TOOL_CALLS) {
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        max_completion_tokens: 4096,
        tools: CHAT_TOOLS,
        messages,
        // Force JSON output once the model stops calling tools
        ...(messages.some((m) => m.role === "tool") && {
          response_format: { type: "json_object" },
        }),
      });

      const choice = response.choices[0];
      const assistantMessage = choice?.message;

      if (!assistantMessage) {
        throw new Error("No assistant message returned");
      }

      messages.push(assistantMessage);

      // No tool calls. Model is done analysing, parse its JSON output
      if (
        !assistantMessage.tool_calls ||
        assistantMessage.tool_calls.length === 0
      ) {
        const raw = assistantMessage.content ?? "{}";

        let parsed: LLMOutput;
        try {
          parsed = JSON.parse(raw) as LLMOutput;
        } catch {
          throw new Error(`Agent returned invalid JSON: ${raw.slice(0, 200)}`);
        }

        // Compute savings deterministically for each action
        const proposed_actions: ProposedAction[] = await Promise.all(
          (parsed.proposed_actions ?? []).map(async (action) => ({
            type: action.type,
            priority: action.priority,
            estimated_savings_inr: await computeSavings(action, merchantId),
            affected_row_ids: action.affected_row_ids,
            title: action.title,
            description: action.description,
            recommendation: action.recommendation,
          })),
        );

        const log: AgentRunLog = {
          run_id: runId,
          merchant_id: merchantId,
          agent_name: "ShippingCostAgent",
          triggered_at,
          completed_at: new Date().toISOString(),
          status: proposed_actions.length > 0 ? "completed" : "no_action",
          rows_examined: rowsExamined,
          steps,
          proposed_actions,
          reasoning: parsed.reasoning ?? "",
          summary: parsed.summary ?? "No summary provided",
          failure_modes: parsed.failure_modes ?? [],
        };

        await saveAgentRun({
          merchantId,
          agentName: log.agent_name,
          status: log.status,
          rowsExamined: log.rows_examined,
          proposedActions: log.proposed_actions,
          reasoning: log.reasoning,
          steps: log.steps,
        });

        return log;
      }

      // Execute each tool call
      for (const tc of assistantMessage.tool_calls) {
        // Narrow to function tool calls only
        if (tc.type !== "function") {
          continue;
        }

        let input: Record<string, unknown> = {};
        toolCallsUsed++;

        try {
          input = JSON.parse(tc.function.arguments) as Record<string, unknown>;
        } catch {
          throw new Error(
            `Invalid JSON arguments for tool: ${tc.function.name}`,
          );
        }

        const result = await executeTool(tc.function.name, input, merchantId);

        // Count rows examined for observability
        const rows = (result as Record<string, unknown>).rows;
        if (Array.isArray(rows)) rowsExamined += rows.length;

        steps.push({
          step: steps.length + 1,
          name: tc.function.name,
          description: `Tool call: ${tc.function.name}`,
          data_points: Array.isArray(rows) ? rows.length : undefined,
          finding: `Input: ${JSON.stringify(input)}`,
        });

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
    }

    return {
      run_id: runId,
      merchant_id: merchantId,
      agent_name: "ShippingCostAgent",
      triggered_at,
      completed_at: new Date().toISOString(),
      status: "failed",
      rows_examined: rowsExamined,
      steps,
      proposed_actions: [],
      reasoning: "Agent stopped before producing a final structured response.",
      summary: "Run terminated before completion due to step/tool-call limits.",
      failure_modes: [
        steps.length >= MAX_STEPS
          ? `Exceeded max steps (${MAX_STEPS})`
          : `Exceeded max tool calls (${MAX_TOOL_CALLS})`,
      ],
    };
  } catch (err) {
    const error = String(err);

    await saveAgentRun({
      merchantId,
      agentName: "ShippingCostAgent",
      status: "failed",
      rowsExamined: 0,
      error,
      steps,
    });

    return {
      run_id: runId,
      merchant_id: merchantId,
      agent_name: "ShippingCostAgent",
      triggered_at,
      completed_at: new Date().toISOString(),
      status: "failed",
      rows_examined: 0,
      steps,
      proposed_actions: [],
      reasoning: `Agent failed: ${error}`,
      summary: `Run failed: ${error}`,
      failure_modes: [],
    };
  }
}
