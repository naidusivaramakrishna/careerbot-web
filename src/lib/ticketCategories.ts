/**
 * Ticket category list + per-category issue-type options, shared by the
 * chatbot's in-widget ticket modal (ChatApp.tsx) and the dedicated guest
 * support portal (/support/tickets/new) -- single source of truth so the
 * two forms' category/issue-type options never drift apart. Category ids
 * are exactly what src/api/chatbotApi.ts's mapFeatureToBackend already
 * knows how to translate to the backend's affected_feature enum.
 */

export interface TicketCategory {
  id: string;
  label: string;
}

export interface TicketStatusMeta {
  label: string;
  color: string;
}

export const TICKET_STATUS_META: Record<string, TicketStatusMeta> = {
  open: { label: 'Open', color: 'status-open' },
  in_progress: { label: 'In Progress', color: 'status-progress' },
  waiting_user: { label: 'Waiting on You', color: 'status-progress' },
  resolved: { label: 'Resolved', color: 'status-resolved' },
  closed: { label: 'Closed', color: 'status-closed' },
  cancelled: { label: 'Cancelled', color: 'status-closed' },
};

// Mirrors the backend's CANCELLABLE_STATUSES (support_tickets_public.py) --
// only shows the Cancel action for tickets that endpoint will actually
// accept. Resolved/closed/cancelled are terminal.
export const CANCELLABLE_TICKET_STATUSES = new Set(['open', 'in_progress', 'waiting_user']);

// Backend validation limits for ticket creation -- single source of truth
// for every reachable ticket-creation form (the guest portal at
// /support/tickets/new, the dashboard's RaiseTicketModal). The frontend
// must not rely on backend validation alone: rejecting an oversized
// attachment or an over-length field here, before the request goes out,
// gives the user an immediate, specific error instead of a generic
// request failure after they've already waited for an upload.
export const MAX_TICKET_ATTACHMENTS = 5;
export const MAX_TICKET_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_TICKET_SUBJECT_CHARS = 200;
// Applies to both original_question and chatbot_answer -- the chatbot
// context carried through from an unhelpful-answer "Raise a support
// ticket" click, never to the customer's own free-typed description.
export const MAX_TICKET_QA_CHARS = 5000;

// That Q&A travels from the chatbot to /support/tickets/new in
// sessionStorage under a one-time id (?ctx=<id>), not in the URL, where it
// would land in browser history and access logs and could exceed proxy URL
// limits. ?question=&answer= stay the fallback when sessionStorage fails.
export const TICKET_CONTEXT_PARAM = 'ctx';
const ticketContextKey = (id: string) => `ticket_ctx:${id}`;
type QueryParams = { get(name: string): string | null };

export const stashTicketContext = (question: string, answer: string): string | null => {
  try {
    const id = Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem(ticketContextKey(id), JSON.stringify({ question, answer }));
    return id;
  } catch {
    return null;
  }
};

export const readTicketContext = (params: QueryParams): { question: string; answer: string } => {
  const id = params.get(TICKET_CONTEXT_PARAM);
  let stored: { question?: unknown; answer?: unknown } | null = null;
  try {
    if (id) stored = JSON.parse(sessionStorage.getItem(ticketContextKey(id)) || 'null');
  } catch {
    stored = null;
  }
  const pick = (k: 'question' | 'answer') =>
    (id ? (typeof stored?.[k] === 'string' ? (stored[k] as string) : '') : params.get(k) || '').slice(0, MAX_TICKET_QA_CHARS);
  return { question: pick('question'), answer: pick('answer') };
};

// Called after mount (not in a state initializer, which React may run twice).
export const clearTicketContext = (params: QueryParams): void => {
  const id = params.get(TICKET_CONTEXT_PARAM);
  try {
    if (id) sessionStorage.removeItem(ticketContextKey(id));
  } catch {
    // Storage unavailable: nothing was stored.
  }
};

// affected_feature is a raw backend enum slug (e.g. 'ai_resume_builder',
// 'payment_billing') -- there's no reverse mapping back to the frontend's
// own hyphenated category ids (several frontend ids collapse to the same
// backend value, e.g. both 'login-issues' and 'account-organization' map
// to 'account_organization'), so this just prettifies the slug itself
// rather than guessing which original label it came from.
export const formatFeatureLabel = (slug: string): string =>
  slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const TICKET_CATEGORIES: TicketCategory[] = [
  { id: 'login-issues', label: 'Login Issues' },
  { id: 'ai-resume-builder', label: 'AI Resume Builder' },
  { id: 'resume-parser', label: 'Resume Parser' },
  { id: 'resume-enhancer', label: 'Resume Enhancer' },
  { id: 'ai-cover-letter', label: 'AI Cover Letter' },
  { id: 'job-search', label: 'Job Search' },
  { id: 'job-match', label: 'Job Match' },
  { id: 'mock-interview', label: 'Mock Interview' },
  { id: 'mock-test', label: 'Mock Test' },
  { id: 'browser-extension', label: 'Browser Extension' },
  { id: 'chatbot', label: 'Chatbot / AI Support' },
  { id: 'payment-billing', label: 'Payment & Billing' },
  { id: 'account-organization', label: 'Account / Organization' },
  { id: 'other', label: 'Other' },
];

