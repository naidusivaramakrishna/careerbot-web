/**
 * Invariant: the post-login target is an in-app page that is NOT part of the
 * sign-in flow, and never another host.
 *
 * 2026-10-24 staging: the 401 handler sent the user to
 * /?showLogin=true&next=/auth/google/success; Google sign-in stored that as the
 * target, and the success page then navigated to itself about once per second
 * (1,700+ loads) instead of opening the dashboard.
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  AUTH_REDIRECT_STORAGE_KEY,
  DEFAULT_AUTH_REDIRECT,
  getStoredAuthRedirect,
  sanitizeAuthRedirect,
} from "@/lib/authRedirect";

describe("sanitizeAuthRedirect", () => {
  it.each([
    ["/jobs", "/jobs"],
    ["/ats/report?id=1#top", "/ats/report?id=1#top"],
    ["/authors-page", "/authors-page"],
  ])("keeps in-app page %s", (input, expected) => {
    expect(sanitizeAuthRedirect(input)).toBe(expected);
  });

  it.each([
    "/auth/google/success",
    "/auth/linkedin/success",
    "/auth/error?message=x",
    "/auth",
    "/jobs/../auth/google/success",
  ])("refuses sign-in flow page %s", (input) => {
    expect(sanitizeAuthRedirect(input)).toBe(DEFAULT_AUTH_REDIRECT);
  });

  it.each([
    "//evil.com",
    "/..//evil.com",
    "https://evil.com/x",
    "",
    null,
    undefined,
  ])("refuses off-site or empty value %s", (input) => {
    expect(sanitizeAuthRedirect(input)).toBe(DEFAULT_AUTH_REDIRECT);
  });
});

describe("getStoredAuthRedirect", () => {
  afterEach(() => sessionStorage.clear());

  it("does not return the Google success page even when it was stored", () => {
    sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, "/auth/google/success");
    expect(getStoredAuthRedirect()).toBe(DEFAULT_AUTH_REDIRECT);
  });

  it("returns a stored in-app page", () => {
    sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, "/cover-letter");
    expect(getStoredAuthRedirect()).toBe("/cover-letter");
  });
});
