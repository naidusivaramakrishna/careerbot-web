import { extractErrorMessage } from './helpers';

const CREDIT_MESSAGE =
  "You don't have enough credits to analyze this resume. Please upgrade your plan or purchase credits.";

export function buildAtsReportRoute(resumeId?: string): string {
  return resumeId ? `/atslogin/report?resume_id=${resumeId}` : '/atslogin/report';
}

function isScanFailurePayload(value: unknown): value is { success?: boolean; error?: unknown } {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'success' in value &&
      (value as { success?: unknown }).success === false
  );
}

function normalizeCreditError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('credit') ||
    normalized.includes('quota') ||
    normalized.includes('insufficient') ||
    normalized.includes('limit exceeded') ||
    normalized.includes('payment required') ||
    normalized.includes('402')
  ) {
    return CREDIT_MESSAGE;
  }

  return message;
}

export function normalizeResumeScanError(
  err: unknown,
  fallback = 'Unable to process your resume. Please try again.'
): string {
  if (isScanFailurePayload(err)) {
    const rawError = err.error;

    if (typeof rawError === 'string') {
      return normalizeCreditError(rawError);
    }

    if (rawError && typeof rawError === 'object' && 'message' in rawError) {
      const message = String((rawError as { message?: unknown }).message ?? '');
      if (message) return normalizeCreditError(message);
    }
  }

  return normalizeCreditError(extractErrorMessage(err, fallback));
}
