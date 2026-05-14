import { RotateCcw } from "lucide-react";
import type { ConnectorHealth } from "../lib/api";

const LABELS: Record<string, string> = {
  shopify: "Shopify",
  shiprocket: "Shiprocket",
  google_sheets: "Sheets",
};
const COLORS: Record<string, string> = {
  shopify: "text-emerald-400",
  shiprocket: "text-orange-400",
  google_sheets: "text-blue-400",
};

interface ConnectorStatusPropTypes {
  connectors: ConnectorHealth[];
  onIngest: () => void;
  ingesting: boolean;
  lastIngest?: string;
}

const ConnectorStatus = ({
  connectors,
  onIngest,
  ingesting,
  lastIngest,
}: ConnectorStatusPropTypes) => {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono text-ink-400 uppercase tracking-widest">
          Connectors
        </h3>

        <button
          onClick={onIngest}
          disabled={ingesting}
          className="btn-ghost text-xs flex items-center gap-1"
        >
          {ingesting ? (
            <>
              <span className="w-3 h-3 border border-ink-400 border-t-signal-green rounded-full animate-spin" />
              Syncing
            </>
          ) : (
            <>
              <span className="text-signal-green">
                <RotateCcw size={12} />
              </span>
              Sync
            </>
          )}
        </button>
      </div>

      <div className="space-y-2">
        {connectors.map((c) => (
          <div key={c.source} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full ${c.healthy ? "bg-signal-green" : "bg-signal-red"}`}
              />
              <span
                className={`text-sm font-mono ${COLORS[c.source] ?? "text-ink-200"}`}
              >
                {LABELS[c.source] ?? c.source}
              </span>
            </div>

            <span className="text-xs text-ink-500 font-mono">
              {c.latency_ms > 0 ? `${c.latency_ms}ms` : "mock"}
            </span>
          </div>
        ))}
      </div>

      {lastIngest && (
        <p className="text-xs text-ink-500 font-mono">
          Last sync{" "}
          {new Date(lastIngest).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
};

export default ConnectorStatus;
