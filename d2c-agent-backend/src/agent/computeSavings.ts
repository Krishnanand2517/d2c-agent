import { queryRecords } from "../db/queries";
import type { LLMAction } from "./shippingCostAgent";

export async function computeSavings(
  action: LLMAction,
  merchantId: string,
): Promise<number> {
  if (!action.affected_row_ids.length) return 0;

  // Parse citation strings: "[source:entityType:sourceRecordId]"
  const CITATION_RE = /\[(\w+):(\w+):([^\]]+)\]/;
  const sourceRecordIds = action.affected_row_ids
    .map((id) => CITATION_RE.exec(id)?.[3])
    .filter((id): id is string => !!id);

  if (!sourceRecordIds.length) return 0;

  switch (action.savings_basis) {
    case "pct_freight_reduction": {
      // How much freight exceeds 10% of order value?
      const shipments = await queryRecords({
        merchantId,
        source: "shiprocket",
        entityType: "shipment",
        limit: 500,
      });
      const orders = await queryRecords({
        merchantId,
        source: "shopify",
        entityType: "order",
        limit: 500,
      });
      const orderIndex = new Map(orders.map((o) => [o.sourceRecordId, o]));

      const affected = shipments.filter((s) =>
        sourceRecordIds.includes(s.sourceRecordId),
      );
      return Math.round(
        affected.reduce((sum, s) => {
          const meta = s.metadata as Record<string, unknown>;
          const freight = (meta.freight_charge as number) ?? 0;
          const order = orderIndex.get(meta.channel_order_id as string);
          const target = (order?.amount ?? 0) * 0.1;
          return sum + Math.max(0, freight - target);
        }, 0),
      );
    }

    case "rto_cost_avoidance": {
      // Sum the return processing expenses linked to RTO shipments
      const expenses = await queryRecords({
        merchantId,
        source: "google_sheets",
        entityType: "expense",
        limit: 500,
      });
      const returnExpenses = expenses.filter(
        (e) => (e.metadata as Record<string, unknown>).category === "Returns",
      );

      // ~40% of return costs are avoidable with better COD/zone policies
      const totalReturnCost = returnExpenses.reduce(
        (s, e) => s + (e.amount ?? 0),
        0,
      );
      return Math.round(totalReturnCost * 0.4);
    }

    case "stockout_lost_revenue": {
      // Fetch affected inventory rows and estimate 2 weeks of lost sales
      const inventory = await queryRecords({
        merchantId,
        source: "shopify",
        entityType: "inventory",
        limit: 500,
      });
      const affected = inventory.filter((i) =>
        sourceRecordIds.includes(i.sourceRecordId),
      );
      return Math.round(
        affected.reduce((sum, i) => {
          const meta = i.metadata as Record<string, unknown>;
          const price = i.amount ?? 0;
          const weeklySalesEstimate = 3; // 3 units/week for low-stock SKUs
          return sum + price * weeklySalesEstimate * 2;
        }, 0),
      );
    }

    default:
      return 0;
  }
}
