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

    expect(mocks.validateCoupon).toHaveBeenCalledWith("SAVE10", 899, "pro", "monthly");
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

// ─── Server-computed price (fix/checkout-server-price) ────────────────────────

const order = (amount: number) => ({
  order_id: "order_1", amount, amount_inr: amount / 100, currency: "INR",
  receipt: "r", status: "created", key_id: "rzp_test_x", is_idempotent: false,
});

function razorpayCtor() {
  return (window as unknown as { Razorpay: ReturnType<typeof vi.fn> }).Razorpay;
}

describe("PaymentCheckout server price", () => {
  it("sends the yearly billing cycle and shows the server original/final amounts", async () => {
    mocks.validateCoupon.mockResolvedValue({
      ...validCoupon, original_amount: 9500, discount_amount: 950, final_amount: 8550,
    });
    render(<PaymentCheckout plan={plan} billingCycle="yearly" />);

    await applyCoupon("save10");

    expect(mocks.validateCoupon).toHaveBeenCalledWith("SAVE10", 8990, "pro", "yearly");
    expect(await screen.findByText("₹9,500", { selector: "p.line-through" })).toBeInTheDocument();
    expect(screen.getByText("₹8,550")).toBeInTheDocument();
    expect(screen.queryByText("₹8,990")).not.toBeInTheDocument();
  });

  it("drops an applied coupon when the billing cycle changes", async () => {
    mocks.validateCoupon.mockResolvedValue(validCoupon);
    const { rerender } = render(<PaymentCheckout plan={plan} billingCycle="monthly" />);
    await applyCoupon("save10");
    await screen.findByText("Coupon (SAVE10)");

    rerender(<PaymentCheckout plan={plan} billingCycle="yearly" />);

    await waitFor(() => expect(screen.queryByText("Coupon (SAVE10)")).not.toBeInTheDocument());
    expect(screen.getByText("₹8,990", { selector: "p.text-2xl" })).toBeInTheDocument();
  });

  it("ignores a coupon response that arrives after the cycle changed", async () => {
    let resolve!: (v: CouponValidationResponse) => void;
    mocks.validateCoupon.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { rerender } = render(<PaymentCheckout plan={plan} billingCycle="monthly" />);
    await applyCoupon("save10");

    rerender(<PaymentCheckout plan={plan} billingCycle="yearly" />);
    resolve(validCoupon);

    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText("Coupon (SAVE10)")).not.toBeInTheDocument();
    expect(screen.getByText("₹8,990", { selector: "p.text-2xl" })).toBeInTheDocument();
  });

  it("opens Razorpay directly when the order amount matches what was shown", async () => {
    mocks.validateCoupon.mockResolvedValue(validCoupon);
    mocks.createPaymentOrder.mockResolvedValue(order(80910));
    render(<PaymentCheckout plan={plan} billingCycle="monthly" />);
    await applyCoupon("save10");
    await screen.findByText("Coupon (SAVE10)");
    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(await screen.findByRole("button", { name: /pay ₹809\.1 \/ month/i }));

    await waitFor(() => expect(razorpayOpen).toHaveBeenCalledTimes(1));
    expect(razorpayCtor()).toHaveBeenCalledWith(expect.objectContaining({ amount: 80910, order_id: "order_1" }));
    expect(screen.queryByText("The price has changed")).not.toBeInTheDocument();
  });

  it("does not open Razorpay when the server amount differs; shows it and asks to confirm", async () => {
    mocks.validateCoupon.mockResolvedValue(validCoupon);
    mocks.createPaymentOrder.mockResolvedValue(order(89900)); // e.g. idempotent replay of a no-coupon order
    render(<PaymentCheckout plan={plan} billingCycle="monthly" />);
    await applyCoupon("save10");
    await screen.findByText("Coupon (SAVE10)");
    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(await screen.findByRole("button", { name: /pay ₹809\.1 \/ month/i }));

    expect(await screen.findByText("The price has changed")).toBeInTheDocument();
    expect(razorpayCtor()).not.toHaveBeenCalled();
    expect(razorpayOpen).not.toHaveBeenCalled();
    // The main pay button is blocked until the user decides.
    expect(screen.getByRole("button", { name: /pay ₹809\.1 \/ month/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Pay ₹899" }));

    await waitFor(() => expect(razorpayOpen).toHaveBeenCalledTimes(1));
    expect(razorpayCtor()).toHaveBeenCalledWith(expect.objectContaining({ amount: 89900, order_id: "order_1" }));
    expect(mocks.createPaymentOrder).toHaveBeenCalledTimes(1);
  });

  it("guards a list-price mismatch too (stale /plans page, no coupon)", async () => {
    mocks.createPaymentOrder.mockResolvedValue(order(99900));
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { ...original, reload } });
    try {
      render(<PaymentCheckout plan={plan} billingCycle="monthly" />);
      fireEvent.click(screen.getByRole("checkbox"));
      fireEvent.click(await screen.findByRole("button", { name: /pay ₹899 \/ month/i }));

      expect(await screen.findByText("The price has changed")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Pay ₹999" })).toBeInTheDocument();
      expect(razorpayOpen).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole("button", { name: "Refresh price" }));
      expect(reload).toHaveBeenCalledTimes(1);
      expect(razorpayOpen).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, "location", { configurable: true, value: original });
    }
  });

  it("never opens Razorpay when order creation fails (e.g. 409 idempotency conflict)", async () => {
    mocks.createPaymentOrder.mockRejectedValue(new Error("Request failed with status code 409"));
    render(<PaymentCheckout plan={plan} billingCycle="monthly" />);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(await screen.findByRole("button", { name: /pay ₹899 \/ month/i }));

    expect(await screen.findByText("Failed to initiate payment. Please try again.")).toBeInTheDocument();
    expect(razorpayCtor()).not.toHaveBeenCalled();
  });

  it("discards an order that resolves after the billing cycle changed", async () => {
    let resolveOrder!: (v: ReturnType<typeof order>) => void;
    mocks.createPaymentOrder.mockReturnValue(new Promise((r) => { resolveOrder = r; }));
    const { rerender } = render(<PaymentCheckout plan={plan} billingCycle="monthly" />);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(await screen.findByRole("button", { name: /pay ₹899 \/ month/i }));
    await waitFor(() => expect(mocks.createPaymentOrder).toHaveBeenCalledTimes(1));

    rerender(<PaymentCheckout plan={plan} billingCycle="yearly" />);
    resolveOrder(order(89900)); // the monthly order, now stale
    await new Promise((r) => setTimeout(r, 0));

    expect(razorpayCtor()).not.toHaveBeenCalled();
    expect(screen.queryByText("The price has changed")).not.toBeInTheDocument();
    // The checkout is usable again for the yearly price.
    expect(await screen.findByRole("button", { name: /pay ₹8,990 \/ year/i })).toBeEnabled();
  });

  it("keeps Razorpay closed when Terms is unticked before confirming a changed price", async () => {
    mocks.validateCoupon.mockResolvedValue(validCoupon);
    mocks.createPaymentOrder.mockResolvedValue(order(89900));
    render(<PaymentCheckout plan={plan} billingCycle="monthly" />);
    await applyCoupon("save10");
    await screen.findByText("Coupon (SAVE10)");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(await screen.findByRole("button", { name: /pay ₹809\.1 \/ month/i }));
    expect(await screen.findByText("The price has changed")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox")); // untick Terms
    fireEvent.click(screen.getByRole("button", { name: "Pay ₹899" }));
    await new Promise((r) => setTimeout(r, 0));

    expect(razorpayCtor()).not.toHaveBeenCalled();
    expect(razorpayOpen).not.toHaveBeenCalled();
    expect(screen.getByText("Please agree to the Terms of Service")).toBeInTheDocument();
    expect(screen.getByText("The price has changed")).toBeInTheDocument();

    // Opposite state: Terms ticked again -> the confirmed server amount opens once.
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Pay ₹899" }));
    await waitFor(() => expect(razorpayOpen).toHaveBeenCalledTimes(1));
    expect(razorpayCtor()).toHaveBeenCalledWith(expect.objectContaining({ amount: 89900 }));
  });

  // Razorpay may only open for the total on screen (the price box is the one
  // explicit exception, and it is not shown in these cases).
  function expectOpenedOnlyForShownTotal() {
    const shown = screen.getByText(/^₹/, { selector: "p.text-2xl" }).textContent ?? "";
    const shownPaise = Math.round(Number(shown.replace(/[₹,]/g, "")) * 100);
    const opened = razorpayCtor().mock.calls.map((c) => (c[0] as { amount: number }).amount);
    expect(opened.filter((a) => a !== shownPaise)).toEqual([]);
  }

  it("keeps the coupon (X disabled) while the order is in flight, so Razorpay opens only for the total shown", async () => {
    let resolveOrder!: (v: ReturnType<typeof order>) => void;
    mocks.validateCoupon.mockResolvedValue(validCoupon);
    mocks.createPaymentOrder.mockReturnValue(new Promise((r) => { resolveOrder = r; }));
    render(<PaymentCheckout plan={plan} billingCycle="monthly" />);
    await applyCoupon("save10");
    await screen.findByText("Coupon (SAVE10)");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(await screen.findByRole("button", { name: /pay ₹809\.1 \/ month/i }));
    await waitFor(() => expect(mocks.createPaymentOrder).toHaveBeenCalledTimes(1));

    const remove = screen.getByRole("button", { name: "Remove coupon" });
    expect(remove).toBeDisabled();
    fireEvent.click(remove);
    resolveOrder(order(80910)); // the SAVE10 order
    await new Promise((r) => setTimeout(r, 0));

    expectOpenedOnlyForShownTotal();
    expect(razorpayOpen).toHaveBeenCalledTimes(1);
  });

  it("does not create an order while a coupon is still being validated", async () => {
    let resolveCoupon!: (v: CouponValidationResponse) => void;
    let resolveOrder: ((v: ReturnType<typeof order>) => void) | undefined;
    mocks.validateCoupon.mockReturnValue(new Promise((r) => { resolveCoupon = r; }));
    mocks.createPaymentOrder.mockReturnValue(new Promise((r) => { resolveOrder = r; }));
    render(<PaymentCheckout plan={plan} billingCycle="monthly" />);
    fireEvent.click(screen.getByRole("checkbox"));
    await applyCoupon("save10"); // validation pending

    const pay = screen.getByRole("button", { name: /pay ₹899 \/ month/i });
    expect(pay).toBeDisabled();
    fireEvent.click(pay);
    resolveCoupon(validCoupon);
    await screen.findByText("Coupon (SAVE10)");
    resolveOrder?.(order(89900)); // a no-coupon order, if one was sent
    await new Promise((r) => setTimeout(r, 0));

    expectOpenedOnlyForShownTotal();
    expect(mocks.createPaymentOrder).not.toHaveBeenCalled();
    // Once the quote is in, paying uses the discounted total.
    expect(screen.getByRole("button", { name: /pay ₹809\.1 \/ month/i })).toBeEnabled();
  });

  it("drops an applied coupon when the plan changes", async () => {
    mocks.validateCoupon.mockResolvedValue(validCoupon);
    const { rerender } = render(<PaymentCheckout plan={plan} billingCycle="monthly" />);
    await applyCoupon("save10");
    await screen.findByText("Coupon (SAVE10)");

    rerender(<PaymentCheckout plan={{ ...plan, id: "premium", name: "Premium", price_inr_monthly: 1999 }} billingCycle="monthly" />);

    await waitFor(() => expect(screen.queryByText("Coupon (SAVE10)")).not.toBeInTheDocument());
    expect(screen.getByText("₹1,999", { selector: "p.text-2xl" })).toBeInTheDocument();
  });
});
