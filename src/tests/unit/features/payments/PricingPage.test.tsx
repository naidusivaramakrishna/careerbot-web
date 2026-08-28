import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  isAuthenticated: false,
  authLoading: false,
  subscription: null as { plan_id?: string } | null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), prefetch: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    const imgProps = { ...props };
    delete imgProps.priority;
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement("img", imgProps);
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: mocks.isAuthenticated,
    isLoading: mocks.authLoading,
    logout: vi.fn(),
  }),
}));

// The plan grid is stubbed so this file can drive onSelectPlan directly. It
// exposes what the page passes down, because currentPlanId is the whole point
// of an "auth-aware pricing page" and nothing was asserting it reached here.
//
// NOTE: PricingPlans itself has NO test file. The comment that used to sit
// here claimed it did.
vi.mock("@/components/payments/PricingPlans", () => ({
  PricingPlans: ({
    onSelectPlan,
    currentPlanId,
  }: {
    onSelectPlan: (p: { id: string; price_inr_monthly: number }) => void;
    currentPlanId?: string;
  }) => (
    <div data-testid="pricing-plans" data-current-plan={currentPlanId ?? ""}>
      <button onClick={() => onSelectPlan({ id: "pro-1", price_inr_monthly: 499 })}>
        pick paid
      </button>
      <button onClick={() => onSelectPlan({ id: "free-1", price_inr_monthly: 0 })}>
        pick free
      </button>
    </div>
  ),
}));

vi.mock("@/api/paymentApi", () => ({
  getCurrentSubscription: () => Promise.resolve(mocks.subscription),
}));

const importPricingPage = async () => (await import("@/app/payments/page")).default;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isAuthenticated = false;
  mocks.authLoading = false;
  mocks.subscription = null;
});

afterEach(() => {
  cleanup();
});

describe("PricingPage", () => {
  it("shows the free CTA and Home breadcrumb, linking home, while signed out", async () => {
    const PricingPage = await importPricingPage();
    render(<PricingPage />);

    expect(screen.getByRole("link", { name: /get started free/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /careerbot home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Pricing")).toBeInTheDocument();
  });

  it("keeps the CTA visible and suppresses the breadcrumb while the auth probe is pending", async () => {
    // Regression guard for the P1 finding: the CTA must not disappear during
    // the unknown (loading) state — only once the user is confirmed signed in.
    mocks.authLoading = true;
    const PricingPage = await importPricingPage();
    render(<PricingPage />);

    expect(screen.getByRole("link", { name: /get started free/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
    // The logo must not jump to /dashboard before signed-in is confirmed.
    expect(screen.getByRole("link", { name: /careerbot home/i })).toHaveAttribute("href", "/");
  });

  it("hides the free CTA and routes the logo/breadcrumb to the dashboard while signed in", async () => {
    mocks.isAuthenticated = true;
    const PricingPage = await importPricingPage();
    render(<PricingPage />);

    expect(screen.queryByRole("link", { name: /get started free/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return to dashboard/i })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByText("Pricing")).toBeInTheDocument();
  });

  it("links to the Terms of Service and Privacy Policy", async () => {
    const PricingPage = await importPricingPage();
    render(<PricingPage />);

    expect(screen.getByRole("link", { name: /terms of service/i })).toHaveAttribute("href", "/terms-of-service");
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute("href", "/privacy-policy");
  });

  // ---- the money path -------------------------------------------------
  // None of this was covered. handleSelectPlan decides whether a click
  // becomes a Razorpay order, and no test had ever invoked it.

  it("sends an anonymous visitor to login, carrying the plan they picked", async () => {
    // /payments is public; /payments/checkout is not. Pushing there hands the
    // visitor to the middleware, which bounces them to login and loses the
    // choice they just made.
    const PricingPage = await importPricingPage();
    render(<PricingPage />);

    screen.getByRole("button", { name: "pick paid" }).click();

    expect(mocks.push).toHaveBeenCalledWith(
      "/?showLogin=true&next=%2Fpayments%2Fcheckout%3Fplan%3Dpro-1",
    );
  });

  it("sends a signed-in visitor straight to checkout", async () => {
    mocks.isAuthenticated = true;
    const PricingPage = await importPricingPage();
    render(<PricingPage />);

    screen.getByRole("button", { name: "pick paid" }).click();

    expect(mocks.push).toHaveBeenCalledWith("/payments/checkout?plan=pro-1");
  });

  it("routes an anonymous visitor picking the free plan to login too", async () => {
    // /dashboard is protected as well, so this had the same redirect trap.
    const PricingPage = await importPricingPage();
    render(<PricingPage />);

    screen.getByRole("button", { name: "pick free" }).click();

    expect(mocks.push).toHaveBeenCalledWith("/?showLogin=true&next=%2Fdashboard");
  });

  it("holds a click made during the auth probe, then follows it through", async () => {
    // Routing on an unknown auth state is a coin toss. Dropping the click was
    // the first attempt at that and it is wrong in a quieter way: the button
    // does nothing, the visitor clicks again, and the plan is still lost.
    mocks.authLoading = true;
    const PricingPage = await importPricingPage();
    const view = render(<PricingPage />);

    screen.getByRole("button", { name: "pick paid" }).click();
    expect(mocks.push).not.toHaveBeenCalled();

    // Probe resolves — signed out, so login carrying the plan.
    mocks.authLoading = false;
    mocks.isAuthenticated = false;
    view.rerender(<PricingPage />);

    await vi.waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith(
        "/?showLogin=true&next=%2Fpayments%2Fcheckout%3Fplan%3Dpro-1",
      );
    });
  });

  it("follows a held click straight to checkout when the visitor turns out to be signed in", async () => {
    mocks.authLoading = true;
    const PricingPage = await importPricingPage();
    const view = render(<PricingPage />);

    screen.getByRole("button", { name: "pick paid" }).click();

    mocks.authLoading = false;
    mocks.isAuthenticated = true;
    view.rerender(<PricingPage />);

    await vi.waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith("/payments/checkout?plan=pro-1");
    });
  });

  it("tells the grid which plan the subscriber is already on", async () => {
    // Without this a Pro subscriber is shown "Start Pro" on the plan they
    // already pay for, and clicking it opens a live Razorpay order.
    mocks.isAuthenticated = true;
    mocks.subscription = { plan_id: "pro-1" };
    const PricingPage = await importPricingPage();
    render(<PricingPage />);

    await vi.waitFor(() => {
      expect(screen.getByTestId("pricing-plans")).toHaveAttribute("data-current-plan", "pro-1");
    });
  });

  it("claims no current plan for an anonymous visitor", async () => {
    const PricingPage = await importPricingPage();
    render(<PricingPage />);

    expect(screen.getByTestId("pricing-plans")).toHaveAttribute("data-current-plan", "");
  });
});
