import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ProposedAction } from "../lib/api";

const PRIORITY_STYLE: Record<string, string> = {
  high: "text-signal-red   border-red-900    bg-red-950",
  medium: "text-signal-amber border-amber-900  bg-amber-950",
  low: "text-signal-blue  border-blue-900   bg-blue-950",
};

const ActionCard = ({ a }: { a: ProposedAction }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-mono border uppercase ${PRIORITY_STYLE[a.priority]}`}
          >
            {a.priority}
          </span>
          <p className="text-sm font-semibold text-ink-100">{a.title}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-ink-400">Est. savings</div>
          <div className="font-display font-bold text-lg text-signal-green">
            ₹{a.estimated_savings_inr.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <p className="text-xs text-ink-400">{a.description}</p>

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-signal-blue hover:opacity-80 transition-opacity"
      >
        {open ? (
          <>
            <ChevronUp size={12} />
            <span>Hide</span>
          </>
        ) : (
          <>
            <ChevronDown size={12} />
            <span>Recommendation</span>
          </>
        )}
      </button>

      {open && (
        <div className="p-3 rounded-lg bg-ink-800 border border-ink-700 space-y-2">
          <p className="text-xs text-ink-200 leading-relaxed">
            {a.recommendation}
          </p>
          {a.affected_row_ids.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {a.affected_row_ids.slice(0, 6).map((id) => (
                <span
                  key={id}
                  className="citation border text-xs font-mono bg-ink-900 border-ink-700 text-ink-300"
                >
                  {id}
                </span>
              ))}

              {a.affected_row_ids.length > 6 && (
                <span className="text-xs text-ink-500">
                  +{a.affected_row_ids.length - 6} more
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionCard;
