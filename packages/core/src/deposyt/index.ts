// Common types for shared fields
interface BaseTransactionFields {
  security_key: string;
  type: 'sale' | 'auth' | 'credit' | 'validate' | 'offline' | 'capture' | 'void' | 'refund' | 'update';
  amount?: string;
  currency?: string;
  orderid?: string;
  ipaddress?: string;
  tax?: string;
  shipping?: string;
  ponumber?: string;
  customer_receipt?: 'true' | 'false';
}

// Billing information
interface BillingInfo {
  first_name?: string;
  last_name?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  fax?: string;
  email?: string;
}

// Shipping information
interface ShippingInfo {
  shipping_firstname?: string;
  shipping_lastname?: string;
  shipping_company?: string;
  shipping_address1?: string;
  shipping_address2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_country?: string;
  shipping_email?: string;
}

// Credit Card specific fields
interface CreditCardFields {
  payment?: 'creditcard';
  ccnumber?: string;
  ccexp?: string;
  cvv?: string;
}

// ACH specific fields
interface ACHFields {
  payment: 'check';
  checkname: string;
  checkaba: string;
  checkaccount: string;
  account_holder_type?: 'business' | 'personal';
  account_type?: 'checking' | 'savings';
  sec_code?: 'PPD' | 'WEB' | 'TEL' | 'CCD';
}

// Level 3 line item fields
interface LineItem {
  item_product_code?: string;
  item_description?: string;
  item_commodity_code?: string;
  item_unit_of_measure?: string;
  item_unit_cost?: string;
  item_quantity?: string;
  item_total_amount?: string;
  item_tax_amount?: string;
  item_tax_rate?: string;
  item_discount_amount?: string;
  item_discount_rate?: string;
  item_tax_type?: string;
  item_alternate_tax_id?: string;
}

// Main transaction request interface
interface TransactionRequest extends BaseTransactionFields, Partial<BillingInfo>, Partial<ShippingInfo> {
  payment_token?: string;
  transaction_session_id?: string;
  billing_method?: 'recurring' | 'installment';
  merchant_defined_field_1?: string;
  merchant_defined_field_2?: string;
  // ... up to merchant_defined_field_20
  line_items?: LineItem[];
}

// Response interface
interface TransactionResponse {
  response: string;
  responsetext: string;
  authcode?: string;
  transactionid?: string;
  avsresponse?: string;
  cvvresponse?: string;
  orderid?: string;
  type?: string;
  response_code?: string;
  [key: string]: any;
}

export class DeposytClient {
  private readonly apiKey: string;
  private readonly apiEndpoint: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.apiEndpoint = 'https://deposyt.transactiongateway.com/api/transact.php';
  }

  private createQueryString(params: Record<string, any>): string {
    const urlParams = new URLSearchParams();
    
    // Remove undefined values and convert to string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlParams.append(key, String(value));
      }
    });

    return urlParams.toString();
  }

  private async makeRequest(data: Record<string, any>): Promise<TransactionResponse> {
    const queryString = this.createQueryString({
      security_key: this.apiKey,
      ...data
    });

    const url = `${this.apiEndpoint}?${queryString}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async sale(transaction: TransactionRequest & (CreditCardFields | ACHFields)): Promise<TransactionResponse> {
    return this.makeRequest({ ...transaction, type: 'sale' });
  }

  async authorize(transaction: TransactionRequest & (CreditCardFields | ACHFields)): Promise<TransactionResponse> {
    return this.makeRequest({ ...transaction, type: 'auth' });
  }

  async capture(transactionId: string, amount: string): Promise<TransactionResponse> {
    return this.makeRequest({
      type: 'capture',
      transactionid: transactionId,
      amount: amount
    });
  }

  async void(transactionId: string, payment?: 'creditcard' | 'check'): Promise<TransactionResponse> {
    return this.makeRequest({
      type: 'void',
      transactionid: transactionId,
      payment
    });
  }

  async refund(transactionId: string, amount?: string, payment?: 'creditcard' | 'check'): Promise<TransactionResponse> {
    return this.makeRequest({
      type: 'refund',
      transactionid: transactionId,
      amount,
      payment
    });
  }

  async validate(transaction: TransactionRequest & (CreditCardFields | ACHFields)): Promise<TransactionResponse> {
    return this.makeRequest({ ...transaction, type: 'validate' });
  }
}
