'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { InstitutionApiError } from '@/api/institutionApi';
import { ERROR_MESSAGES, NO_SEATS_HINT } from '@/lib/institutionMessages';
import type { InstitutionErrorReason } from '@/lib/institutionMessages';

/**
 * Renders a failed request, branching on the canonical `reason` — never on the
 * backend's free text.
 *
 * The read-only reasons (paused, expired, trial ended) are handled elsewhere
 * (`PausedBanner`), because they are a persistent state of the college rather
 * than a failure of this screen; if one reaches here it renders as calm information, not as a red
 * error. `error_id` is surfaced only for the failures a user cannot act on, so
 * they have something to quote to support.
 */
/**
 * What to actually show a person.
 *
 * The server's message is written for whoever reads the logs. A student who
 * opened the wrong screen was shown "role student may not perform
 * read_students" -- true, and meaningless to them: it names an internal
 * policy action and tells them nothing they can do.
 *
 * So for refusals the curated copy wins. For INPUT errors it does not: there
 * the server names the field and the reason ("admission_number cannot be
 * blank"), which is exactly what the person needs, and replacing it with
 * "Check the form" would throw away the useful part.
 */
const SERVER_MESSAGE_IS_USEFUL = new Set<InstitutionErrorReason>([
  'INVALID_REQUEST',
  'NOT_FOUND',
  // A 409 names what collided ("this person already has an active hod role"),
  // which is the whole message; the generic copy would throw it away.
  'CONFLICT',
  // Says which seat case it is (all in use / seat year ended / college being
  // moved onto seats); each asks for a different next step.
  'NO_SEATS_LEFT',
]);

/** Capitalise the first letter and end with a full stop; the seat sentences
 *  arrive as a lower-case clause with no closing punctuation. */
function asSentence(text: string): string {
  const trimmed = text.trim();
  const capitalised = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(capitalised) ? capitalised : `${capitalised}.`;
}

export function displayMessage(error: InstitutionApiError): string {
  if (SERVER_MESSAGE_IS_USEFUL.has(error.reason) && error.message) {
    // The seat sentences start lower-case with no full stop (they read as one
    // clause after a reason); the others are shown exactly as sent.
    return error.reason === 'NO_SEATS_LEFT' ? asSentence(error.message) : error.message;
  }
  return ERROR_MESSAGES[error.reason] || error.message || 'Something went wrong.';
}

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
  // No seats left is a state of the college to act on, not a failure.
  const variant = isSubscriptionState || error.reason === 'NO_SEATS_LEFT'
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
          {displayMessage(error)}
        </span>
        {showSupportRef ? (
          <span className="mt-1 block text-[12px] leading-4 opacity-80">
            Reference {error.errorId}
          </span>
        ) : null}
        <NoSeatsHint error={error} />
        {retryable && onRetry ? (
          // type="button": a notice inside a <form> (the assignments roster)
          // must retry, not also submit the form and assign the ticked rows.
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
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
      variant={error.isReadOnlyState || error.reason === 'NO_SEATS_LEFT' ? 'warning' : 'destructive'}
      className="mb-4"
      role="alert"
    >
      <AlertDescription className="text-[13px] font-medium">
        {displayMessage(error)}
        <NoSeatsHint error={error} />
      </AlertDescription>
    </Alert>
  );
}

function NoSeatsHint({ error }: { error: InstitutionApiError }) {
  if (error.reason !== 'NO_SEATS_LEFT') return null;
  return (
    <span className="mt-1 block text-[12px] font-normal leading-4 opacity-80">
      {NO_SEATS_HINT}
    </span>
  );
}
