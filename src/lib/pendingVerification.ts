/**
 * The unverified-signup record SignUpModal writes and VerificationRecovery
 * shows as a banner on every route (ClientLayout).
 *
 * Same key as OTPVerificationInput's PENDING_VERIFICATION_KEY; kept here so
 * authApi can clear it without importing a React component.
 */
export const PENDING_VERIFICATION_STORAGE_KEY = 'pendingEmailVerification';

/** Fired on window after the record is removed, so a mounted banner hides. */
export const PENDING_VERIFICATION_CLEARED_EVENT = 'pendingEmailVerificationCleared';

/**
 * Remove the record at a session hand-over (sign-in success, sign-out).
 * careerbot-api only issues a session to a verified account, so a record left
 * at that point is either stale or another person's signup on this browser.
 */
export const clearPendingVerification = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PENDING_VERIFICATION_STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode / blocked): nothing to clear.
  }
  window.dispatchEvent(new Event(PENDING_VERIFICATION_CLEARED_EVENT));
};
