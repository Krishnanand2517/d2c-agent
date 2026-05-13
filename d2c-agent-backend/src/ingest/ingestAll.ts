import { getConnectors } from "../connectors/registry.ts";
import { upsertRecords } from "../db/queries.ts";
import { prisma } from "../db/client.ts";

export interface IngestResult {
  merchantId: string;
  sources: Array<{
    source: string;
    rows: number;
    duration_ms: number;
    error?: string;
  }>;
  total_rows: number;
  started_at: string;
  completed_at: string;
}

export async function ingestAll(merchantId: string): Promise<IngestResult> {
  const started_at = new Date().toISOString();
  const result: IngestResult = {
    merchantId,
    sources: [],
    total_rows: 0,
    started_at,
    completed_at: "",
  };
  const connectors = getConnectors(merchantId);

  async function run(name: string, fetcher: () => Promise<unknown[]>) {
    const t0 = Date.now();
    const ingestRun = await prisma.ingestRun.create({
      data: { merchantId, source: name },
    });

    try {
      const records = await fetcher();
      const upserted = await upsertRecords(
        records as Parameters<typeof upsertRecords>[0],
      );

      await prisma.ingestRun.update({
        where: { id: ingestRun.id },
        data: { completedAt: new Date(), rowsUpserted: upserted },
      });

      result.sources.push({
        source: name,
        rows: upserted,
        duration_ms: Date.now() - t0,
      });
      result.total_rows += upserted;
    } catch (err) {
      const error = String(err);

      await prisma.ingestRun.update({
        where: { id: ingestRun.id },
        data: { completedAt: new Date(), error },
      });

      result.sources.push({
        source: name,
        rows: 0,
        duration_ms: Date.now() - t0,
        error,
      });
      console.error(`[ingest] ${name} failed:`, error);
    }
  }

  await Promise.allSettled([
    run("shopify_orders", () => connectors.shopify.fetchOrders()),
    run("shopify_inventory", () => connectors.shopify.fetchInventory()),
    run("shiprocket_shipments", () => connectors.shiprocket.fetchShipments()),
    run("sheets_expenses", () => connectors.sheets.fetchExpenses()),
  ]);

  result.completed_at = new Date().toISOString();
  console.log(
    `[ingest] merchant=${merchantId} total=${result.total_rows} rows`,
  );

  return result;
}
