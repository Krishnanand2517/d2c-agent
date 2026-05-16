import { getAgentRuns, getStats, queryRecords } from "../db/queries.ts";

function citationId(r: {
  source: string;
  entityType: string;
  sourceRecordId: string;
}) {
  return `[${r.source}:${r.entityType}:${r.sourceRecordId}]`;
}

function toRow(r: Awaited<ReturnType<typeof queryRecords>>[0]) {
  return {
    id: r.id,
    citation: citationId(r),
    source: r.source,
    entityType: r.entityType,
    sourceRecordId: r.sourceRecordId,
    title: r.title,
    status: r.status,
    amount_inr: r.amount,
    timestamp: r.timestamp,
    metadata: r.metadata,
  };
}

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  merchantId: string,
): Promise<unknown> {
  switch (toolName) {
    case "get_overview": {
      const stats = await getStats(merchantId);
      const [orders, shipments, expenses] = await Promise.all([
        queryRecords({ merchantId, entityType: "order", limit: 500 }),
        queryRecords({
          merchantId,
          source: "shiprocket",
          entityType: "shipment",
          limit: 500,
        }),
        queryRecords({
          merchantId,
          source: "google_sheets",
          entityType: "expense",
          limit: 500,
        }),
      ]);

      const revenue = orders.reduce((s, o) => s + (o.amount ?? 0), 0);
      const shippingSpend = shipments.reduce(
        (s, sh) => s + (sh.amount ?? 0),
        0,
      );

      const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
        const cat =
          ((e.metadata as Record<string, unknown>).category as string) ??
          "Other";
        acc[cat] = (acc[cat] ?? 0) + (e.amount ?? 0);
        return acc;
      }, {});

      return {
        total_shopify_orders: orders.length,
        total_shipments: shipments.length,
        total_expense_rows: expenses.length,
        total_revenue_inr: Math.round(revenue),
        total_shipping_spend_inr: Math.round(shippingSpend),
        shipping_pct_of_revenue:
          revenue > 0
            ? `${((shippingSpend / revenue) * 100).toFixed(1)}%`
            : "N/A",
        expenses_by_category: byCategory,
        db_stats: stats.totals,
        last_ingest: stats.lastIngest,
        citation_note:
          "These are aggregated totals. For citable line items call query_orders / query_shipments / query_expenses.",
      };
    }

    case "query_orders": {
      const rows = await queryRecords({
        merchantId,
        entityType: "order",
        status: input.status as string | undefined,
        dateFrom: input.date_from as string | undefined,
        dateTo: input.date_to as string | undefined,
        limit: (input.limit as number) ?? 50,
      });

      return {
        count: rows.length,
        rows: rows.map(toRow),
        citation_note:
          "Every number you state from these rows MUST reference its citation field, e.g. ₹1850 [shopify:order:SHPFY-1001]",
      };
    }

    case "query_shipments": {
      const rows = await queryRecords({
        merchantId,
        source: "shiprocket",
        entityType: "shipment",
        status: input.status as string | undefined,
        dateFrom: input.date_from as string | undefined,
        dateTo: input.date_to as string | undefined,
        limit: (input.limit as number) ?? 50,
      });

      return {
        count: rows.length,
        rows: rows.map(toRow),
        citation_note:
          "Cite every freight amount, e.g. ₹85 [shiprocket:shipment:SR-001]",
      };
    }

    case "query_expenses": {
      let rows = await queryRecords({
        merchantId,
        source: "google_sheets",
        entityType: "expense",
        dateFrom: input.date_from as string | undefined,
        dateTo: input.date_to as string | undefined,
        limit: (input.limit as number) ?? 100,
      });

      if (input.category) {
        rows = rows.filter(
          (r) =>
            (
              (r.metadata as Record<string, unknown>).category as string
            )?.toLowerCase() === (input.category as string).toLowerCase(),
        );
      }

      return {
        count: rows.length,
        rows: rows.map(toRow),
        citation_note:
          "Cite every expense amount, e.g. ₹12500 [google_sheets:expense:row_2]",
      };
    }

    case "cross_analysis": {
      const [orders, shipments, expenses] = await Promise.all([
        queryRecords({
          merchantId,
          source: "shopify",
          entityType: "order",
          dateFrom: input.date_from as string,
          dateTo: input.date_to as string,
          limit: 500,
        }),
        queryRecords({
          merchantId,
          source: "shiprocket",
          entityType: "shipment",
          dateFrom: input.date_from as string,
          dateTo: input.date_to as string,
          limit: 500,
        }),
        queryRecords({
          merchantId,
          source: "google_sheets",
          entityType: "expense",
          dateFrom: input.date_from as string,
          dateTo: input.date_to as string,
          limit: 500,
        }),
      ]);

      const revenue = orders.reduce((s, o) => s + (o.amount ?? 0), 0);
      const shipping = shipments.reduce((s, sh) => s + (sh.amount ?? 0), 0);

      const marketing = expenses
        .filter(
          (e) =>
            (e.metadata as Record<string, unknown>).category === "Marketing",
        )
        .reduce((s, e) => s + (e.amount ?? 0), 0);
      const returns = expenses
        .filter(
          (e) => (e.metadata as Record<string, unknown>).category === "Returns",
        )
        .reduce((s, e) => s + (e.amount ?? 0), 0);
      const cogs = expenses
        .filter(
          (e) => (e.metadata as Record<string, unknown>).category === "COGS",
        )
        .reduce((s, e) => s + (e.amount ?? 0), 0);
      const operations = expenses
        .filter(
          (e) =>
            (e.metadata as Record<string, unknown>).category === "Operations",
        )
        .reduce((s, e) => s + (e.amount ?? 0), 0);

      const totalCosts = shipping + marketing + returns + cogs + operations;
      const net = revenue - totalCosts;

      return {
        period: {
          from: input.date_from ?? "all time",
          to: input.date_to ?? "now",
        },
        revenue_inr: Math.round(revenue),
        costs: {
          shipping_inr: Math.round(shipping),
          marketing_inr: Math.round(marketing),
          returns_inr: Math.round(returns),
          cogs_inr: Math.round(cogs),
          operations_inr: Math.round(operations),
          total_inr: Math.round(totalCosts),
        },
        net_margin_inr: Math.round(net),
        net_margin_pct:
          revenue > 0 ? `${((net / revenue) * 100).toFixed(1)}%` : "N/A",
        row_counts: {
          orders: orders.length,
          shipments: shipments.length,
          expenses: expenses.length,
        },
        sample_citations: {
          orders: orders.slice(0, 3).map(citationId),
          shipments: shipments.slice(0, 3).map(citationId),
          expenses: expenses.slice(0, 3).map(citationId),
        },
        citation_note:
          "Aggregate numbers. For line-item citations use query_orders / query_shipments / query_expenses with the same date range.",
      };
    }

    case "get_agent_runs": {
      const runs = await getAgentRuns(merchantId, (input.limit as number) ?? 5);

      return { count: runs.length, runs };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
