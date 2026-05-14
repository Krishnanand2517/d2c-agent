import { useState } from "react";
import type { UniversalRecord } from "../lib/api";
import Row from "./DataRow";

type TabKey = "orders" | "shipments" | "expenses";
interface DataExplorerPropTypes {
  orders: UniversalRecord[];
  shipments: UniversalRecord[];
  expenses: UniversalRecord[];
}

const DataExplorer = ({
  orders,
  shipments,
  expenses,
}: DataExplorerPropTypes) => {
  const [tab, setTab] = useState<TabKey>("orders");
  const [search, setSearch] = useState("");

  const allRows: Record<TabKey, UniversalRecord[]> = {
    orders,
    shipments,
    expenses,
  };
  const rows = allRows[tab].filter(
    (r) =>
      !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase()),
  );

  const tabs: Array<{
    key: TabKey;
    label: string;
    count: number;
    color: string;
  }> = [
    {
      key: "orders",
      label: "Orders",
      count: orders.length,
      color: "text-emerald-400",
    },
    {
      key: "shipments",
      label: "Shipments",
      count: shipments.length,
      color: "text-orange-400",
    },
    {
      key: "expenses",
      label: "Expenses",
      count: expenses.length,
      color: "text-blue-400",
    },
  ];

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl">Data Explorer</h2>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="px-3 py-1.5 rounded-lg bg-ink-900 border border-ink-700 text-xs text-ink-200 placeholder-ink-500 focus:outline-none focus:border-ink-500 font-mono w-44"
        />
      </div>

      <div className="flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              tab === t.key
                ? "bg-ink-700 border border-ink-600 text-ink-100"
                : "text-ink-400 hover:text-ink-200"
            }`}
          >
            {t.label}{" "}
            <span className={tab === t.key ? t.color : "text-ink-600"}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-130">
          <table className="w-full text-left">
            <thead className="bg-ink-800 sticky top-0 z-10">
              <tr>
                {[
                  "Source",
                  "Type",
                  "Citation ID",
                  "Amount",
                  "Status",
                  "Date",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-xs font-mono text-ink-400 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-10 text-ink-500 text-sm"
                  >
                    No rows found
                  </td>
                </tr>
              ) : (
                rows.map((r) => <Row key={r.id} r={r} />)
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-ink-500">
        Click any row to inspect normalized metadata and raw payload. Citation
        ID is the provenance key.
      </p>
    </div>
  );
};

export default DataExplorer;
