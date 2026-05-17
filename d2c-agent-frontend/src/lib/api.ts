// UNIVERSAL NORMALIZED MODEL
export interface UniversalRecord {
  id: string;
  merchantId: string;
  entityType: string;
  source: string;
  sourceRecordId: string;
  title: string | null;
  status: string | null;
  amount: number | null;
  currency: string | null;
  timestamp: string | null;
  metadata: Record<string, unknown>;
  rawPayload: Record<string, unknown>;
  createdAt: string;
}

// HEALTH
export interface ConnectorHealth {
  source: string;
  healthy: boolean;
  latency_ms: number;
  error?: string;
  last_checked: string;
}

export interface HealthResponse {
  status: string;
  connectors: ConnectorHealth[];
  merchant_id: string;
}

// STATS
export interface StatsResponse {
  totals: Array<{
    source: string;
    entityType: string;
    _count: { id: number };
    _sum: { amount: number | null };
  }>;
  lastIngest: Array<{
    source: string;
    startedAt: string;
    rowsUpserted: number;
  }>;
}

// INGESTION
export interface IngestResult {
  merchantId: string;
  total_rows: number;
  started_at: string;
  completed_at: string;
  sources: Array<{
    source: string;
    rows: number;
    duration_ms: number;
    error?: string;
  }>;
}

// CHAT
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

// AGENT LOG
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
  steps: Array<{
    step: number;
    name: string;
    description: string;
    data_points?: number;
    finding?: string;
  }>;
  proposed_actions: ProposedAction[];
  reasoning: string;
  summary: string;
  failure_modes: string[];
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  health: () => apiFetch<HealthResponse>("/health"),
  stats: () => apiFetch<StatsResponse>("/stats"),
  ingest: () => apiFetch<IngestResult>("/ingest", { method: "POST" }),
  orders: () => apiFetch<UniversalRecord[]>("/orders"),
  shipments: () => apiFetch<UniversalRecord[]>("/shipments"),
  expenses: () => apiFetch<UniversalRecord[]>("/expenses"),
  chat: (messages: ChatMessage[]) =>
    apiFetch<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    }),
  runAgent: () => apiFetch<AgentRunLog>("/agent/run", { method: "POST" }),
  agentRuns: () => apiFetch<AgentRunLog[]>("/agent/runs"),
};
