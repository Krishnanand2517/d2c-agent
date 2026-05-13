import type {
  ConnectorHealth,
  IConnector,
  NormalizedRecord,
  SourceName,
} from "./base.ts";
import { RAW_SHIPMENTS } from "../mockData/shiprocket.ts";

export class ShiprocketConnector implements IConnector {
  readonly source: SourceName = "shiprocket";
  readonly merchantId: string;

  constructor(merchantId: string) {
    this.merchantId = merchantId;
  }

  async fetchOrders(): Promise<NormalizedRecord[]> {
    return []; // via Shopify orders
  }

  async fetchInventory(): Promise<NormalizedRecord[]> {
    return [];
  }

  async fetchShipments(): Promise<NormalizedRecord[]> {
    return RAW_SHIPMENTS.map((s) => {
      const totalShipping = s.freight_charge + s.cod_charges;

      return {
        merchantId: this.merchantId,
        entityType: "shipment" as const,
        source: "shiprocket" as const,
        sourceRecordId: s.id,
        title: `${s.awb_code} → ${s.delivery_city}`,
        status: s.current_status,
        amount: totalShipping,
        currency: "INR",
        timestamp: new Date(s.created_at),
        metadata: {
          channel_order_id: s.channel_order_id,
          awb_code: s.awb_code,
          courier_name: s.courier_name,
          pickup_city: s.pickup_city,
          delivery_city: s.delivery_city,
          weight_kg: s.weight,
          freight_charge: s.freight_charge,
          cod_charges: s.cod_charges,
          total_shipping_cost: totalShipping,
          is_rto: s.rto,
          delivered_date: s.delivered_date,
        },
        rawPayload: s as unknown as Record<string, unknown>,
      };
    });
  }

  async healthCheck(): Promise<ConnectorHealth> {
    return {
      source: "shiprocket",
      healthy: true,
      latency_ms: 18,
      last_checked: new Date().toISOString(),
    };
  }
}
