import type { IConnector, NormalizedRecord, SourceName } from "./base.js";
import { RAW_ORDERS, RAW_PRODUCTS } from "../mockData/shopify.js";

export class ShopifyConnector implements IConnector {
  readonly source: SourceName = "shopify";
  readonly merchantId: string;

  constructor(merchantId: string) {
    this.merchantId = merchantId;
  }

  async fetchOrders(): Promise<NormalizedRecord[]> {
    return RAW_ORDERS.map((o) => ({
      merchantId: this.merchantId,
      entityType: "order" as const,
      source: "shopify" as const,
      sourceRecordId: o.id,
      title: o.name,
      status: o.fulfillment_status,
      amount: parseFloat(o.total_price),
      currency: o.currency,
      timestamp: new Date(o.created_at),
      metadata: {
        financial_status: o.financial_status,
        fulfillment_status: o.fulfillment_status,
        subtotal: parseFloat(o.subtotal_price),
        shipping_cost: parseFloat(o.total_shipping_price),
        discounts: parseFloat(o.total_discounts),
        line_items: o.line_items.map((li) => ({
          title: li.title,
          quantity: li.quantity,
          price: parseFloat(li.price),
          sku: li.sku,
        })),
        customer_name: `${o.customer.first_name} ${o.customer.last_name}`,
        customer_email: o.customer.email,
        shipping_city: o.shipping_address.city,
        shipping_state: o.shipping_address.province_code,
        tags: o.tags,
      },
      rawPayload: o as unknown as Record<string, unknown>,
    }));
  }

  async fetchInventory(): Promise<NormalizedRecord[]> {
    return RAW_PRODUCTS.map((p) => ({
      merchantId: this.merchantId,
      entityType: "inventory" as const,
      source: "shopify" as const,
      sourceRecordId: p.id,
      title: p.title,
      status: p.status,
      amount: parseFloat(p.variants[0]?.price ?? "0"),
      currency: "INR",
      timestamp: new Date(),
      metadata: {
        total_inventory: p.total_inventory,
        variants: p.variants.map((v) => ({
          sku: v.sku,
          price: parseFloat(v.price),
          inventory_quantity: v.inventory_quantity,
          title: v.title,
        })),
        low_stock: p.total_inventory < 10,
      },
      rawPayload: p as unknown as Record<string, unknown>,
    }));
  }

  async fetchShipments(): Promise<NormalizedRecord[]> {
    return []; // tracked via Shiprocket
  }
}
