'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { InstitutionApiError } from '@/api/institutionApi';
import { ERROR_MESSAGES } from '@/lib/institutionMessages';

/**
 * Renders a failed request, branching on the canonical `reason` — never on the
 * backend's free text.
 *
 * The two subscription reasons are handled elsewhere (`PausedBanner`), because
 * they are a persistent state of the college rather than a failure of this
 * screen; if one reaches here it renders as calm information, not as a red
 * error. `error_id` is surfaced only for the failures a user cannot act on, so
 * they have something to quote to support.
 */
export function ErrorNotice({
  error,
  onRetry,
  className,
}: {
  error: InstitutionApiError;
  onRetry?: () => void;
  className?: string;
}) {
  const isSubscriptionState = error.isReadOnlyState;
  const variant = isSubscriptionState
    ? 'warning'
    : error.reason === 'FEATURE_NOT_ENTITLED'
      ? 'default'
      : 'destructive';

  const retryable = error.reason === 'NETWORK' || error.reason === 'UNKNOWN';
  const showSupportRef = retryable && Boolean(error.errorId);

  return (
    <Alert variant={variant} className={className} role="alert">
      <AlertDescription>
        <span className="block text-[13px] font-medium leading-5">
          {error.message || ERROR_MESSAGES[error.reason]}
        </span>
        {showSupportRef ? (
          <span className="mt-1 block text-[12px] leading-4 opacity-80">
            Reference {error.errorId}
          </span>
        ) : null}
        {retryable && onRetry ? (
          <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Form-level failure: everything the server rejected that could not be pinned
 * to a single input. Field-level errors are rendered on the field itself by
 * `FormField`, so this only fires for the remainder.
 */
export function FormError({ error }: { error: InstitutionApiError | null }) {
  if (!error) return null;
  if (error.reason === 'INVALID_REQUEST' && error.fieldErrors.length > 0) return null;

  return (
    <Alert
      variant={error.isReadOnlyState ? 'warning' : 'destructive'}
      className="mb-4"
      role="alert"
    >
      <AlertDescription className="text-[13px] font-medium">
        {error.message || ERROR_MESSAGES[error.reason]}
      </AlertDescription>
    </Alert>
  );
}
