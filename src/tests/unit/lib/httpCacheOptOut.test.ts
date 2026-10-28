import { describe, it, expect } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";
import { httpClient } from "@/lib/http";

// Capture the final request config instead of sending it.
async function captureRequest(headers?: Record<string, string>) {
  let captured: InternalAxiosRequestConfig | undefined;
  await httpClient.get("/cover-letter/templates/classic/preview", {
    headers,
    adapter: async (config) => {
      captured = config;
      return { data: new Blob(), status: 200, statusText: "OK", headers: {}, config };
    },
  });
  return captured as InternalAxiosRequestConfig;
}

describe("http client cache handling", () => {
  it("busts the cache for ordinary GET requests", async () => {
    const config = await captureRequest();
    expect(config.url).toMatch(/[?&]_t=\d+/);
    expect(config.headers.get("Cache-Control")).toContain("no-store");
  });

  it("lets a request opt back in to HTTP caching and never sends the opt-in header", async () => {
    const config = await captureRequest({ "X-Allow-Http-Cache": "true" });
    expect(config.url).not.toMatch(/_t=/);
    expect(config.headers.get("Cache-Control")).toBeFalsy();
    expect(config.headers.get("X-Allow-Http-Cache")).toBeFalsy();
  });
});
