import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAuthenticated: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/api/authApi", () => ({
  isAuthenticated: mocks.isAuthenticated,
  signOut: mocks.signOut,
}));

import { useAuth } from "@/hooks/useAuth";

afterEach(() => {
  vi.clearAllMocks();
});

describe("useAuth", () => {
  it("probes isAuthenticated with skipAuthRedirect so a 401 does not trigger a login redirect", async () => {
    // Regression guard: useAuth backs components mounted on public landing
    // pages (/jobs, /ats, /mock-interview, /payments) that an anonymous
    // visitor can legitimately land on. Without this flag, the shared axios
    // interceptor would redirect them to the login page on a 401.
    mocks.isAuthenticated.mockResolvedValue(false);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mocks.isAuthenticated).toHaveBeenCalledWith({ skipAuthRedirect: true });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("resolves isAuthenticated=true once the probe succeeds", async () => {
    mocks.isAuthenticated.mockResolvedValue(true);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("falls back to isAuthenticated=false when the probe rejects", async () => {
    mocks.isAuthenticated.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
  });
});
