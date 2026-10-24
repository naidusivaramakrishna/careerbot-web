/**
 * Invariant: the http.ts 401 interceptor refreshes through the Next proxy
 * routes, never by calling /api/v1/auth/refresh directly.
 *
 * In production nginx sends /api/v1/ straight to the backend. Refreshing there
 * skipped the proxy, so the refresh token came back in a JS-readable body and
 * the rotated cookie was set on a second path next to the sanitised '/api'
 * one, after which the browser could send the stale token (PR #258 review).
 *
 * These drive the real interceptor through a fake axios adapter.
 */
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { httpClient } from "@/lib/http";

type Call = { method?: string; url?: string; baseURL?: string };

const realAdapter = httpClient.defaults.adapter;
let calls: Call[];

/** 401 for the first call to `failing`, `refreshStatus` for refreshes, else 200. */
function useFakeBackend(failing: string, refreshStatus = 200) {
  let failed = false;
  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    // GETs carry a ?_t= cache-buster from the request interceptor.
    const path = config.url?.split("?")[0];
    calls.push({ method: config.method, url: path, baseURL: config.baseURL });
    let status = 200;
    if (path === failing && !failed) {
      failed = true;
      status = 401;
    } else if (config.url?.includes("/auth/refresh")) {
      status = refreshStatus;
    }
    const response = { data: { ok: status === 200 }, status, statusText: "", headers: {}, config };
    if (status >= 400) {
      throw Object.assign(new Error(`HTTP ${status}`), { config, response, isAxiosError: true });
    }
    return response;
  };
  httpClient.defaults.adapter = adapter;
}

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  httpClient.defaults.adapter = realAdapter;
});

describe("401 interceptor refresh endpoint", () => {
  it("refreshes a user session through /api/backend/auth/refresh and retries", async () => {
    useFakeBackend("/users/me");

    const res = await httpClient.get("/users/me");

    expect(res.status).toBe(200);
    expect(calls.map((c) => c.url)).toEqual([
      "/users/me",
      "/api/backend/auth/refresh",
      "/users/me",
    ]);
    expect(calls[1]).toMatchObject({ method: "post", baseURL: "" });
  });

  it("refreshes an admin session through /api/backend/admin/auth/refresh", async () => {
    useFakeBackend("/admin/users");

    await httpClient.get("/admin/users");

    expect(calls.map((c) => c.url)).toEqual([
      "/admin/users",
      "/api/backend/admin/auth/refresh",
      "/admin/users",
    ]);
  });

  it("does not refresh again when the refresh call itself returns 401", async () => {
    useFakeBackend("/users/me", 401);

    await expect(httpClient.get("/users/me")).rejects.toBeTruthy();

    expect(calls.filter((c) => c.url?.includes("/auth/refresh"))).toHaveLength(1);
  });
});

describe("sign-in link after a failed refresh", () => {
  const realLocation = window.location;

  function stubLocation(pathname: string, search = "") {
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { pathname, search, hash: "", href: `${pathname}${search}` },
    });
  }

  afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, writable: true, value: realLocation });
    localStorage.clear();
    sessionStorage.clear();
  });

  it("never puts an /auth page in next (it made the success page loop)", async () => {
    stubLocation("/auth/google/success", "?code=x");
    useFakeBackend("/users/me", 401);

    await expect(httpClient.get("/users/me")).rejects.toBeTruthy();

    expect(window.location.href).toBe("/?showLogin=true");
  });

  it("keeps an ordinary page in next", async () => {
    stubLocation("/jobs", "?q=python");
    useFakeBackend("/users/me", 401);

    await expect(httpClient.get("/users/me")).rejects.toBeTruthy();

    expect(window.location.href).toBe("/?showLogin=true&next=%2Fjobs%3Fq%3Dpython");
  });
});