export interface IssueTypeOption {
  value: string;
  label: string;
}

export const FEATURE_ISSUE_TYPES: Record<string, IssueTypeOption[]> = {
  'login-issues': [
    { value: 'forgot_password', label: 'Forgot Password' },
    { value: 'unable_to_login', label: 'Unable to Login' },
    { value: 'password_reset_issue', label: 'Password Reset Issue' },
    { value: 'email_verification_issue', label: 'Email Verification Issue' },
    { value: 'two_fa_issue', label: '2FA / Authentication Issue' },
    { value: 'account_locked', label: 'Account Locked / Suspended' },
    { value: 'other_login_issue', label: 'Other Login/Access Issue' },
  ],
  'ai-resume-builder': [
    { value: 'resume_creation_failed', label: 'Resume creation failed' },
    { value: 'template_not_loading', label: 'Template not loading' },
    { value: 'generation_error', label: 'Resume generation error' },
    { value: 'ats_formatting', label: 'ATS formatting issue' },
    { value: 'content_generation', label: 'Content generation issue' },
    { value: 'download_export', label: 'Resume download/export issue' },
    { value: 'formatting_layout', label: 'Formatting/layout issue' },
    { value: 'slow_response', label: 'Slow response' },
    { value: 'not_accessible', label: 'Feature not accessible' },
    { value: 'other', label: 'Other' },
  ],
  'resume-parser': [
    { value: 'upload_failed', label: 'Resume upload failed' },
    { value: 'parsing_failed', label: 'Resume parsing failed' },
    { value: 'incorrect_extraction', label: 'Incorrect information extracted' },
    { value: 'missing_info', label: 'Missing information' },
    { value: 'section_mapping', label: 'Incorrect section mapping' },
    { value: 'parsing_slow', label: 'Parsing taking too long' },
    { value: 'unsupported_format', label: 'Unsupported resume format' },
    { value: 'not_accessible', label: 'Feature not accessible' },
    { value: 'other', label: 'Other' },
  ],
  'resume-enhancer': [
    { value: 'enhancement_failed', label: 'Enhancement failed' },
    { value: 'incorrect_suggestions', label: 'Incorrect suggestions' },
    { value: 'missing_suggestions', label: 'Missing suggestions' },
    { value: 'poor_recommendations', label: 'Poor/irrelevant recommendations' },
    { value: 'enhancement_slow', label: 'Enhancement taking too long' },
    { value: 'content_changed', label: 'Resume content changed incorrectly' },
    { value: 'not_accessible', label: 'Feature not accessible' },
    { value: 'other', label: 'Other' },
  ],
  'ai-cover-letter': [
    { value: 'generation_failed', label: 'Cover letter generation failed' },
    { value: 'incorrect_job_info', label: 'Incorrect job information' },
    { value: 'incorrect_personalization', label: 'Incorrect personalization' },
    { value: 'content_generation', label: 'Content generation issue' },
    { value: 'formatting_issue', label: 'Formatting issue' },
    { value: 'download_export', label: 'Download/export issue' },
    { value: 'slow_response', label: 'Slow response' },
    { value: 'not_accessible', label: 'Feature not accessible' },
    { value: 'other', label: 'Other' },
  ],
  'job-search': [
    { value: 'jobs_not_loading', label: 'Jobs not loading' },
    { value: 'no_results', label: 'Search not returning results' },
    { value: 'incorrect_results', label: 'Incorrect job results' },
    { value: 'filters_not_working', label: 'Filters not working' },
    { value: 'job_details_incorrect', label: 'Job details incorrect' },
    { value: 'job_link_broken', label: 'Job link not working' },
    { value: 'duplicate_jobs', label: 'Duplicate jobs' },
    { value: 'location_filter', label: 'Location filter issue' },
    { value: 'performance_issue', label: 'Search performance issue' },
    { value: 'not_accessible', label: 'Feature not accessible' },
    { value: 'other', label: 'Other' },
  ],
  'job-match': [
    { value: 'matching_failed', label: 'Job matching failed' },
    { value: 'incorrect_matches', label: 'Incorrect job matches' },
    { value: 'poor_results', label: 'Poor match results' },
    { value: 'skills_not_matched', label: 'Skills not matched correctly' },
    { value: 'experience_matching', label: 'Experience matching issue' },
    { value: 'match_score_issue', label: 'Match score issue' },
    { value: 'missing_matches', label: 'Missing job matches' },
    { value: 'slow_response', label: 'Slow response' },
    { value: 'not_accessible', label: 'Feature not accessible' },
    { value: 'other', label: 'Other' },
  ],
  'mock-interview': [
    { value: 'interview_not_starting', label: 'Interview not starting' },
    { value: 'question_generation', label: 'Question generation issue' },
    { value: 'incorrect_questions', label: 'Incorrect questions' },
    { value: 'voice_audio_issue', label: 'Voice/audio issue' },
    { value: 'answer_evaluation', label: 'Answer evaluation issue' },
    { value: 'feedback_issue', label: 'Feedback issue' },
    { value: 'session_interrupted', label: 'Interview session interrupted' },
    { value: 'results_not_generated', label: 'Results not generated' },
    { value: 'not_accessible', label: 'Feature not accessible' },
    { value: 'other', label: 'Other' },
  ],
  'mock-test': [
    { value: 'test_not_starting', label: 'Test not starting' },
    { value: 'questions_not_loading', label: 'Questions not loading' },
    { value: 'incorrect_questions', label: 'Incorrect questions' },
    { value: 'answer_submission', label: 'Answer submission issue' },
    { value: 'timer_issue', label: 'Timer issue' },
    { value: 'test_interrupted', label: 'Test interrupted' },
    { value: 'results_not_generated', label: 'Results not generated' },
    { value: 'score_issue', label: 'Score issue' },
    { value: 'not_accessible', label: 'Feature not accessible' },
    { value: 'other', label: 'Other' },
  ],
  'browser-extension': [
    { value: 'installation_issue', label: 'Extension installation issue' },
    { value: 'extension_not_working', label: 'Extension not working' },
    { value: 'job_not_detected', label: 'Job description not detected' },
    { value: 'extraction_failed', label: 'Job description extraction failed' },
    { value: 'incorrect_extraction', label: 'Incorrect extracted content' },
    { value: 'resume_integration', label: 'Resume integration issue' },
    { value: 'cover_letter_integration', label: 'Cover letter integration issue' },
    { value: 'job_match_integration', label: 'Job Match integration issue' },
    { value: 'browser_compatibility', label: 'Browser compatibility issue' },
    { value: 'other', label: 'Other' },
  ],
  'chatbot': [
    { value: 'not_responding', label: 'Chatbot not responding' },
    { value: 'incorrect_answer', label: 'Incorrect answer' },
    { value: 'irrelevant_answer', label: 'Irrelevant answer' },
    { value: 'slow_response', label: 'Slow response' },
    { value: 'voice_assistant', label: 'Voice assistant issue' },
    { value: 'document_upload', label: 'Document upload issue' },
    { value: 'document_processing', label: 'Document processing issue' },
    { value: 'document_qa', label: 'Document question-answering issue' },
    { value: 'suggested_questions', label: 'Suggested questions issue' },
    { value: 'history_issue', label: 'Conversation history issue' },
    { value: 'other', label: 'Other' },
  ],
  'payment-billing': [
    { value: 'payment_failed', label: 'Payment failed' },
    { value: 'payment_declined', label: 'Payment declined' },
    { value: 'payment_deducted_not_activated', label: 'Payment deducted but subscription not activated' },
    { value: 'payment_status_not_updated', label: 'Payment status not updated' },
    { value: 'duplicate_payment', label: 'Duplicate payment' },
    { value: 'refund_request', label: 'Refund request' },
    { value: 'refund_not_received', label: 'Refund not received' },
    { value: 'invoice_not_generated', label: 'Invoice not generated' },
    { value: 'invoice_incorrect', label: 'Invoice incorrect' },
    { value: 'invoice_download', label: 'Invoice download issue' },
    { value: 'billing_amount_incorrect', label: 'Billing amount incorrect' },
    { value: 'subscription_plan', label: 'Subscription plan issue' },
    { value: 'subscription_renewal', label: 'Subscription renewal issue' },
    { value: 'subscription_cancellation', label: 'Subscription cancellation issue' },
    { value: 'upgrade_plan', label: 'Upgrade plan issue' },
    { value: 'downgrade_plan', label: 'Downgrade plan issue' },
    { value: 'tax_info', label: 'Tax/GST information issue' },
    { value: 'payment_method', label: 'Payment method issue' },
    { value: 'billing_history', label: 'Billing history issue' },
    { value: 'usage_balance', label: 'Usage/credit balance issue' },
    { value: 'other', label: 'Other' },
  ],
  'account-organization': [
    { value: 'login_issue', label: 'Login issue' },
    { value: 'account_access', label: 'Account access issue' },
    { value: 'organization_access', label: 'Organization access issue' },
    { value: 'user_invitation', label: 'User invitation issue' },
    { value: 'user_removal', label: 'User removal issue' },
    { value: 'role_permission', label: 'Role/permission issue' },
    { value: 'org_profile', label: 'Organization profile issue' },
    { value: 'password_reset', label: 'Password/reset issue' },
    { value: 'email_verification', label: 'Email verification issue' },
    { value: 'account_suspension', label: 'Account suspension issue' },
    { value: 'feature_access', label: 'Feature access/permission issue' },
    { value: 'other', label: 'Other' },
  ],
  'other': [
    { value: 'other_issue', label: 'Other issue' },
  ],
};
