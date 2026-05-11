// Sheet columns: Date | Category | Description | Amount (INR) | Notes | Channel

import type { IConnector, NormalizedRecord, SourceName } from "./base.js";
import { RAW_ROWS } from "../mockData/sheets.js";

export class GoogleSheetsConnector implements IConnector {
  readonly source: SourceName = "google_sheets";
  readonly merchantId: string;

  constructor(merchantId: string) {
    this.merchantId = merchantId;
  }

  async fetchOrders(): Promise<NormalizedRecord[]> {
    return [];
  }

  async fetchInventory(): Promise<NormalizedRecord[]> {
    return [];
  }

  async fetchShipments(): Promise<NormalizedRecord[]> {
    return [];
  }

  // Sheets is an expense/ops source
  async fetchExpenses(): Promise<NormalizedRecord[]> {
    return RAW_ROWS.map((r) => ({
      merchantId: this.merchantId,
      entityType: "expense" as const,
      source: "google_sheets" as const,
      sourceRecordId: `row_${r.row}`,
      title: r.description,
      status: "recorded",
      amount: r.amount,
      currency: "INR",
      timestamp: new Date(r.date),
      metadata: {
        category: r.category,
        description: r.description,
        channel: r.channel,
        notes: r.notes,
        row_number: r.row,
      },
      rawPayload: r as unknown as Record<string, unknown>,
    }));
  }
}
