import { Router, type Request, type Response } from "express";

import { ingestAll } from "../ingest/ingestAll.js";
import { queryRecords, getStats, getAgentRuns } from "../db/queries.js";
import { getConnectors } from "../connectors/registry.js";

const router = Router();
const MERCHANT_ID = process.env.MERCHANT_ID ?? "merchant_001";

router.get("/health", async (_req: Request, res: Response) => {
  const c = getConnectors(MERCHANT_ID);

  const checks = await Promise.all([
    c.shopify.healthCheck(),
    c.shiprocket.healthCheck(),
    c.sheets.healthCheck(),
  ]);

  res.json({ status: "ok", connectors: checks, merchant_id: MERCHANT_ID });
});

router.post("/ingest", async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, result: await ingestAll(MERCHANT_ID) });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.get("/stats", async (_req: Request, res: Response) => {
  res.json(await getStats(MERCHANT_ID));
});

router.get("/orders", async (req: Request, res: Response) => {
  res.json(
    await queryRecords({
      merchantId: MERCHANT_ID,
      entityType: "order",
      limit: parseInt(req.query.limit as string) || 100,
    }),
  );
});

router.get("/shipments", async (_req: Request, res: Response) => {
  res.json(
    await queryRecords({
      merchantId: MERCHANT_ID,
      source: "shiprocket",
      entityType: "shipment",
      limit: 100,
    }),
  );
});

router.get("/expenses", async (_req: Request, res: Response) => {
  res.json(
    await queryRecords({
      merchantId: MERCHANT_ID,
      source: "google_sheets",
      entityType: "expense",
      limit: 100,
    }),
  );
});

router.get("/agent/runs", async (_req: Request, res: Response) => {
  res.json(await getAgentRuns(MERCHANT_ID, 10));
});

export default router;
