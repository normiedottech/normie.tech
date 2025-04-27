import { Resource } from 'sst';

const PAYPAL_BASE_URL = Resource.App.stage === "production" 
  ? 'https://api.paypal.com' 
  : 'https://api.sandbox.paypal.com';

interface PayPalAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalProduct {
  id: string;
  name: string;
  description?: string;
  type: string;
  category?: string;
}

interface PayPalPlan {
  id: string;
  name: string;
  description?: string;
  status: string;
  billing_cycles: Array<{
    frequency: {
      interval_unit: string;
      interval_count: number;
    };
    tenure_type: string;
    sequence: number;
    total_cycles: number;
    pricing_scheme: {
      fixed_price: {
        value: string;
        currency_code: string;
      };
    };
  }>;
}

interface PayPalSubscription {
  id: string;
  product_id: string;
  name: string;
  status: string;
  description: string;
  create_time: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export async function getPayPalAccessToken(): Promise<string> {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${Resource.PAYPAL_CLIENT_ID.value}:${Resource.PAYPAL_SECRET.value}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data: PayPalAccessToken = await response.json();
  return data.access_token;
}

export async function createPayPalProduct(
  accessToken: string,
  name: string,
  description?: string,
 
): Promise<PayPalProduct> {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name,
      description,
      type: 'DIGITAL',
     
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create PayPal product');
  }

  return response.json();
}

export async function createPayPalPlan(
  accessToken: string,
  productId: string,
  name: string,
  description: string | undefined,
  amount: number,
  interval: string,
  intervalCount: number
): Promise<PayPalPlan> {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name,
      description,
      billing_cycles: [
        {
          frequency: {
            interval_unit: interval,
            interval_count: intervalCount,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // Infinite
          pricing_scheme: {
            fixed_price: {
              value: (amount / 100).toString(),
              currency_code: 'USD',
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: '0',
          currency_code: 'USD',
        },
        setup_fee_failure_action: 'CANCEL',
        payment_failure_threshold: 3,
      },
    }),
  });

  if (!response.ok) {
    
    console.error(await response.json())
    throw new Error('Failed to create PayPal plan');
  }

  return response.json();
}

export async function createPayPalSubscription(
  accessToken: string,
  planId: string,
  subscriptionId: string
): Promise<PayPalSubscription> {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: subscriptionId,
      application_context: {
        brand_name: "Normie Tech",
        locale: "en-US",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW"
      },
    }),
  });

  if (!response.ok) {
    console.error(await response.json())
    throw new Error('Failed to create PayPal subscription');
  }

  return response.json();
}

export async function getPayPalSubscription(
  accessToken: string,
  subscriptionId: string
): Promise<PayPalSubscription> {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal subscription');
  }

  return response.json();
}

export async function cancelPayPalSubscription(
  accessToken: string,
  subscriptionId: string,
  reason?: string
): Promise<void> {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      reason: reason || "Cancelled by user",
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to cancel PayPal subscription');
  }
} 