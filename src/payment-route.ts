export type PaymentRoute = {
  id: string;
  networkId: string;
  networkName: string;
  ticker: string;
  routeTicker: string;
  routeNetwork: string;
  assetType: "native" | "rwa";
  contractAddress: string | null;
  decimals: number | null;
};

export type PaymentRouteCurrency = {
  ticker: string;
  network: string;
  tokenContract: string | null;
  decimals: number | null;
  buy: boolean;
  sell: boolean;
};

export type PaymentRouteRange = {
  minimum: string;
  maximum: string | null;
  step?: string | null;
};

export type PaymentRouteAvailabilityResult = {
  status: "available" | "coming_soon";
  reason?: string;
  range?: PaymentRouteRange;
  quote?: PaymentRouteQuote;
};

export type PaymentRouteQuote = {
  amountIn: string;
  amountOut: string;
  rate?: string | null;
  expiresAt?: string | null;
  reference?: string | null;
};

export type PaymentRouteExchangeState =
  | "waiting_payment"
  | "confirming"
  | "processing"
  | "finished"
  | "failed"
  | "expired"
  | "refunded"
  | "unknown";

export type PaymentRouteExchange = {
  providerExchangeId: string;
  status: PaymentRouteExchangeState;
  depositAddress: string;
  depositMemo: string | null;
  amountIn: string;
  amountOut: string;
  expiresAt: string | null;
};

export type PaymentRouteExchangeStatus = {
  providerExchangeId: string;
  status: PaymentRouteExchangeState;
  sourceCurrency: string | null;
  sourceNetwork: string | null;
  depositAddress: string | null;
  depositMemo: string | null;
  amountIn: string | null;
  amountOut: string | null;
  destinationCurrency: string | null;
  destinationNetwork: string | null;
  destinationAddress: string | null;
  expiresAt: string | null;
  sourceTransactionHash: string | null;
  outputTransactionHash: string | null;
};

export type PaymentRouteProviderErrorCategory =
  | "not_configured"
  | "route_unavailable"
  | "temporarily_unavailable"
  | "invalid_response"
  | "quote_expired"
  | "insufficient_output"
  | "exchange_creation_uncertain";

export class PaymentRouteProviderError extends Error {
  constructor(
    readonly category: PaymentRouteProviderErrorCategory,
    message = "The payment route is unavailable.",
    readonly providerExchangeId: string | null = null,
  ) {
    super(message);
    this.name = "PaymentRouteProviderError";
  }
}

export interface PaymentRouteProvider {
  /** Internal provider identifier persisted with an exchange record. */
  readonly id: string;
  getCurrencies(): Promise<PaymentRouteCurrency[]>;
  getRange(input: { route: PaymentRoute }): Promise<PaymentRouteRange>;
  getQuote(input: {
    route: PaymentRoute;
    desiredOutputAmount: number;
  }): Promise<PaymentRouteQuote>;
  checkRoute(input: {
    route: PaymentRoute;
    desiredOutputAmount: number;
  }): Promise<PaymentRouteAvailabilityResult>;
  createExchange(input: {
    route: PaymentRoute;
    quote: PaymentRouteQuote;
    recipientAddress: string;
  }): Promise<PaymentRouteExchange>;
  getExchangeStatus(providerExchangeId: string): Promise<PaymentRouteExchangeStatus>;
}

export function isWithinPaymentRouteRange(
  amount: number,
  range: PaymentRouteRange,
): boolean {
  const minimum = Number(range.minimum);
  const maximum = range.maximum === null ? null : Number(range.maximum);
  return Number.isFinite(amount) &&
    amount > 0 &&
    Number.isFinite(minimum) &&
    minimum >= 0 &&
    (maximum === null || (Number.isFinite(maximum) && maximum >= minimum)) &&
    amount >= minimum &&
    (maximum === null || amount <= maximum);
}

function positiveAmount(value: string): boolean {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

export function validatePaymentRouteQuote(
  quote: PaymentRouteQuote,
  desiredOutputAmount: number,
  now = Date.now(),
): PaymentRouteQuote {
  if (
    !Number.isFinite(desiredOutputAmount) ||
    desiredOutputAmount <= 0 ||
    !positiveAmount(quote.amountIn) ||
    !positiveAmount(quote.amountOut)
  ) {
    throw new PaymentRouteProviderError("invalid_response");
  }
  if (Number(quote.amountOut) < desiredOutputAmount) {
    throw new PaymentRouteProviderError("insufficient_output");
  }
  if (quote.expiresAt) {
    const expiresAt = new Date(quote.expiresAt).getTime();
    if (!Number.isFinite(expiresAt) || expiresAt <= now) {
      throw new PaymentRouteProviderError("quote_expired");
    }
  }
  return quote;
}

export async function getValidatedPaymentRouteQuote(
  provider: PaymentRouteProvider,
  input: { route: PaymentRoute; desiredOutputAmount: number },
  now = Date.now(),
): Promise<PaymentRouteQuote> {
  const quote = await provider.getQuote(input);
  return validatePaymentRouteQuote(quote, input.desiredOutputAmount, now);
}

export async function createValidatedPaymentRouteExchange(
  provider: PaymentRouteProvider,
  input: {
    route: PaymentRoute;
    quote: PaymentRouteQuote;
    range: PaymentRouteRange;
    recipientAddress: string;
    desiredOutputAmount: number;
  },
  now = Date.now(),
): Promise<PaymentRouteExchange> {
  const quote = validatePaymentRouteQuote(input.quote, input.desiredOutputAmount, now);
  const exchange = await provider.createExchange({
    route: input.route,
    quote,
    recipientAddress: input.recipientAddress,
  });
  if (
    !exchange.providerExchangeId.trim() ||
    !exchange.depositAddress.trim() ||
    !positiveAmount(exchange.amountIn) ||
    !positiveAmount(exchange.amountOut) ||
    !isWithinPaymentRouteRange(Number(exchange.amountIn), input.range) ||
    Number(exchange.amountOut) < input.desiredOutputAmount ||
    (exchange.status !== "waiting_payment" && exchange.status !== "confirming")
  ) {
    throw new PaymentRouteProviderError(
      "invalid_response",
      "The payment route did not return usable payment details.",
      exchange.providerExchangeId || null,
    );
  }
  if (exchange.expiresAt) {
    const expiresAt = new Date(exchange.expiresAt).getTime();
    if (!Number.isFinite(expiresAt) || expiresAt <= now) {
      throw new PaymentRouteProviderError(
        "quote_expired",
        "The payment route returned expired payment details.",
        exchange.providerExchangeId,
      );
    }
  }
  return exchange;
}
