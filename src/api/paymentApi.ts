import { httpClient } from "@/lib/http";

// ─── Enums (mirror backend models.py) ────────────────────────────────────────

export type PaymentStatus =
  | "created"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded"
  | "partially_refunded";

export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet";

export type PaymentPurpose =
  | "resume_export"
  | "subscription_monthly"
  | "subscription_yearly"
  | "premium_features";

// ─── Plan ─────────────────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  description: string;
  price_inr_monthly: number;
  price_inr_yearly: number;
  credits_per_month: number | null;
  features: string[];
  feature_limits: Record<string, number | null>;
  is_unlimited: boolean;
  recommended: boolean;
}

// ─── Payment Order ────────────────────────────────────────────────────────────

export interface CreatePaymentOrderRequest {
  amount_inr: number;
  purpose: PaymentPurpose;
  plan_id?: string;
  coupon_code?: string;
  metadata?: Record<string, unknown>;
  idempotency_key?: string;
}

export interface CreatePaymentOrderResponse {
  order_id: string;
  amount: number;         // paise
  amount_inr: number;     // rupees (server-computed for subscriptions)
  currency: string;
  receipt: string;
  status: string;
  key_id: string;
  is_idempotent: boolean;
  upi_intent_url?: string;
}

// ─── Payment Verification ─────────────────────────────────────────────────────

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  payment_id: string;
  order_id: string;
  status: PaymentStatus;
  amount_inr: number;
  vpa?: string;
}

// ─── Payment Status ───────────────────────────────────────────────────────────

export interface PaymentStatusResponse {
  payment_id?: string;
  order_id: string;
  user_id: string;
  amount_inr: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  vpa?: string;
  purpose: PaymentPurpose;
  created_at: string;
  captured_at?: string;
  signature_verified: boolean;
}

// ─── Payment History ──────────────────────────────────────────────────────────

export interface PaymentHistoryItem {
  payment_id?: string;
  order_id: string;
  amount_inr: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  purpose: PaymentPurpose;
  created_at: string;
  captured_at?: string;
}

export interface PaymentHistoryResponse {
  payments: PaymentHistoryItem[];
  total_count: number;
  page: number;
  page_size: number;
}

// ─── Coupon ───────────────────────────────────────────────────────────────────

export interface CouponValidationResponse {
  is_valid: boolean;
  message: string;
  discount_amount: number;
  discount_type: string;
  discount_value: number;
  final_amount_inr: number;
  coupon_code: string;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export interface CurrentSubscription {
  plan_id: string;
  plan_name: string;
  status: string;               // 'active' | 'cancelled' | 'expired' | 'trial'
  credits_remaining: number;
  credits_total: number;
  billing_cycle: string | null; // null for FREE plan
  next_billing_date: string | null;
  started_at: string | null;    // null if plan_started_at not yet set
  expires_at: string | null;
  cancelled_at: string | null;
  features?: Record<string, number | string>; // not returned by backend — optional
}

// ─── Invoice ─────────────────────────────────────────────────────────────────

export interface InvoiceResponse {
  invoice_number: string;
  payment_id: string;
  amount_inr: number;
  gst_amount: number;
  total_amount: number;
  invoice_date: string;
  customer_name?: string;
  customer_email?: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const getPlans = async (): Promise<Plan[]> => {
  const response = await httpClient.get<Plan[]>("/api/v1/plans", {
    baseURL: "",
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

export const createPaymentOrder = async (
  request: CreatePaymentOrderRequest
): Promise<CreatePaymentOrderResponse> => {
  const response = await httpClient.post<CreatePaymentOrderResponse>(
    "/api/v1/payments/orders",
    request,
    {
      baseURL: "",
      headers: { "Content-Type": "application/json" },
    }
  );
  return response.data;
};

// Field names match backend VerifyPaymentRequest exactly
export const verifyPayment = async (
  request: VerifyPaymentRequest
): Promise<VerifyPaymentResponse> => {
  const response = await httpClient.post<VerifyPaymentResponse>(
    "/api/v1/payments/verify",
    request,
    {
      baseURL: "",
      headers: { "Content-Type": "application/json" },
    }
  );
  return response.data;
};

export const getPaymentStatus = async (
  orderId: string
): Promise<PaymentStatusResponse> => {
  const response = await httpClient.get<PaymentStatusResponse>(
    `/api/v1/payments/status/${orderId}`,
    { baseURL: "" }
  );
  return response.data;
};

// page_size matches backend query param name
export const getPaymentHistory = async (
  page = 1,
  page_size = 10,
  status?: string
): Promise<PaymentHistoryResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(page_size),
  });
  if (status) params.set("status", status);

  const response = await httpClient.get<PaymentHistoryResponse>(
    `/api/v1/payments/history?${params.toString()}`,
    { baseURL: "" }
  );
  return response.data;
};

// Validate coupon BEFORE creating order (does not redeem)
export const validateCoupon = async (
  code: string,
  amount_inr: number,
  plan_id?: string
): Promise<CouponValidationResponse> => {
  const params = new URLSearchParams({ code, amount_inr: String(amount_inr) });
  if (plan_id) params.set("plan_id", plan_id);

  const response = await httpClient.post<CouponValidationResponse>(
    `/api/v1/payments/validate-coupon?${params.toString()}`,
    {},
    {
      baseURL: "",
      headers: { "Content-Type": "application/json" },
    }
  );
  return response.data;
};

// Get GST invoice for a captured payment
export const getPaymentInvoice = async (
  paymentId: string,
  customerStateCode?: string
): Promise<InvoiceResponse> => {
  const params = customerStateCode
    ? `?customer_state_code=${customerStateCode}`
    : "";
  const response = await httpClient.get<InvoiceResponse>(
    `/api/v1/payments/${paymentId}/invoice${params}`,
    { baseURL: "" }
  );
  return response.data;
};

export const getCurrentSubscription = async (): Promise<CurrentSubscription> => {
  const response = await httpClient.get<CurrentSubscription>(
    "/api/v1/subscription/current",
    { baseURL: "" }
  );
  return response.data;
};

export const upgradeSubscription = async (
  planId: string
): Promise<{ checkout_url: string; order_id: string; plan_id: string; amount_inr: number }> => {
  const response = await httpClient.post<{ checkout_url: string; order_id: string; plan_id: string; amount_inr: number }>(
    "/api/v1/subscription/upgrade",
    { plan_id: planId },
    {
      baseURL: "",
      headers: { "Content-Type": "application/json" },
    }
  );
  return response.data;
};

export const cancelSubscription = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  const response = await httpClient.post<{ success: boolean; message: string }>(
    "/api/v1/subscription/cancel",
    {},
    {
      baseURL: "",
      headers: { "Content-Type": "application/json" },
    }
  );
  return response.data;
};

