/**
 * Correlation ID Management
 *
 * Generates and manages correlation IDs for tracking user sessions across API requests.
 * Correlation IDs persist for the entire browser session and are included in all API calls.
 */

import { v4 as uuidv4 } from 'uuid';

const SESSION_STORAGE_KEY = 'session_correlation_id';

/**
 * Generate a new correlation ID
 * Format: session_<12-char-uuid>
 */
function generateCorrelationId(): string {
  return `session_${uuidv4().substring(0, 12)}`;
}

/**
 * Get or create correlation ID for current session
 * - Checks sessionStorage first
 * - If not found, generates new one and stores it
 * - Returns null on server-side (SSR)
 */
export function getCorrelationId(): string | null {
  // Server-side rendering check
  if (typeof window === 'undefined') {
    return null;
  }

  // Try to get existing correlation ID from sessionStorage
  let correlationId = sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (!correlationId) {
    // Generate new correlation ID
    correlationId = generateCorrelationId();
    sessionStorage.setItem(SESSION_STORAGE_KEY, correlationId);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Correlation] New session started: ${correlationId}`);
    }
  }

  return correlationId;
}

/**
 * Clear correlation ID (useful for logout or session reset)
 */
export function clearCorrelationId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    if (process.env.NODE_ENV === 'development') {
      console.log('[Correlation] Session ID cleared');
    }
  }
}

/**
 * Get correlation ID for display purposes (e.g., error reporting UI)
 */
export function getCorrelationIdForDisplay(): string {
  const id = getCorrelationId();
  return id || 'not-initialized';
}

/**
 * Force regenerate correlation ID (useful for testing or manual session reset)
 */
export function regenerateCorrelationId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const newId = generateCorrelationId();
  sessionStorage.setItem(SESSION_STORAGE_KEY, newId);

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Correlation] Session regenerated: ${newId}`);
  }

  return newId;
}
