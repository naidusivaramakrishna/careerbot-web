/**
 * Unit tests for src/api/chatbotApi.ts's escalateToSupport -- specifically
 * that issue_type (the finer-grained subcategory within affected_feature,
 * e.g. "forgot_password" under account_organization) actually reaches the
 * real POST /tickets/create body, for both the guest and authenticated
 * request shapes.
 *
 * Root-cause regression test: EscalationIssueDetails.issue_type and the UI
 * that collects it (ticketIssueType) existed well before buildTicketBody()
 * was updated to forward it -- the field was collected, placed into the
 * EscalationRequest passed to escalateToSupport(), and then silently
 * dropped before the request ever left the browser. Component-level tests
 * that mock escalateToSupport() away (e.g. SupportTicketPortalPage.test.tsx)
 * can't catch that: they only prove the component calls escalateToSupport
 * with issue_details.issue_type set, not that escalateToSupport's own
 * buildTicketBody() actually includes it in the real HTTP payload. This
 * file exercises the real escalateToSupport implementation end to end,
 * asserting on the exact body handed to httpClient.post.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const postMock = vi.fn();
vi.mock("@/lib/http", () => ({
  httpClient: {
    post: (...args: unknown[]) => postMock(...args),
    defaults: { baseURL: "https://backend.example.com/api/v1" },
  },
}));

let mockAuthenticated = false;
vi.mock("@/api/chatbotAuth", () => ({
  isUserAuthenticated: () => mockAuthenticated,
}));

vi.mock("@/api/authApi", () => ({
  refreshAccessToken: vi.fn(),
}));

import { escalateToSupport } from "@/api/chatbotApi";

const successResponse = {
  data: {
    success: true,
    ticket_id: "CB-00123",
    status: "open",
    message: "Created",
  },
};

describe("escalateToSupport -- issue_type reaches the real request body", () => {
  beforeEach(() => {
    postMock.mockReset().mockResolvedValue(successResponse);
    mockAuthenticated = false;
  });

  it("guest payload includes issue_type when a subcategory was picked", async () => {
    await escalateToSupport({
      issue_category: "account_organization",
      issue_title: "Cannot reset my password",
      issue_description: "I forgot my password and the reset link never arrives",
      contact_email: "guest@example.com",
      issue_details: {
        user_type: "student",
        requester_name: "Guest User",
        issue_type: "forgot_password",
        verification_token: "tok_123",
      },
    });

    expect(postMock).toHaveBeenCalledTimes(1);
    const [, body] = postMock.mock.calls[0];
    expect(body.issue_type).toBe("forgot_password");
    // Confirms the guest shape, not the authenticated one, was used.
    expect(body.email).toBe("guest@example.com");
  });

  it("guest payload omits issue_type entirely when no subcategory was picked", async () => {
    await escalateToSupport({
      issue_category: "account_organization",
      issue_title: "Cannot reset my password",
      issue_description: "I forgot my password and the reset link never arrives",
      contact_email: "guest@example.com",
      issue_details: {
        user_type: "student",
        requester_name: "Guest User",
        verification_token: "tok_123",
      },
    });

    const [, body] = postMock.mock.calls[0];
    expect(body.issue_type).toBeUndefined();
    expect("issue_type" in body).toBe(false);
  });

  it("authenticated payload includes issue_type when a subcategory was picked", async () => {
    mockAuthenticated = true;

    await escalateToSupport({
      issue_category: "ai_resume_builder",
      issue_title: "Resume export is failing",
      issue_description: "The PDF export button does nothing when clicked",
      issue_details: {
        issue_type: "generation_error",
      },
    });

    const [, body] = postMock.mock.calls[0];
    expect(body.issue_type).toBe("generation_error");
    // Confirms the authenticated shape, not the guest one, was used.
    expect(body.email).toBeUndefined();
    expect(body.user_type).toBeUndefined();
  });

  it("a caller-confirmed mode wins over the local marker (guest form shown -> guest shape sent)", async () => {
    mockAuthenticated = true;
    await escalateToSupport({
      issue_category: "account_organization",
      issue_title: "Cannot reset my password",
      issue_description: "I forgot my password and the reset link never arrives",
      contact_email: "guest@example.com",
      authenticated: false,
      issue_details: { user_type: "student", requester_name: "Guest User", verification_token: "tok_123" },
    });
    const [, body] = postMock.mock.calls[0];
    expect(body.email).toBe("guest@example.com");
    expect(body.user_type).toBe("student");
    expect("authenticated" in body).toBe(false);
  });

  it("authenticated payload omits issue_type entirely when no subcategory was picked", async () => {
    mockAuthenticated = true;

    await escalateToSupport({
      issue_category: "ai_resume_builder",
      issue_title: "Resume export is failing",
      issue_description: "The PDF export button does nothing when clicked",
      issue_details: {},
    });

    const [, body] = postMock.mock.calls[0];
    expect(body.issue_type).toBeUndefined();
    expect("issue_type" in body).toBe(false);
  });

  it("issue_type travels independently of original_question/chatbot_answer -- neither substitutes for the other", async () => {
    mockAuthenticated = true;

    await escalateToSupport({
      issue_category: "ai_resume_builder",
      issue_title: "Resume export is failing",
      issue_description: "The PDF export button does nothing when clicked",
      issue_details: {
        issue_type: "generation_error",
        original_question: "Why does my resume export fail?",
        chatbot_answer: "Try re-saving your resume and exporting again.",
      },
    });

    const [, body] = postMock.mock.calls[0];
    expect(body.issue_type).toBe("generation_error");
    expect(body.original_question).toBe("Why does my resume export fail?");
    expect(body.chatbot_answer).toBe("Try re-saving your resume and exporting again.");
  });
});
