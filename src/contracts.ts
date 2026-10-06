export interface CatalogSource {
  readonly id: string;
  isConfigured(): boolean;
  refreshPrices(): Promise<void>;
  synchronize(): Promise<void>;
}

export type FulfillmentInvoice = {
  id: string;
  status: string;
  fulfillmentReference: string | null;
};

export type FulfillmentDelivery = {
  status: string;
  code: string | null;
  url: string | null;
  pin: string | null;
  instructions: string | null;
  expiresAt: string | null;
};

export interface FulfillmentProvider {
  readonly id: string;
  isConfigured(): boolean;
  createInvoice(input: {
    productId: string;
    variantId: string;
  }): Promise<FulfillmentInvoice>;
  getInvoice(invoiceId: string): Promise<FulfillmentInvoice>;
  getDelivery(orderId: string): Promise<FulfillmentDelivery>;
}

export type SettlementVerification = {
  status: "pending" | "unavailable" | "reverted" | "insufficient" | "verified";
  confirmations: number;
};

export interface SettlementProvider {
  isConfigured(): boolean;
  getAddress(): string | null;
  verifyOutputTransfer(input: {
    transactionHash: string;
    recipient: string;
    expectedAmount: string;
  }): Promise<SettlementVerification>;
}

export class FulfillmentProviderUnavailableError extends Error {
  constructor() {
    super("The fulfillment provider could not be verified.");
    this.name = "FulfillmentProviderUnavailableError";
  }
}
