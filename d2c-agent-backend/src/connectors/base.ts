export type SourceName = "shopify" | "shiprocket" | "google_sheets";
export type EntityType =
  | "order"
  | "shipment"
  | "inventory"
  | "expense"
  | "return";

export interface NormalizedRecord {
  merchantId: string;
  entityType: EntityType;
  source: SourceName;
  sourceRecordId: string;
  title?: string;
  status?: string;
  amount?: number;
  currency?: string;
  timestamp?: Date;
  metadata: Record<string, unknown>;
  rawPayload: Record<string, unknown>;
}

export interface ConnectorHealth {
  source: SourceName;
  healthy: boolean;
  latency_ms: number;
  error?: string;
  last_checked: string;
}

export interface IConnector {
  readonly source: SourceName;
  readonly merchantId: string;

  fetchOrders(): Promise<NormalizedRecord[]>;
  fetchInventory(): Promise<NormalizedRecord[]>;
  fetchShipments(): Promise<NormalizedRecord[]>;
  healthCheck(): Promise<ConnectorHealth>;
}
