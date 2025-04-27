import { Resource } from 'sst';
import crypto from 'crypto';

// PayPal Webhook Event Types
export type PayPalWebhookEventType = 
  | 'PAYMENT.SALE.COMPLETED'
  | 'PAYMENT.SALE.REFUNDED'
  | 'PAYMENT.SALE.REVERSED'
  | 'BILLING.SUBSCRIPTION.CREATED'
  | 'BILLING.SUBSCRIPTION.UPDATED'
  | 'BILLING.SUBSCRIPTION.CANCELLED'
  | 'BILLING.SUBSCRIPTION.EXPIRED'
  | 'BILLING.SUBSCRIPTION.SUSPENDED'
  | 'BILLING.SUBSCRIPTION.ACTIVATED'
  | 'BILLING.SUBSCRIPTION.PAYMENT.FAILED'
  | 'CHECKOUT.ORDER.APPROVED'
  | 'CHECKOUT.ORDER.COMPLETED'
  | 'CHECKOUT.ORDER.CANCELLED'
  | 'CHECKOUT.ORDER.REFUNDED'
  | 'CHECKOUT.PAYMENT-APPROVAL.REVERSED';

// PayPal Webhook Event Resource Types
export type PayPalWebhookResourceType = 
  | 'sale'
  | 'subscription'
  | 'order';

// Base PayPal Webhook Event
export interface PayPalWebhookEvent {
  id: string;
  event_type: PayPalWebhookEventType;
  resource_type: PayPalWebhookResourceType;
  resource: any;
  summary: string;
  create_time: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

// PayPal Webhook Sale Resource
export interface PayPalWebhookSaleResource {
  id: string;
  state: string;
  amount: {
    total: string;
    currency: string;
    details: {
      subtotal: string;
      tax: string;
      shipping: string;
      handling_fee: string;
      shipping_discount: string;
      insurance: string;
    };
  };
  payment_mode: string;
  protection_eligibility: string;
  protection_eligibility_type: string;
  transaction_fee: {
    value: string;
    currency: string;
  };
  parent_payment: string;
  create_time: string;
  update_time: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

// PayPal Webhook Subscription Resource
export interface PayPalWebhookSubscriptionResource {
  id: string;
  status: "APPROVAL_PENDING" | "APPROVED" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";
  status_update_time: string;
  plan_id: string;
  start_time: string;
  quantity: string;
  shipping_amount: {
    currency_code: string;
    value: string;
  };
  subscriber: {
    name: {
      given_name: string;
      surname: string;
    };
    email_address: string;
    payer_id: string;
  };
  billing_info: {
    outstanding_balance: {
      currency_code: string;
      value: string;
    };
    cycle_executions: Array<{
      tenure_type: string;
      sequence: number;
      cycles_completed: number;
      cycles_remaining: number;
      current_pricing_scheme_version: number;
      total_cycles: number;
    }>;
    last_payment: {
      amount: {
        currency_code: string;
        value: string;
      };
      time: string;
    };
    next_billing_time: string;
    final_payment_time: string;
    failed_payments_count: number;
  };
  create_time: string;
  update_time: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

// PayPal Webhook Order Resource
export interface PayPalWebhookOrderResource {
  id: string;
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
  intent: 'CAPTURE' | 'AUTHORIZE';
  purchase_units: Array<{
    reference_id: string;
    amount: {
      currency_code: string;
      value: string;
      breakdown?: {
        item_total: {
          currency_code: string;
          value: string;
        };
        shipping: {
          currency_code: string;
          value: string;
        };
        handling: {
          currency_code: string;
          value: string;
        };
        tax_total: {
          currency_code: string;
          value: string;
        };
        shipping_discount: {
          currency_code: string;
          value: string;
        };
        discount: {
          currency_code: string;
          value: string;
        };
      };
    };
    payee: {
      email_address: string;
      merchant_id: string;
    };
    description?: string;
    custom_id?: string;
    invoice_id?: string;
    soft_descriptor?: string;
    items?: Array<{
      name: string;
      unit_amount: {
        currency_code: string;
        value: string;
      };
      tax?: {
        currency_code: string;
        value: string;
      };
      quantity: string;
      description?: string;
      sku?: string;
      category?: 'DIGITAL_GOODS' | 'PHYSICAL_GOODS' | 'DONATION';
    }>;
    shipping?: {
      name: {
        full_name: string;
      };
      address: {
        address_line_1: string;
        address_line_2?: string;
        admin_area_1?: string;
        admin_area_2?: string;
        postal_code: string;
        country_code: string;
      };
    };
  }>;
  payer: {
    name: {
      given_name: string;
      surname: string;
    };
    email_address: string;
    payer_id: string;
    address: {
      country_code: string;
    };
  };
  create_time: string;
  update_time: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

// PayPal Webhook Verification Response
export interface PayPalWebhookVerificationResponse {
  verification_status: 'SUCCESS' | 'FAILURE';
}

export class PayPalWebhookSDK {
  private readonly webhookId: string;
  private readonly baseUrl: string;

  constructor(webhookId: string) {
    this.webhookId = webhookId;
    this.baseUrl = Resource.App.stage === "production" 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com';
  }

  /**
   * Verify a PayPal webhook event using PayPal's official endpoint
   * @param headers Request headers containing PayPal webhook signature
   * @param body Raw request body
   * @returns Promise<boolean> Whether the webhook is valid
   */
  public async verifyWebhookSignature(headers: Record<string, string>, body: string): Promise<boolean> {
    const authAlgo = headers['paypal-auth-algo'];
    const certUrl = headers['paypal-cert-url'];
    const transmissionId = headers['paypal-transmission-id'];
    const transmissionSig = headers['paypal-transmission-sig'];
    const transmissionTime = headers['paypal-transmission-time'];

    if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAccessToken()}`
        },
        body: JSON.stringify({
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: this.webhookId,
          webhook_event: JSON.parse(body)
        })
      });

      if (!response.ok) {
        console.error('PayPal webhook verification failed:', await response.text());
        return false;
      }

      const result: PayPalWebhookVerificationResponse = await response.json();
      return result.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('Error verifying PayPal webhook:', error);
      return false;
    }
  }

  /**
   * Get PayPal access token for API calls
   * @returns Promise<string> Access token
   */
  private async getAccessToken(): Promise<string> {
    const clientId = Resource.PAYPAL_CLIENT_ID.value;
    const clientSecret = Resource.PAYPAL_SECRET.value;

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not configured');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error('Failed to get PayPal access token');
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Parse webhook event from request body
   * @param body Raw request body
   * @returns PayPalWebhookEvent
   */
  public parseWebhookEvent(body: string): PayPalWebhookEvent {
    return JSON.parse(body);
  }

  /**
   * Get webhook event type
   * @param event Webhook event
   * @returns PayPalWebhookEventType
   */
  public getEventType(event: PayPalWebhookEvent): PayPalWebhookEventType {
    return event.event_type;
  }

  /**
   * Get webhook resource type
   * @param event Webhook event
   * @returns PayPalWebhookResourceType
   */
  public getResourceType(event: PayPalWebhookEvent): PayPalWebhookResourceType {
    return event.resource_type;
  }

  /**
   * Get webhook resource
   * @param event Webhook event
   * @returns PayPalWebhookSaleResource | PayPalWebhookSubscriptionResource | PayPalWebhookOrderResource
   */
  public getResource(event: PayPalWebhookEvent): PayPalWebhookSaleResource | PayPalWebhookSubscriptionResource | PayPalWebhookOrderResource {
    return event.resource;
  }
} 