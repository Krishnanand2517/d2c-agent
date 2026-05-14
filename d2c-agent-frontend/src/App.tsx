import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  api,
  type HealthResponse,
  type StatsResponse,
  type UniversalRecord,
} from "./lib/api";
import StatsOverview from "./components/StatsOverview";
import ConnectorStatus from "./components/ConnectorStatus";
import DataExplorer from "./components/DataExplorer";
import ChatWindow from "./components/ChatWindow";
import AgentPanel from "./components/AgentPanel";
import { Bot, Grid, MessageSquare } from "lucide-react";

type Tab = "chat" | "agent" | "data";

const App = () => {
  const [tab, setTab] = useState<Tab>("chat");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [orders, setOrders] = useState<UniversalRecord[]>([]);
  const [shipments, setShipments] = useState<UniversalRecord[]>([]);
  const [expenses, setExpenses] = useState<UniversalRecord[]>([]);
  const [ingesting, setIngesting] = useState(false);

  const refresh = useCallback(async () => {
    const [h, s, o, sh, ex] = await Promise.allSettled([
      api.health(),
      api.stats(),
      api.orders(),
      api.shipments(),
      api.expenses(),
    ]);

    if (h.status === "fulfilled") setHealth(h.value);
    if (s.status === "fulfilled") setStats(s.value);
    if (o.status === "fulfilled") setOrders(o.value);
    if (sh.status === "fulfilled") setShipments(sh.value);
    if (ex.status === "fulfilled") setExpenses(ex.value);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleIngest = async () => {
    setIngesting(true);
    try {
      await api.ingest();
      await refresh();
    } finally {
      setIngesting(false);
    }
  };

  const tabs: Array<{ key: Tab; label: string; icon: ReactNode }> = [
    { key: "chat", label: "Chat", icon: <MessageSquare size={12} /> },
    { key: "agent", label: "Agent", icon: <Bot size={12} /> },
    { key: "data", label: "Data", icon: <Grid size={12} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-ink-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-signal-green to-signal-blue flex items-center justify-center text-ink-950 font-display font-bold text-sm">
            AI
          </div>
          <span className="font-display font-bold text-ink-100">D2C Agent</span>
          <span className="text-xs text-ink-500 font-mono">merchant_001</span>
        </div>

        <div className="flex items-center gap-2">
          {health?.connectors.map((c) => (
            <span
              key={c.source}
              title={c.source}
              className={`w-1.5 h-1.5 rounded-full ${c.healthy ? "bg-signal-green" : "bg-signal-red"}`}
            />
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-ink-800 flex flex-col gap-4 p-4 overflow-y-auto">
          <StatsOverview stats={stats} />

          <ConnectorStatus
            connectors={health?.connectors ?? []}
            onIngest={handleIngest}
            ingesting={ingesting}
            lastIngest={stats?.lastIngest?.[0]?.startedAt}
          />
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="border-b border-ink-800 px-4 flex gap-1 pt-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  tab === t.key
                    ? "bg-ink-900 text-ink-100 border border-b-0 border-ink-700"
                    : "text-ink-400 hover:text-ink-200"
                }`}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {tab === "chat" && <ChatWindow />}
            {tab === "agent" && (
              <div className="h-full overflow-y-auto p-6">
                <AgentPanel />
              </div>
            )}
            {tab === "data" && (
              <div className="h-full overflow-y-auto p-6">
                <DataExplorer
                  orders={orders}
                  shipments={shipments}
                  expenses={expenses}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
