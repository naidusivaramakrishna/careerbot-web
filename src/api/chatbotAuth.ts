/**
 * Chatbot Authentication & Query Classification
 *
 * Handles:
 * 1. User authentication detection
 * 2. Query classification (PUBLIC vs AUTHENTICATED)
 * 3. Access control for guest vs authenticated users
 */

/**
 * Detect if the current user is authenticated
 * Returns true if user has a valid/fresh session
 */
export const isUserAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check if user has a recent token refresh
  const LAST_REFRESH_KEY = 'token_last_refreshed_at';
  const lastRefreshed = parseInt(localStorage.getItem(LAST_REFRESH_KEY) || '0', 10);
  const isSessionFresh = lastRefreshed > 0 && Date.now() - lastRefreshed < 35 * 60 * 1000;

  return isSessionFresh;
};

/**
 * Query types for classification
 */
export type QueryType = 'PUBLIC' | 'AUTHENTICATED' | 'BILLING' | 'SUPPORT_TICKET' | 'ACCOUNT';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * True when `term` occurs in `text` as a whole word/phrase (optionally
 * pluralised). Plain `includes` matched 'pro' inside "improve" and
 * "professional", which refused ordinary career questions from guests.
 */
const hasTerm = (text: string, term: string): boolean =>
  new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}(s|es)?($|[^a-z0-9])`).test(text);

const hasAnyTerm = (text: string, terms: readonly string[]): boolean =>
  terms.some((term) => hasTerm(text, term));

/**
 * Classify a user query as PUBLIC or AUTHENTICATED
 * PUBLIC: Can be answered without authentication
 * AUTHENTICATED: Requires user to be logged in
 */
export const classifyQuery = (query: string): QueryType => {
  const q = query.toLowerCase().trim();

  // Keywords for LOGIN/AUTH help (PUBLIC - everyone can get help)
  const loginKeywords = [
    'login', 'password', 'signin', 'sign in', 'forgot password', 'reset password',
    'unable to login', 'can\'t login', 'authentication', 'otp', 'verify email',
    'account locked', 'access denied', 'invalid password', 'wrong password'
  ];

  // Check for login/auth help first - these should be PUBLIC
  if (hasAnyTerm(q, loginKeywords)) {
    return 'PUBLIC';
  }

  // Personal BILLING queries: only "my <billing noun>" is gated. A bare
  // billing word is not enough -- "What enterprise roles should I target?",
  // "How do I get credit for an internship?" and "What is your refund policy?"
  // are public questions, and the backend enforces auth on personal data anyway.
  const personalBillingPhrases = [
    'my payment', 'my charge', 'my refund', 'my receipt', 'my plan',
    'my order', 'my transaction',
  ];

  // Keywords for ACCOUNT/SERVICE queries (the user's own data). Generic career
  // phrases such as "my resume" / "my application" are public questions.
  const accountKeywords = [
    'my account', 'my profile', 'my email', 'my subscription',
    'my billing', 'my invoice', 'my ticket', 'my issue', 'my service',
    'account issue', 'service issue',
    'my credit', 'account-specific', 'personalized'
  ];

  // Keywords for SUPPORT TICKET queries
  const ticketKeywords = [
    'raise ticket', 'support ticket', 'report issue', 'report problem',
    'create ticket', 'file complaint', 'escalate'
  ];

  // Check for account-specific patterns
  if (hasAnyTerm(q, accountKeywords)) {
    return 'ACCOUNT';
  }

  // Check for personal billing queries (general pricing/plan questions are PUBLIC)
  if (hasAnyTerm(q, personalBillingPhrases)) {
    return 'BILLING';
  }

  // Check for support ticket requests
  if (hasAnyTerm(q, ticketKeywords)) {
    return 'SUPPORT_TICKET';
  }

  // Default to PUBLIC for general questions
  return 'PUBLIC';
};

/**
 * Check if a query can be answered for a guest user
 */
export const canGuestAnswer = (queryType: QueryType): boolean => {
  // Guests can only get answers to PUBLIC queries
  return queryType === 'PUBLIC';
};

/**
 * Get the appropriate message for unauthorized queries
 */
export const getAuthRequiredMessage = (queryType: QueryType): string => {
  switch (queryType) {
    case 'BILLING':
      return '💳 To access your billing and subscription information, please sign in to your CareerBot account. [click here](action:login)';
    case 'ACCOUNT':
      return '👤 To access your account information and settings, please sign in to your CareerBot account. [click here](action:login)';
    case 'SUPPORT_TICKET':
      return '🎫 To raise a support ticket and get help with your account-specific issues, please sign in to your CareerBot account. [click here](action:login)';
    default:
      return '🔐 This feature requires you to be logged in to continue. [click here](action:login)';
  }
};

/**
 * Determine which backend endpoints require authentication
 */
export const isEndpointAuthenticated = (endpoint: string): boolean => {
  const publicEndpoints = [
    '/chat/message', // Can be public if filtered at frontend
    '/credits/costs', // General pricing info (public)
  ];

  const authenticatedEndpoints = [
    '/chat/tickets', // User's support tickets
    '/chat/escalate', // Create support ticket
    '/billing/summary', // User's billing info
    '/invoices', // User's invoices
  ];

  if (authenticatedEndpoints.some(ep => endpoint.includes(ep))) {
    return true;
  }

  if (publicEndpoints.some(ep => endpoint.includes(ep))) {
    return false;
  }

  // Default to requiring authentication for unknown endpoints
  return true;
};

/**
 * Create a login prompt component message
 */
export const createLoginPrompt = (action: string = 'continue'): string => {
  return `Would you like to [log in](action:login) to ${action}?`;
};

const chatbotAuth = {
  isUserAuthenticated,
  classifyQuery,
  canGuestAnswer,
  getAuthRequiredMessage,
  isEndpointAuthenticated,
  createLoginPrompt,
};

export default chatbotAuth;
