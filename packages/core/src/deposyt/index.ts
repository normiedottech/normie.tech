// Common types for shared fields

import { DOMParser } from "xmldom";
interface BaseTransactionFields {
	type:
		| "sale"
		| "auth"
		| "credit"
		| "validate"
		| "offline"
		| "capture"
		| "void"
		| "refund"
		| "update";
	amount?: string;
	currency?: string;
	orderid?: string;
	ipaddress?: string;
	tax?: string;
	shipping?: string;
	ponumber?: string;
	customer_receipt?: "true" | "false";
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
	payment?: "creditcard";
	ccnumber?: string;
	ccexp?: string;
	cvv?: string;
}

// ACH specific fields
interface ACHFields {
	payment?: "check";
	checkname?: string;
	checkaba?: string;
	checkaccount?: string;
	account_holder_type?: "business" | "personal";
	account_type?: "checking" | "savings";
	sec_code?: "PPD" | "WEB" | "TEL" | "CCD";
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
interface TransactionRequest
	extends BaseTransactionFields,
		Partial<BillingInfo>,
		Partial<ShippingInfo> {
	payment_token?: string;
	transaction_session_id?: string;
	billing_method?: "recurring" | "installment";
	merchant_defined_field_1?: string;
	merchant_defined_field_2?: string;
	// ... up to merchant_defined_field_20
	line_items?: LineItem[];
}

// Add the response interfaces
interface DeposytStandardResponse {
	response: number;
	responsetext: string;
	authcode: string;
	transactionid: string;
	avsresponse: string;
	cvvresponse: string;
	orderid: string;
	response_code: number | null;
	emv_auth_response_data: string | null;
}

interface DeposytConditionalResponse {
	customer_vault_id?: string;
	kount_score?: number;
	merchant_advice_code?: string;
}

type DeposytResponse = DeposytStandardResponse & DeposytConditionalResponse;

// Update the TransactionResponse type to use our new response type
type TransactionResponse = DeposytResponse;

// Add these new interfaces for Query API
interface QueryConstraints {
	action_type?:
		| "sale"
		| "auth"
		| "credit"
		| "validate"
		| "offline"
		| "capture"
		| "void"
		| "refund"
		| "update";
	start_date?: string; // Format: YYYYMMDD
	end_date?: string; // Format: YYYYMMDD
	transaction_id?: string;
	order_id?: string;
	batch_id?: string;
	[key: string]: string | undefined;
}

interface QueryAction {
	amount: string;
	action_type: string;
	date: string;
	success: string;
	ip_address: string;
	source: string;
	api_method: string;
	username: string;
	response_text: string;
	batch_id: string;
	processor_batch_id: string;
	response_code: string;
	processor_response_text: string;
	processor_response_code: string;
	device_license_number: string;
	device_nickname: string;
}

export interface QueryTransaction {
	transaction_id: string;
	action: QueryAction[];
	[key: string]: any;
}

interface QueryResponse {
	transaction: QueryTransaction[];
}

export class DeposytClient {
	private readonly apiKey: string;
	private readonly apiEndpoint: string;
	private readonly queryEndpoint: string;

	constructor(apiKey: string) {
		this.apiKey = apiKey;
		this.apiEndpoint =
			"https://deposyt.transactiongateway.com/api/transact.php";
		this.queryEndpoint = "https://deposyt.transactiongateway.com/api/query.php";
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

	private parseDeposytResponse(responseString: string): DeposytResponse {
		// Split the response string into key-value pairs
		const pairs = responseString.split("&");
		const result: Record<string, string> = {};

		// Convert each key-value pair into object properties
		pairs.forEach((pair) => {
			const [key, value] = pair.split("=");
			result[key] = decodeURIComponent(value || "");
		});

		// Create standardized response object with proper types
		return {
			response: parseInt(result.response),
			responsetext: result.responsetext || "",
			authcode: result.authcode || "",
			transactionid: result.transactionid || "",
			avsresponse: result.avsresponse || "",
			cvvresponse: result.cvvresponse || "",
			orderid: result.orderid || "",
			response_code: result.response_code
				? parseInt(result.response_code)
				: null,
			emv_auth_response_data: result.emv_auth_response_data || null,

			// Conditional fields - only included if they exist
			...(result.customer_vault_id && {
				customer_vault_id: result.customer_vault_id,
			}),
			...(result.kount_score && { kount_score: parseInt(result.kount_score) }),
			...(result.merchant_advice_code && {
				merchant_advice_code: result.merchant_advice_code,
			}),
		};
	}

	private async makeRequest(
		data: Record<string, any>,
	): Promise<TransactionResponse> {
		console.log({ data });
		console.log("this.apiKey", this.apiKey);

		const formData = new URLSearchParams();
		formData.append("security_key", this.apiKey);

		Object.entries(data).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				formData.append(key, String(value));
			}
		});

