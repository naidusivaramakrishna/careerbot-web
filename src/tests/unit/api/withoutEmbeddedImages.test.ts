import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/authApi", () => ({ isAuthenticated: vi.fn() }));
vi.mock("@/api/enhancerApi", () => ({ enhanceResume: vi.fn() }));
vi.mock("@/api/parserApi", () => ({ getResume: vi.fn() }));

import { withoutEmbeddedImages } from "@/api/resumeatsapi";

describe("withoutEmbeddedImages", () => {
  it("drops data-URL images anywhere, large strings under image keys, and byte arrays under image keys", () => {
    const input = {
      contact: { name: "Avery", profile_picture: "data:image/png;base64,AAAA", photo: "x".repeat(4096) },
      sections: [{ title: "Education", thumbnail: "data:image/jpeg;base64,BBBB" }],
      image_bytes: Array.from({ length: 300 }, (_, i) => i % 256),
      notes: "short text",
    };

    expect(withoutEmbeddedImages(input)).toEqual({
      contact: { name: "Avery" },
      sections: [{ title: "Education" }],
      notes: "short text",
    });
  });

  it("keeps short values under image-like keys and drops any string over 128 KB", () => {
    expect(withoutEmbeddedImages({ avatar: "https://cdn.example.com/a.png", blob: "y".repeat(128 * 1024 + 1) }))
      .toEqual({ avatar: "https://cdn.example.com/a.png" });
  });
});
