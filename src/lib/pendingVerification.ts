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

/** Fired on window after the record is written, so a mounted banner re-reads it. */
export const PENDING_VERIFICATION_UPDATED_EVENT = 'pendingEmailVerificationUpdated';

export interface PendingVerificationRecord {
  userId: string;
  email: string;
  pendingVerification: true;
  timestamp: number;
}

/**
 * Write the record after signup. ClientLayout keeps VerificationRecovery
 * mounted across client-side navigation and it only reads storage on mount,
 * so it is told about the new record; otherwise a user who closes the modal
 * sees no banner until a full reload. Never put the password in here.
 */
export const savePendingVerification = (record: Pick<PendingVerificationRecord, 'userId' | 'email'>): void => {
  if (typeof window === 'undefined') return;
  const value: PendingVerificationRecord = {
    userId: record.userId,
    email: record.email,
    pendingVerification: true,
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(PENDING_VERIFICATION_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode / blocked): no recovery banner.
    return;
  }
  window.dispatchEvent(new Event(PENDING_VERIFICATION_UPDATED_EVENT));
};

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