		console.log({ formData: formData.toString() });

		const response = await fetch(this.apiEndpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: formData.toString(),
		});

		console.log({ response });
		const text = await response.text();
		console.log({ text });

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		// Parse the URL-encoded response instead of trying to parse as JSON
		return this.parseDeposytResponse(text);
	}

	async sale(
		transaction: TransactionRequest & (CreditCardFields | ACHFields),
	): Promise<TransactionResponse> {
		return this.makeRequest({ ...transaction, type: "sale" });
	}

	async authorize(
		transaction: TransactionRequest & (CreditCardFields | ACHFields),
	): Promise<TransactionResponse> {
		return this.makeRequest({ ...transaction, type: "auth" });
	}

	async capture(
		transactionId: string,
		amount: string,
	): Promise<TransactionResponse> {
		return this.makeRequest({
			type: "capture",
			transactionid: transactionId,
			amount: amount,
		});
	}

	async void(
		transactionId: string,
		payment?: "creditcard" | "check",
	): Promise<TransactionResponse> {
		return this.makeRequest({
			type: "void",
			transactionid: transactionId,
			payment,
		});
	}

	async refund(
		transactionId: string,
		amount?: string,
		payment?: "creditcard" | "check",
	): Promise<TransactionResponse> {
		return this.makeRequest({
			type: "refund",
			transactionid: transactionId,
			amount,
			payment,
		});
	}

	async validate(
		transaction: TransactionRequest & (CreditCardFields | ACHFields),
	): Promise<TransactionResponse> {
		return this.makeRequest({ ...transaction, type: "validate" });
	}

	/**
	 * Query transactions based on specified constraints
	 * @param constraints Query parameters to filter transactions
	 * @returns Promise<QueryResponse>
	 */
	async queryTransactions(
		constraints: QueryConstraints,
	): Promise<QueryResponse> {
		const queryString = this.createQueryString({
			security_key: this.apiKey,
			...constraints,
		});

		const url = `${this.queryEndpoint}?${queryString}`;

		console.log({ url });

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const xmlText = await response.text();
		console.log({ xmlText });

		// Parse XML response
		try {
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(xmlText, "text/xml");

			// Helper function to safely get text content
			const getTextContent = (element: Element | null): string => {
				return element?.textContent || "";
			};

			// Convert XML to JSON structure using getElementsByTagName instead of querySelectorAll
			const transactions: QueryTransaction[] = Array.from(
				xmlDoc.getElementsByTagName("transaction"),
			).map((trans) => {
				const actions: QueryAction[] = Array.from(
					trans.getElementsByTagName("action"),
				).map((action) => ({
					amount: getTextContent(action.getElementsByTagName("amount")[0]),
					action_type: getTextContent(
						action.getElementsByTagName("action_type")[0],
					),
					date: getTextContent(action.getElementsByTagName("date")[0]),
					success: getTextContent(action.getElementsByTagName("success")[0]),
					ip_address: getTextContent(
						action.getElementsByTagName("ip_address")[0],
					),
					source: getTextContent(action.getElementsByTagName("source")[0]),
					api_method: getTextContent(
						action.getElementsByTagName("api_method")[0],
					),
					username: getTextContent(action.getElementsByTagName("username")[0]),
					response_text: getTextContent(
						action.getElementsByTagName("response_text")[0],
					),
					batch_id: getTextContent(action.getElementsByTagName("batch_id")[0]),
					processor_batch_id: getTextContent(
						action.getElementsByTagName("processor_batch_id")[0],
					),
					response_code: getTextContent(
						action.getElementsByTagName("response_code")[0],
					),
					processor_response_text: getTextContent(
						action.getElementsByTagName("processor_response_text")[0],
					),
					processor_response_code: getTextContent(
						action.getElementsByTagName("processor_response_code")[0],
					),
					device_license_number: getTextContent(
						action.getElementsByTagName("device_license_number")[0],
					),
					device_nickname: getTextContent(
						action.getElementsByTagName("device_nickname")[0],
					),
				}));

				console.log({ actions });

				return {
					transaction_id: getTextContent(
						trans.getElementsByTagName("transaction_id")[0],
					),
					action: actions,
				};
			});

			return { transaction: transactions };
		} catch (error) {
			console.error("XML parsing error:", error);
			console.error("Raw XML:", xmlText);
			throw new Error(`Failed to parse XML response: ${error}`);
		}
	}
}
