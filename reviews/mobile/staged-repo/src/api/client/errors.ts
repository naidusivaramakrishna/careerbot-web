// Single source of truth for turning a backend error into a user-facing string.
//
// Handles CareerBot's four documented response shapes:
//   1. CareerBot envelope:  { success: false, error: { message, details: { validation_errors: [...] } } }
//   2. FastAPI validation:  { detail: [ { loc, msg }, ... ] }   (HTTP 422)
//   3. Flat variants:       { detail: "..." } | { message: "..." } | { error: "..." }
//   4. Plain string
//
// Ported + merged from POC:
//   src/API/utils/extractApiErrorMessage.js
//   src/API/utils/apiErrors.js
// Direct port (TS types + minor consolidation).

import axios from 'axios';

const DEFAULT_FALLBACK = 'Something went wrong. Please try again.';

interface ValidationItem {
  msg?: string;
  message?: string;
  detail?: string;
  loc?: unknown[];
  field?: string;
}

interface BackendErrorEnvelope {
  message?: string;
  error_code?: string;
  details?: { validation_errors?: ValidationItem[] };
}

interface ApiErrorBody {
  success?: boolean;
  error?: BackendErrorEnvelope | string;
  detail?: string | ValidationItem[];
  message?: string;
}

function joinValidationErrors(list: unknown): string {
  if (!Array.isArray(list)) return '';

  return list
    .map((item: unknown) => {
      if (!item) return '';
      if (typeof item === 'string') return item;
      if (typeof item !== 'object') return '';

      const validationItem = item as ValidationItem;
      const message = validationItem.msg ?? validationItem.message ?? validationItem.detail;
      if (typeof message !== 'string') return '';

      const location = Array.isArray(validationItem.loc)
        ? validationItem.loc.filter((part) => part !== 'body').join('.')
        : validationItem.field ?? '';

      return location ? `${location}: ${message}` : message;
    })
    .filter(Boolean)
    .join(' · ');
}

/**
 * Extract a user-facing message from a parsed API response body.
 * Returns `fallback` if nothing usable is found.
 */
export function extractApiErrorMessage(data: unknown, fallback: string = DEFAULT_FALLBACK): string {
  if (!data || typeof data !== 'object') {
    return fallback;
  }

  const body = data as ApiErrorBody;

  // 1. CareerBot envelope — error is an object.
  if (body.error && typeof body.error === 'object') {
    const validation = joinValidationErrors(body.error.details?.validation_errors);
    if (validation) return validation;
    if (typeof body.error.message === 'string' && body.error.message.trim()) {
      return body.error.message.trim();
    }
  }

  // 2. FastAPI 422 — detail is an array of validation errors.
  if (Array.isArray(body.detail)) {
    const validation = joinValidationErrors(body.detail);
    if (validation) return validation;
  }

  // 3. Flat string variants.
  if (typeof body.detail === 'string' && body.detail.trim()) return body.detail.trim();
  if (typeof body.message === 'string' && body.message.trim()) return body.message.trim();
  if (typeof body.error === 'string' && body.error.trim()) return body.error.trim();

  return fallback;
}

export interface ApiErrorOptions {
  /**
   * When true, a 401 means "wrong email/password" (sign-in flow) rather than
   * "your session has expired" (any authenticated request whose token went stale).
   */
  credentials?: boolean;
}

/**
 * High-level error → message helper for screens. Handles axios errors,
 * regular Errors, plain strings, and unknown shapes.
 */
export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string = DEFAULT_FALLBACK,
  options: ApiErrorOptions = {},
): string {
  if (!error) return fallbackMessage;

  if (axios.isAxiosError(error)) {
    const { response, code, message } = error;
    const backendText = extractApiErrorMessage(response?.data, '');

    if (response?.status === 401) {
      if (options.credentials) {
        return backendText || 'Invalid email or password.';
      }
      return 'Your session has expired. Please sign in again.';
    }

    if (response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }

    if (response?.status === 404) {
      return 'The requested resource was not found.';
    }

    if (response?.status && response.status >= 500) {
      return 'Server error. Please try again later.';
    }

    if (backendText) return backendText;

    if (code === 'ECONNABORTED') {
      return 'Request timed out. Please check your connection and try again.';
    }

    if (code === 'ENOTFOUND' || code === 'ECONNREFUSED') {
      return 'Unable to reach the server. Please check your internet connection.';
    }

    if (message) return message;
  }

  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;

  return fallbackMessage;
}
