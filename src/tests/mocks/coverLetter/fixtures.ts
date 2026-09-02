/**
 * Cover-letter contract-fixture loader.
 *
 * Reads checked-in JSON snapshots captured from the live-smoked
 * careerbot-api backend (2026-05-25) and re-exports them as typed
 * objects. These fixtures are the FE's contract-drift backstop
 * (Codex impl-blueprint P1#2): if the backend ever changes the
 * CL-1.2 response shape, the api-client test that parses these
 * snapshots FAILS FIRST — before any UI test or live integration.
 *
 * Adding a new fixture:
 *   1. Drop a JSON file under ./fixtures/ (mirror the live shape
 *      exactly; do NOT hand-trim fields).
 *   2. Export it here with a typed assertion of its expected
 *      shape (CoverLetterResponse / CoverLetterListResponse / etc).
 *   3. The api-client test in WEB-1.2 round-trips every fixture
 *      and asserts no parse error.
 *
 * Spec: cover-letter-docs/COVER_LETTER_FRONTEND_IMPLEMENTATION_BLUEPRINT_2026_05_25.txt §9 WEB-1.2.
 */
import type {
  CoverLetterResponse,
  CoverLetterListResponse,
} from "@/types/coverLetter";

import readyJson from "./fixtures/cl_ready_to_review.json";
import needsJson from "./fixtures/cl_needs_review.json";
import failedJson from "./fixtures/cl_failed_low_jd_match.json";
import listEmptyJson from "./fixtures/cl_list_empty.json";
import list3ItemsJson from "./fixtures/cl_list_3_items.json";
import listWithCursorJson from "./fixtures/cl_list_with_next_cursor.json";

// Backend-error response shape (wrapped: { success: false, error: ... }).
// Not a CL-1.2 success shape; declared here for the api-client test
// to verify the error mapper handles each one correctly.
export interface BackendErrorResponse {
  success: false;
  error: {
    message: string;
    error_code: string;
    error_id?: string;
    request_id?: string;
    timestamp?: string;
    path?: string;
    details?: {
      validation_errors?: Array<{
        field: string;
        message: string;
        type?: string;
      }>;
    };
  };
}

import error422Json from "./fixtures/backend_422_validation.json";
import error502Json from "./fixtures/backend_502_contract.json";
import error503Json from "./fixtures/backend_503.json";
import error504Json from "./fixtures/backend_504.json";

// Typed re-exports. The `as unknown as <T>` cast is intentional:
// the JSON-import types are `Record<string, unknown>` and we
// want strong typing in tests. The contract is exercised by the
// api-client test that parses these through the real types —
// any structural mismatch fails THERE, not here.
export const CL_FIXTURES = {
  readyToReview: readyJson as unknown as CoverLetterResponse,
  needsReview: needsJson as unknown as CoverLetterResponse,
  failedLowJdMatch: failedJson as unknown as CoverLetterResponse,
  listEmpty: listEmptyJson as unknown as CoverLetterListResponse,
  list3Items: list3ItemsJson as unknown as CoverLetterListResponse,
  listWithCursor: listWithCursorJson as unknown as CoverLetterListResponse,
} as const;

export const CL_ERROR_FIXTURES = {
  validation422: error422Json as unknown as BackendErrorResponse,
  contract502: error502Json as unknown as BackendErrorResponse,
  unavailable503: error503Json as unknown as BackendErrorResponse,
  timeout504: error504Json as unknown as BackendErrorResponse,
} as const;
