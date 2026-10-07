"use client";

/**
 * Counts uncaught browser errors into web_client_errors_total (roadmap B8).
 *
 * Sends ONLY {"kind": "<js_error|unhandled_rejection|chunk_load>"} — never the
 * message, stack, URL or anything about the user. The message is inspected
 * locally just to recognise a ChunkLoadError, then discarded.
 *
 * Capped per page load so one error loop cannot flood the endpoint; the
 * server also rate-limits (src/lib/observability/clientErrorLimits.ts).
 */
import { useEffect } from "react";

import { classifyClientError, type ClientErrorKind } from "@/lib/observability/clientErrorKind";

export const CLIENT_ERROR_ENDPOINT = "/api/internal/client-error";
export const MAX_REPORTS_PER_KIND = 3;
export const MAX_REPORTS_PER_PAGE = 10;

export function createClientErrorSender(send: (body: string) => void) {
  const perKind: Record<string, number> = {};
  let total = 0;
  return (kind: ClientErrorKind): boolean => {
    if (total >= MAX_REPORTS_PER_PAGE || (perKind[kind] ?? 0) >= MAX_REPORTS_PER_KIND) return false;
    perKind[kind] = (perKind[kind] ?? 0) + 1;
    total += 1;
    send(JSON.stringify({ kind }));
    return true;
  };
}

function beacon(body: string): void {
  try {
    // text/plain keeps sendBeacon a "simple" request (no CORS preflight).
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      if (navigator.sendBeacon(CLIENT_ERROR_ENDPOINT, new Blob([body], { type: "text/plain" }))) return;
    }
    void fetch(CLIENT_ERROR_ENDPOINT, {
      method: "POST",
      body,
      keepalive: true,
      headers: { "Content-Type": "text/plain" },
    }).catch(() => undefined);
  } catch {
    // Telemetry must never surface as a new error inside the error handler.
  }
}

export default function ClientErrorReporter() {
  useEffect(() => {
    const report = createClientErrorSender(beacon);

    const onError = (event: ErrorEvent) => {
      report(classifyClientError("error", event.error, event.message));
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      report(classifyClientError("unhandledrejection", event.reason));
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
