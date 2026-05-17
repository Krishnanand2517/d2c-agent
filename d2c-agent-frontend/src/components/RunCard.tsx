import { useState } from "react";
import { Circle, Dot, TriangleAlert, X } from "lucide-react";
import type { AgentRunLog } from "../lib/api";
import ActionCard from "./ActionCard";

const STATUS_COLOR: Record<string, string> = {
  completed: "text-signal-green",
  failed: "text-signal-red",
  no_action: "text-ink-400",
};

const RunCard = ({ run }: { run: AgentRunLog }) => {
  const [open, setOpen] = useState(false);
  const totalSavings =
    run.proposed_actions?.reduce((s, a) => s + a.estimated_savings_inr, 0) ?? 0;

  return (
    <div className="card overflow-hidden">
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span
            className={`text-sm font-mono font-semibold ${STATUS_COLOR[run.status]}`}
          >
            {run.status === "completed" ? (
              <Dot size={12} />
            ) : run.status === "failed" ? (
              <X size={12} />
            ) : (
              <Circle size={8} />
            )}{" "}
            {run.agent_name}
          </span>
          <span className="text-xs text-ink-400 font-mono">
            {new Date(run.triggered_at).toLocaleString("en-IN")}
          </span>
        </div>

        <p className="text-sm text-ink-200">{run.summary}</p>
        {totalSavings > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-xs">
            <span className="text-signal-green font-mono font-bold">
              ₹{totalSavings.toLocaleString("en-IN")}
            </span>
            <span className="text-emerald-600">potential savings</span>
          </span>
        )}

        <div className="flex items-center gap-3 text-xs text-ink-400">
          <span>{run.rows_examined} rows</span>
          <span>
            <Dot size={12} />
          </span>
          <span>{run.proposed_actions?.length ?? 0} actions</span>
          <button
            onClick={() => setOpen(!open)}
            className="ml-auto text-signal-blue hover:opacity-80"
          >
            {open ? "Hide" : "Details"}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-800 p-4 space-y-4">
          {/* Steps */}
          <div>
            <h4 className="text-xs font-mono text-ink-400 uppercase tracking-widest mb-2">
              Run Steps
            </h4>
            <div className="space-y-1.5">
              {run.steps?.map((s) => (
                <div key={s.step} className="flex gap-2 text-xs">
                  <span className="w-5 h-5 rounded bg-ink-800 text-ink-400 font-mono flex items-center justify-center shrink-0">
                    {s.step}
                  </span>
                  <span className="font-mono text-ink-200">{s.name}</span>
                  {s.finding && (
                    <span className="text-ink-400">— {s.finding}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {run.proposed_actions?.length > 0 && (
            <div>
              <h4 className="text-xs font-mono text-ink-400 uppercase tracking-widest mb-2">
                Proposed Actions
              </h4>
              <div className="space-y-2">
                {run.proposed_actions.map((a, i) => (
                  <ActionCard key={i} a={a} />
                ))}
              </div>
            </div>
          )}

          {/* Failure modes */}
          {run.failure_modes?.length > 0 && (
            <div>
              <h4 className="text-xs font-mono text-ink-400 uppercase tracking-widest mb-2">
                Known Failure Modes
              </h4>
              <ul className="space-y-1">
                {run.failure_modes.map((fm, i) => (
                  <li key={i} className="flex gap-2 text-xs text-ink-400">
                    <span className="text-signal-amber shrink-0">
                      <TriangleAlert size={12} />
                    </span>
                    {fm}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reasoning */}
          <div className="p-3 rounded-lg bg-ink-800 border border-ink-700">
            <h4 className="text-xs font-mono text-ink-400 uppercase tracking-widest mb-1">
              Reasoning
            </h4>
            <p className="text-xs text-ink-300 leading-relaxed">
              {run.reasoning}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunCard;
