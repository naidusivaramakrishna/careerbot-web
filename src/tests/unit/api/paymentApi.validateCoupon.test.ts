import { beforeEach, describe, expect, it, vi } from "vitest";

// validateCoupon must send plan_id + billing_cycle (the backend then prices the
// plan from its catalog) and keep amount_inr for an older backend.

const mockHttp = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("@/lib/http", () => ({ default: mockHttp, httpClient: mockHttp }));

import { validateCoupon } from "@/api/paymentApi";

function sentParams(): URLSearchParams {
  const url: string = mockHttp.post.mock.calls[0][0];
  return new URLSearchParams(url.split("?")[1]);
}

describe("validateCoupon", () => {
  beforeEach(() => {
    mockHttp.post.mockReset();
    mockHttp.post.mockResolvedValue({ data: { is_valid: true } });
  });

  it("sends plan_id, billing_cycle and the legacy amount_inr", async () => {
    await validateCoupon("SAVE10", 8990, "pro", "yearly");
    const params = sentParams();
    expect(mockHttp.post.mock.calls[0][0]).toMatch(/^\/api\/v1\/payments\/validate-coupon\?/);
    expect(params.get("code")).toBe("SAVE10");
    expect(params.get("plan_id")).toBe("pro");
    expect(params.get("billing_cycle")).toBe("yearly");
    expect(params.get("amount_inr")).toBe("8990");
  });

  it("omits billing_cycle and plan_id when not given", async () => {
    await validateCoupon("SAVE10", 49);
    const params = sentParams();
    expect(params.has("billing_cycle")).toBe(false);
    expect(params.has("plan_id")).toBe(false);
  });
});
