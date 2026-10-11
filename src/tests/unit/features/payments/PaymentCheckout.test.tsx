import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";

// The coupon box must render the backend's validate-coupon contract
// (careerbot-api CouponValidationResult.to_dict): `final_amount` and `code`.
// It used to read `final_amount_inr` / `coupon_code`, which the backend never
// sends, so a valid coupon left the label blank and the total undefined.

const mocks = vi.hoisted(() => ({
  validateCoupon: vi.fn(),
  createPaymentOrder: vi.fn(),
  verifyPayment: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/api/paymentApi", () => ({
  validateCoupon: mocks.validateCoupon,
  createPaymentOrder: mocks.createPaymentOrder,
  verifyPayment: mocks.verifyPayment,
}));

import { PaymentCheckout } from "@/components/payments/PaymentCheckout";
import type { CouponValidationResponse, Plan } from "@/api/paymentApi";

const plan: Plan = {
  id: "pro",
  name: "Pro",
  description: "Pro plan",
  price_inr_monthly: 899,
  price_inr_yearly: 8990,
  credits_per_month: 500,
  features: ["Everything"],
  feature_limits: {},
  is_unlimited: false,
  recommended: true,
};

// Exactly the backend payload for a valid 10% coupon on Rs 899.
const validCoupon: CouponValidationResponse = {
  is_valid: true,
  code: "SAVE10",
  original_amount: 899,
  discount_amount: 89.9,
  final_amount: 809.1,
  discount_type: "percentage",
  discount_value: 10,
  message: "Coupon applied! 10% off — you save ₹90",
};

const razorpayOpen = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (window as unknown as { Razorpay: unknown }).Razorpay = vi.fn().mockImplementation(() => ({
    open: razorpayOpen,
    on: vi.fn(),
    close: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  delete (window as unknown as { Razorpay?: unknown }).Razorpay;
});

async function applyCoupon(input: string) {
  fireEvent.change(screen.getByPlaceholderText(/have a coupon code/i), { target: { value: input } });
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
  await waitFor(() => expect(mocks.validateCoupon).toHaveBeenCalled());
}

describe("PaymentCheckout coupon", () => {
  it("renders the discounted final_amount and the coupon code from the backend contract", async () => {
    mocks.validateCoupon.mockResolvedValue(validCoupon);
    render(<PaymentCheckout plan={plan} billingCycle="monthly" />);

    await applyCoupon("save10");

    expect(mocks.validateCoupon).toHaveBeenCalledWith("SAVE10", 899, "pro");
    expect(await screen.findByText("Coupon (SAVE10)")).toBeInTheDocument();
    expect(screen.getByText("SAVE10")).toBeInTheDocument();
    expect(screen.getByText("₹809.1")).toBeInTheDocument();
    expect(screen.getByText("₹899", { selector: "p.line-through" })).toBeInTheDocument();
    expect(screen.getByText("−₹89.9")).toBeInTheDocument();
  });

  it("sends the validated coupon code when creating the order and shows the discounted pay amount", async () => {
    mocks.validateCoupon.mockResolvedValue(validCoupon);
    mocks.createPaymentOrder.mockResolvedValue({
      order_id: "order_1", amount: 80910, amount_inr: 809.1, currency: "INR",
      receipt: "r", status: "created", key_id: "rzp_test_x",
    });
    render(<PaymentCheckout plan={plan} billingCycle="monthly" />);

    await applyCoupon("save10");
    await screen.findByText("Coupon (SAVE10)");
    fireEvent.click(screen.getByRole("checkbox"));

    const pay = await screen.findByRole("button", { name: /pay ₹809\.1 \/ month/i });
    fireEvent.click(pay);

    await waitFor(() => expect(mocks.createPaymentOrder).toHaveBeenCalledTimes(1));
    expect(mocks.createPaymentOrder).toHaveBeenCalledWith(
      expect.objectContaining({ plan_id: "pro", coupon_code: "SAVE10" }),
    );
  });

  it("shows the backend message and keeps the full price for an invalid coupon", async () => {
    mocks.validateCoupon.mockResolvedValue({
      ...validCoupon,
      is_valid: false,
      discount_amount: 0,
      final_amount: 899,
      discount_type: "",
      discount_value: 0,
      message: "Invalid coupon code",
    });
    render(<PaymentCheckout plan={plan} billingCycle="monthly" />);

    await applyCoupon("free50");

    expect(await screen.findByText("Invalid coupon code")).toBeInTheDocument();
    expect(screen.queryByText(/^Coupon \(/)).not.toBeInTheDocument();
    expect(screen.getAllByText("₹899").length).toBeGreaterThan(0);
  });
});
