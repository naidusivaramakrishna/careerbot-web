import { httpClient } from "@/lib/http";

export interface ApplicationData {
  cover_letter: string;
  experience_years: string;
  notice_period: string;
  phone_number: string;
}

export type ApplyStatus =
  | "applied"          // 201 — new application accepted
  | "already_applied"  // 409 — duplicate, treated as success for UI
  | "validation_error" // client-side or 422 — bad input
  | "auth_error"       // 401 — not logged in
  | "server_error";    // 4xx/5xx/network — generic failure

export interface ApplyResult {
  success: boolean;   // true for 'applied' and 'already_applied'
  status: ApplyStatus;
  message: string;    // ready-to-display user message
}

// Accepts 10-digit local numbers OR numbers with a country code (e.g. +91 prefix).
// Strips all non-digit characters first, then validates.
function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  // 10 digits (local) or 11-15 digits (with country code)
  return digits.length >= 10 && digits.length <= 15;
}

export async function applyToJob(
  jobId: string,
  data: ApplicationData
): Promise<ApplyResult> {
  // ── Client-side validation ───────────────────────────────────────────────
  // All validation returns a result object with a message — NO toast() calls.
  // The caller (handleModalSubmit) is responsible for showing UI feedback.

  if (!data.phone_number?.trim()) {
    return {
      success: false,
      status: "validation_error",
      message: "Phone number is required.",
    };
  }

  if (!isValidPhone(data.phone_number)) {
    return {
      success: false,
      status: "validation_error",
      message: "Please enter a valid phone number (e.g. +91-9876543210 or 9876543210).",
    };
  }

  if (!data.experience_years?.trim()) {
    return {
      success: false,
      status: "validation_error",
      message: "Years of experience is required.",
    };
  }

  if (!data.notice_period?.trim()) {
    return {
      success: false,
      status: "validation_error",
      message: "Notice period is required.",
    };
  }

  // ── API call ─────────────────────────────────────────────────────────────
  try {
    await httpClient.post(`/jobs/${jobId}/apply`, data);

    // 201 Created — httpClient resolves on 2xx
    return {
      success: true,
      status: "applied",
      message: "Application submitted successfully!",
    };
  } catch (err: unknown) {
    const error = err as {
      response?: { status?: number; data?: Record<string, unknown> };
      message?: string;
    };

    const status = error?.response?.status;
    const body   = error?.response?.data;

    // Extract the backend's human-readable message if present
    const backendMsg =
      (body?.error as Record<string, unknown> | undefined)?.message as string | undefined
      ?? (body?.message as string | undefined)
      ?? (body?.detail as string | undefined);

    if (status === 409) {
      return {
        success: true,          // treat as success — user IS applied
        status: "already_applied",
        message: backendMsg ?? "You've already applied to this job.",
      };
    }

    if (status === 401) {
      return {
        success: false,
        status: "auth_error",
        message: "Please log in to apply.",
      };
    }

    if (status === 404) {
      return {
        success: false,
        status: "server_error",
        message: "This job is no longer available.",
      };
    }

    if (status === 422) {
      return {
        success: false,
        status: "validation_error",
        message: backendMsg ?? "Please check your application details.",
      };
    }

    return {
      success: false,
      status: "server_error",
      message: backendMsg ?? "Application failed. Please try again.",
    };
  }
}
