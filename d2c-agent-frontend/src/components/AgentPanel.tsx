import { Play } from "lucide-react";
import type { AgentRunLog } from "../lib/api";
import RunCard from "./RunCard";

interface AgentPanelPropTypes {
  runs: AgentRunLog[];
  onRunAgent: () => void;
  running: boolean;
}

const AgentPanel = ({ runs, onRunAgent, running }: AgentPanelPropTypes) => {
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display font-bold text-xl">
            Shipping Cost Agent
          </h2>
          <p className="text-sm text-ink-400 mt-0.5">
            Watches Shiprocket + Shopify data. Flags cost anomalies.
          </p>
        </div>
        <button
          onClick={onRunAgent}
          disabled={running}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          {running ? (
            <>
              <span className="w-3 h-3 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
              Running…
            </>
          ) : (
            <>
              <Play size={12} /> Run Agent
            </>
          )}
        </button>
      </div>

      <div className="card p-4 text-xs text-ink-500 leading-relaxed">
        Autonomously analyses your Shopify, Shiprocket, and Sheets data using
        AI. Decides which data to pull, spots cross-source patterns, and
        proposes cost-saving actions.
      </div>

      {runs.length === 0 ? (
        <p className="text-center text-ink-500 text-sm py-12">
          No runs yet. Click "Run Agent" to start.
        </p>
      ) : (
        <div className="space-y-3">
          {runs.map((r) => (
            <RunCard key={r.run_id} run={r} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentPanel;
