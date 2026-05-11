import { ShopifyConnector } from "./shopify.js";
import { ShiprocketConnector } from "./shiprocket.js";
import { GoogleSheetsConnector } from "./sheets.js";

export function getConnectors(merchantId: string) {
  return {
    shopify: new ShopifyConnector(merchantId),
    shiprocket: new ShiprocketConnector(merchantId),
    sheets: new GoogleSheetsConnector(merchantId),
  };
}

export type ConnectorRegistry = ReturnType<typeof getConnectors>;
export { ShopifyConnector, ShiprocketConnector, GoogleSheetsConnector };
