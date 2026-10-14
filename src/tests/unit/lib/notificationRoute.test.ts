import { describe, expect, it } from "vitest";
import { isNotificationClickable, resolveNotificationRoute } from "@/lib/notificationRoute";

const route = (action_url: string, type = "system") => resolveNotificationRoute({ type, action_url });

describe("resolveNotificationRoute — interview prep routes", () => {
  it.each([
    ["/prep/notes", "/prep/notes"],
    ["/prep/english", "/prep/english"],
    ["/prep/managerial", "/prep/managerial"],
    ["/prep/technical", "/prep/technical"],
  ])("keeps the current route %s", (url, expected) => {
    expect(route(url)).toBe(expected);
  });

  it.each([
    ["/notes/generate", "/prep/notes"],
    ["/notes/english", "/prep/english"],
    ["/notes/managerial", "/prep/managerial"],
    ["/notes/technical", "/prep/technical"],
    ["/notes/generate?resume=1", "/prep/notes?resume=1"],
  ])("translates the legacy stored URL %s to %s", (legacy, expected) => {
    expect(route(legacy)).toBe(expected);
  });

  it("does not rewrite unrelated paths that merely start with /notes", () => {
    expect(route("/notesfoo")).toBeNull();
    expect(isNotificationClickable({ type: "system", action_url: "/notesfoo" })).toBe(false);
  });

  it("still ignores unknown paths and falls back by type", () => {
    expect(route("/prep/unknown", "system")).toBeNull();
    expect(route("/prep/unknown", "job")).toBe("/jobslogin");
  });
});
