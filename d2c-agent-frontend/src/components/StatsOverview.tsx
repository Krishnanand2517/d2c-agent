import type { StatsResponse } from "../lib/api";

const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

interface StatsOverviewPropTypes {
  stats: StatsResponse | null;
}

const StatsOverview = ({ stats }: StatsOverviewPropTypes) => {
  if (!stats)
    return (
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card h-16 animate-pulse bg-ink-800" />
        ))}
      </div>
    );

  const revenue = stats.totals
    .filter((t) => t.source === "shopify" && t.entityType === "order")
    .reduce((s, t) => s + (t._sum.amount ?? 0), 0);
  const shipping = stats.totals
    .filter((t) => t.source === "shiprocket")
    .reduce((s, t) => s + (t._sum.amount ?? 0), 0);
  const expenses = stats.totals
    .filter((t) => t.source === "google_sheets")
    .reduce((s, t) => s + (t._sum.amount ?? 0), 0);
  const ordersCnt = stats.totals
    .filter((t) => t.entityType === "order")
    .reduce((s, t) => s + t._count.id, 0);

  const cards = [
    {
      label: "Revenue",
      value: INR(revenue),
      sub: `${ordersCnt} orders`,
      color: "text-signal-green",
    },
    {
      label: "Shipping",
      value: INR(shipping),
      sub: "freight spend",
      color: "text-signal-amber",
    },
    {
      label: "Expenses",
      value: INR(expenses),
      sub: "ops + marketing",
      color: "text-signal-blue",
    },
    {
      label: "Net est.",
      value: INR(revenue - shipping - expenses),
      sub: "rough margin",
      color:
        revenue - shipping - expenses >= 0
          ? "text-signal-green"
          : "text-signal-red",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((c) => (
        <div key={c.label} className="card p-3">
          <div className="text-xs text-ink-400 font-mono">{c.label}</div>
          <div className={`font-mono font-bold text-base mt-0.5 ${c.color}`}>
            {c.value}
          </div>
          <div className="text-xs text-ink-500 mt-0.5">{c.sub}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;
