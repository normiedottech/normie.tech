

// Types
export type OrderStatus = "pending" | "verified" | "fulfilled" | "failed" | "expired";

export type VerificationMethod = "teller-zelle-payment-verified-by-buyer" | "teller-zelle-payment-verified-by-seller";

export interface Chain {
  id: number;
}

export interface Token {
  address: string;
  chain: Chain;
}

export interface Wallet {
  address: string;
}

export interface ZelleDetails {
  zelleAddress: string;
}

export interface Seller {
  wallet: Wallet;
  zelleDetails: ZelleDetails;
}

export interface Recipient {
  wallet: Wallet;
}

export interface Transaction {
  hash: string;
  chain: Chain;
}

export interface OrderFulfillment {
  transaction: Transaction;
  createdAt: string;
}

export interface OrderStatusInfo {
  status: OrderStatus;
  updatedAt: string;
}

export interface OrderVerification {
  initiationsCount: number;
  updatedAt: string;
}

export interface EscrowContract {
  address: string;
  chain: Chain;
}

export interface Order {
  id: string;
  autofill: boolean;
  createdAt: string;
  escrowContract: EscrowContract;
  inputAmount: string;
  minimumAmountOut: string;
  orderFulfillment: OrderFulfillment | null;
  orderStatus: OrderStatusInfo;
  orderVerification: OrderVerification;
  outputToken: Token;
  recipient: Recipient;
  seller: Seller;
  uniquenessAmount: string;
  verificationMethod: VerificationMethod;
}

export interface OrderRequest {
  minimumAmountOut: string;
  outputToken: Token;
  recipient: Recipient;
  verificationMethod: VerificationMethod;
}

export interface OrderQuoteRequest {
  minimumAmountOut: string;
  outputToken: Token;
  verificationMethod: VerificationMethod;
}

export interface OrderQuote {
  minimumAmountOut: string;
  outputToken: Token;
  verificationMethod: VerificationMethod;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface InitiatePaymentRequest {
  tellerAccessToken: string;
  tellerAccountId: string;
}

export interface InitiatePaymentResponse {
  initiated: boolean;
  verified: boolean;
}

export interface VerifyResponse {
  verified: boolean;
}

// Constants
export const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const BASE_CHAIN_ID = 8453;

// Client
export class PhoenixClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: { baseUrl?: string; apiKey?: string } = {}) {
    this.baseUrl = config.baseUrl || 'https://prod-phoenix-api-kwr2.encr.app';
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: APIError = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  async createOrderQuote(request: OrderQuoteRequest): Promise<OrderQuote> {
    return this.request<OrderQuote>('/order-quotes', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async createOrder(request: OrderRequest): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getOrder(orderId: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}`);
  }

  async initiatePayment(
    orderId: string,
    request: InitiatePaymentRequest
  ): Promise<InitiatePaymentResponse> {
    return this.request<InitiatePaymentResponse>(
      `/orders/${orderId}/initiate-payment`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  async verifyOrder(orderId: string): Promise<VerifyResponse> {
    return this.request<VerifyResponse>(`/orders/${orderId}/verify`, {
      method: 'POST',
    });
  }
} 