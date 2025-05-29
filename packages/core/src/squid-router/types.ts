export interface SquidRouteParams {
  fromAddress: string;
  fromChain: string;
  fromToken: string;
  fromAmount: string;
  toChain: string;
  toToken: string;
  toAddress: string;
  slippage?: number;
}

export interface SquidRouteResponse {
  route: {
    transactionRequest: {
      target: string;
      data: string;
      value: string;
      fromAmount?: string;
    };
    estimate: {
      fromAmount: string;
      toAmount: string;
    };
  };
  requestId: string;
}

export interface SquidStatusParams {
  transactionId: string;
  requestId: string;
  fromChainId: string;
  toChainId: string;
}

export interface SquidStatusResponse {
  squidTransactionStatus: string;
}