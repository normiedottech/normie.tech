export interface GetQuoteParams {
  srcChainId: string;
  srcChainTokenIn: string;
  srcChainTokenInAmount: string;
  dstChainId: string;
  dstChainTokenOut: string;
  dstChainTokenOutAmount?: string;
  senderAddress?: string;
  referralCode?: number;
  affiliateFeePercent?: number;
  affiliateFeeRecipient?: string;
  prependOperatingExpenses?: boolean;
  // Add other optional params as needed
}
export interface CreateOrderParams extends GetQuoteParams {
    srcChainId: string;
    srcChainTokenIn: string;
    srcChainTokenInAmount: string;
    srcChainOrderAuthorityAddress: string;
    dstChainId: string;
    dstChainTokenOut: string;
    dstChainTokenOutRecipient: string;
    dstChainOrderAuthorityAddress: string;
}

export interface TokenAmount {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  amount: string;
  approximateUsdValue?: number;
}

export interface Estimation {
  srcChainTokenIn: TokenAmount;
  srcChainTokenOut: TokenAmount;
  dstChainTokenOut: TokenAmount;
  recommendedSlippage: number;
  costsDetails: string[];
}

export interface TxData {
  to: string;
  data: string;
  value: string;
  gasLimit: number;
}

export interface QuoteResponse {
  estimation: Estimation;
  tx: TxData;
  orderId: string;
  prependedOperatingExpenseCost: string;
  order: {
    approximateFulfillmentDelay: number;
    salt: number;
    metadata: string;
  };
  fixFee: string;
  userPoints: number;
  integratorPoints: number;
}
