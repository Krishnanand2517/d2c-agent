import "dotenv/config";
import express from "express";
import cors from "cors";

import routes from "./api/routes.ts";
import { prisma } from "./db/client.ts";
import { ingestAll } from "./ingest/ingestAll.ts";

const app = express();
const PORT = process.env.PORT || 3001;
const MERCHANT_ID = process.env.MERCHANT_ID ?? "merchant_001";

app.use(
  cors({
    origin: ["http://localhost:5173", "https://d2c-agent-blush.vercel.app"],
  }),
);
app.use(express.json());
app.use("/api", routes);

async function start() {
  // Verify DB connection
  await prisma.$connect();
  console.log("[server] Database connected");

  // Seeding on startup
  console.log("[server] Running initial ingest...");
  const result = await ingestAll(MERCHANT_ID);
  console.log(`[server] Ingest complete: ${result.total_rows} rows`);

  app.listen(PORT, () => {
    console.log(`[server] running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("[server] Fatal:", err);
  process.exit(1);
});
