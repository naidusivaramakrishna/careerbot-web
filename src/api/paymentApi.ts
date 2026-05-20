import { httpClient } from "@/lib/http";

export interface Plan {
  id: string;
  name: string;
  description: string;
  price_inr_monthly: number;
  price_inr_yearly: number;
  credits_per_month: number;
  features: string[];
  feature_limits: Record<string, number | null>;
  is_unlimited: boolean;
  recommended: boolean;
}

export interface CreatePaymentOrderRequest {
  // The server prices the order from plan_id + billing_cycle. The client must
  // NOT send an amount — that would be tamperable.
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  purpose: string;
}

export interface CreatePaymentOrderResponse {
  order_id: string;
  amount: number;
  amount_inr: number;
  key_id: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  subscription_id?: string;
}

export interface PaymentStatusResponse {
  order_id: string;
  payment_id?: string;
  status: string;
  amount_inr: number;
  created_at: string;
  purpose: string;
}

export interface PaymentHistoryResponse {
  payments: PaymentStatusResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface CurrentSubscription {
  plan_id: string;
  plan_name: string;
  status: string;
  credits_remaining: number;
  credits_total: number;
  billing_cycle: string;
  next_billing_date: string;
  started_at: string;
  features: Record<string, number | string>;
}

// Get all available plans
export const getPlans = async (): Promise<Plan[]> => {
  const response = await httpClient.get<Plan[]>("/api/v1/plans", {
    baseURL: "",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

// Create payment order
export const createPaymentOrder = async (
  request: CreatePaymentOrderRequest
): Promise<CreatePaymentOrderResponse> => {
  const response = await httpClient.post<CreatePaymentOrderResponse>(
    "/api/v1/payments/orders",
    request,
    {
      baseURL: "",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Verify payment signature
export const verifyPayment = async (
  request: VerifyPaymentRequest
): Promise<VerifyPaymentResponse> => {
  const response = await httpClient.post<VerifyPaymentResponse>(
    "/api/v1/payments/verify",
    request,
    {
      baseURL: "",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Get payment status
export const getPaymentStatus = async (
  orderId: string
): Promise<PaymentStatusResponse> => {
  const response = await httpClient.get<PaymentStatusResponse>(
    `/api/v1/payments/status/${orderId}`,
    {
      baseURL: "",
    }
  );
  return response.data;
};

// Get payment history
export const getPaymentHistory = async (
  page = 1,
  limit = 10
): Promise<PaymentHistoryResponse> => {
  const response = await httpClient.get<PaymentHistoryResponse>(
    `/api/v1/payments/history?page=${page}&limit=${limit}`,
    {
      baseURL: "",
    }
  );
  return response.data;
};

// Get current subscription
export const getCurrentSubscription = async (): Promise<CurrentSubscription> => {
  const response = await httpClient.get<CurrentSubscription>(
    "/api/v1/subscription/current",
    {
      baseURL: "",
    }
  );
  return response.data;
};

// Upgrade subscription
export const upgradeSubscription = async (planId: string): Promise<{ payment_url: string }> => {
  const response = await httpClient.post<{ payment_url: string }>(
    "/api/v1/subscription/upgrade",
    { plan_id: planId },
    {
      baseURL: "",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Cancel subscription
export const cancelSubscription = async (): Promise<{ success: boolean; message: string }> => {
  const response = await httpClient.post<{ success: boolean; message: string }>(
    "/api/v1/subscription/cancel",
    {},
    {
      baseURL: "",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};
