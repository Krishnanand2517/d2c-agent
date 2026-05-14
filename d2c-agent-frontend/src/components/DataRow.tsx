import { useState } from "react";
import type { UniversalRecord } from "../lib/api";

const BADGE: Record<string, string> = {
  shopify: "badge-shopify",
  shiprocket: "badge-shiprocket",
  google_sheets: "badge-sheets",
};

const STATUS_COLOR = (s: string | null) => {
  if (!s) return "text-ink-400";

  const l = s.toLowerCase();
  if (
    l.includes("fulfilled") ||
    l.includes("delivered") ||
    l.includes("recorded")
  )
    return "text-signal-green";
  if (l.includes("rto") || l.includes("cancel") || l.includes("refund"))
    return "text-signal-red";
  return "text-signal-amber";
};

const Row = ({ r }: { r: UniversalRecord }) => {
  const [open, setOpen] = useState(false);
  const citation = `[${r.source}:${r.entityType}:${r.sourceRecordId}]`;

  return (
    <>
      <tr
        onClick={() => setOpen(!open)}
        className="border-b border-ink-800 hover:bg-ink-800/40 cursor-pointer transition-colors"
      >
        <td className="px-3 py-2">
          <span className={BADGE[r.source]}>{r.source}</span>
        </td>
        <td className="px-3 py-2 text-xs font-mono text-ink-400">
          {r.entityType}
        </td>
        <td className="px-3 py-2 text-xs font-mono text-signal-blue">
          {citation}
        </td>
        <td className="px-3 py-2 text-sm font-mono text-signal-green text-right">
          {r.amount != null ? `₹${r.amount.toLocaleString("en-IN")}` : "—"}
        </td>
        <td className={`px-3 py-2 text-xs font-mono ${STATUS_COLOR(r.status)}`}>
          {r.status ?? "—"}
        </td>
        <td className="px-3 py-2 text-xs text-ink-400 font-mono">
          {r.timestamp
            ? new Date(r.timestamp).toLocaleDateString("en-IN")
            : "—"}
        </td>
      </tr>

      {open && (
        <tr className="bg-ink-950 border-b border-ink-800">
          <td colSpan={6} className="px-4 py-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-mono text-ink-400 uppercase tracking-wide mb-1">
                  Normalized metadata
                </p>
                <pre className="text-xs text-ink-300 bg-ink-900 rounded-lg p-3 overflow-x-auto max-h-40 font-mono">
                  {JSON.stringify(r.metadata, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-xs font-mono text-ink-400 uppercase tracking-wide mb-1">
                  Raw payload (provenance)
                </p>
                <pre className="text-xs text-ink-500 bg-ink-900 rounded-lg p-3 overflow-x-auto max-h-40 font-mono">
                  {JSON.stringify(r.rawPayload, null, 2)}
                </pre>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default Row;
