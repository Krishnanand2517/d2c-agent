import type OpenAI from "openai";

export const CHAT_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_overview",
      description:
        "High-level stats: total orders, revenue, shipping spend, expense breakdown. Always call this first for any summary question.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "query_orders",
      description:
        "Fetch Shopify orders from the unified store. Returns rows with citation IDs. Use for order counts, revenue, fulfillment status, and customer data.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "e.g. fulfilled, unfulfilled, cancelled",
          },
          date_from: {
            type: "string",
            description: "ISO date string e.g. 2026-05-01",
          },
          date_to: {
            type: "string",
            description: "ISO date string e.g. 2026-05-30",
          },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_shipments",
      description:
        "Fetch Shiprocket shipments. Use for shipping costs, courier breakdown, RTO analysis, delivery status.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "e.g. Delivered, RTO Initiated, In Transit",
          },
          date_from: { type: "string" },
          date_to: { type: "string" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_expenses",
      description:
        "Fetch ops/expense data from Google Sheets. Covers marketing spend, return costs, COGS, warehouse fees.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "e.g. Marketing, Returns, COGS, Operations",
          },
          date_from: { type: "string" },
          date_to: { type: "string" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cross_analysis",
      description:
        'Joins Shopify revenue + Shiprocket shipping + Sheets expenses to compute contribution margin. Use for "how much did we actually make" questions.',
      parameters: {
        type: "object",
        properties: {
          date_from: { type: "string" },
          date_to: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_agent_runs",
      description:
        "Retrieve AI agent run logs and recommendations. Use when asked about savings opportunities, courier recommendations, or agent findings.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number" },
        },
      },
    },
  },
];
