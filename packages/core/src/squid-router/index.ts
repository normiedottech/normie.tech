import { Squid } from '@0xsquid/sdk';
import { Resource } from 'sst';

export interface SquidQuoteParams {
  fromChain: number;
  fromToken: string;
  toChain: number;
  toToken: string;
  fromAmount: string;
  toAddress: string;
  slippage?: number;
}

export interface SquidOrderResponse {
  transactionRequest: {
    target: string;
    data: string;
    value: string;
  };
  estimate: {
    fromAmount: string;
    toAmount: string;
    estimatedTime: number;
  };
}

export class SquidRouter {
  private squid: Squid;

  constructor() {
    this.squid = new Squid({
      integratorId: Resource.SQUID_INTEGRATOR_ID.value,
      baseUrl: 'https://api.squidrouter.com',
    });
  }

  async getQuote(params: SquidQuoteParams): Promise<SquidOrderResponse> {
    const route = await this.squid.getRoute({
      fromChain: params.fromChain,
      fromToken: params.fromToken,
      toChain: params.toChain,
      toToken: params.toToken,
      fromAmount: params.fromAmount,
      toAddress: params.toAddress,
      slippage: params.slippage || 1,
    });

    return {
      transactionRequest: {
        target: route.transactionRequest.target,
        data: route.transactionRequest.data,
        value: route.transactionRequest.value,
      },
      estimate: {
        fromAmount: route.estimate.fromAmount,
        toAmount: route.estimate.toAmount,
        estimatedTime: route.estimate.estimatedTime,
      },
    };
  }

  async createOrder(params: SquidQuoteParams): Promise<SquidOrderResponse> {
    return this.getQuote(params);
  }
}