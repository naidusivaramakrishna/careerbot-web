/**
 * Chatbot API Service
 *
 * Handles all communication with the backend chatbot endpoints.
 * Provides a clean interface for sending messages, managing sessions, and escalating issues.
 *
 * AUTHENTICATION REQUIREMENTS:
 * - Guest users (unauthorized): Can call sendChatMessage() for general/public queries
 * - Authenticated users: Can call all functions
 *
 * Backend Endpoints:
 * - POST /api/v1/chat/message - Send a chat message (works for guest & authenticated)
 * - GET /api/v1/chat/tickets - Get user's support tickets (REQUIRES AUTHENTICATION)
 * - POST /api/v1/chat/escalate - Escalate a chat to a support ticket (REQUIRES AUTHENTICATION)
 * - GET /api/v1/credits/costs - Get feature costs (PUBLIC)
 * - GET /api/v1/billing/summary - Get billing summary (REQUIRES AUTHENTICATION)
 * - GET /api/v1/invoices - Get user's invoices (REQUIRES AUTHENTICATION)
 * - GET /api/v1/invoices/{invoice_id} - Get invoice details (REQUIRES AUTHENTICATION)
 *
 * NOTE: Frontend enforces query classification (public vs authenticated).
 * Backend MUST also enforce authentication at the endpoint level.
 */

import { isAxiosError } from "axios";
import { httpClient } from "@/lib/http";
import logger from "@/lib/logger";
import { isUserAuthenticated } from "@/api/chatbotAuth";

/** HTTP status of a failed httpClient call (undefined for network/non-HTTP errors). */
const errorStatus = (error: unknown): number | undefined =>
  isAxiosError(error) ? error.response?.status : undefined;

/** Response body of a failed httpClient call, if any. */
const errorData = (error: unknown): unknown =>
  isAxiosError(error) ? error.response?.data : undefined;

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Map frontend feature IDs (with hyphens) to backend enum values (with underscores)
 */
const mapFeatureToBackend = (frontendFeature: string): string => {
  const featureMap: Record<string, string> = {
    'login-issues': 'account_organization',
    'ai-resume-builder': 'ai_resume_builder',
    'resume-parser': 'resume_parser',
    'resume-enhancer': 'resume_enhancer',
    'ai-cover-letter': 'ai_cover_letter',
    'job-search': 'job_search',
    'job-match': 'job_match',
    'mock-interview': 'mock_interview',
    'mock-test': 'mock_test',
    'browser-extension': 'browser_extension',
    'chatbot': 'chatbot_ai_support',
    'payment-billing': 'payment_billing',
    'account-organization': 'account_organization',
    'other': 'other',
  };
  return featureMap[frontendFeature] || frontendFeature;
};

/**
 * Map frontend priority (numeric) to backend priority (string enum)
 */
const mapPriorityToBackend = (frontendPriority: number | string | undefined): string => {
  if (typeof frontendPriority === 'string') {
    return ['normal', 'urgent'].includes(frontendPriority) ? frontendPriority : 'normal';
  }
  // Map numeric priority: 1 = normal, 2 = urgent
  return frontendPriority === 2 ? 'urgent' : 'normal';
};

/**
 * Request payload for sending a chat message
 */
export interface ChatMessageRequest {
  message: string;
  session_id?: string;
  context?: Record<string, unknown>;
}

/**
 * Response from sending a chat message
 */
export interface ChatMessageResponse {
  session_id: string;
  message: string;
  answer: string;
  category: string;
  authenticated: boolean;
  requires_escalation: boolean;
  escalation_reason?: string;
  confidence: number;
  timestamp: string;
  sources?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Request payload for creating a support ticket (escalation)
 */
export interface EscalationRequest {
  issue_category: string;
  issue_title: string;
  issue_description: string;
  session_id?: string;
  contact_email?: string;
  contact_phone?: string;
  issue_details?: EscalationIssueDetails;
}

/**
 * Free-form ticket details collected by the chat UI. Only the fields
 * buildTicketBody reads are sent to the backend.
 */
export interface EscalationIssueDetails {
  feature?: string | null;
  issue_type?: string;
  steps_to_reproduce?: string;
  priority?: number | string;
  requester_name?: string;
  requester_email?: string;
  user_type?: string;
  verification_token?: string;
  transaction_id?: string;
  invoice_number?: string;
  payment_date?: string;
}

/**
 * Response from creating a support ticket
 */
export interface EscalationResponse {
  success: boolean;
  ticket_id: string;
  ticket_number?: string;
  status: string;
  message: string;
  reference_number?: string;
  expected_response_time?: string;
}

/**
 * Support ticket item in list (careerbot-api TicketResponse)
 */
export interface SupportTicket {
  ticket_id: string;
  subject: string;
  description: string;
  affected_feature: string;
  status: string;
  /** 'normal' | 'urgent' */
  priority: string;
  user_email: string;
  user_name?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Response from getting tickets list
 */
export interface TicketsListResponse {
  page: number;
  limit: number;
  total_records: number;
  total_pages: number;
  data: SupportTicket[];
}

/**
 * Send a message to the chatbot
 *
 * @param message - The user's message
 * @param sessionId - Optional session ID (if not provided, server will create one)
 * @param context - Optional context data
 * @returns ChatMessageResponse with the chatbot's answer
 */
export const sendChatMessage = async (
  message: string,
  sessionId?: string,
  context?: Record<string, unknown>
): Promise<ChatMessageResponse> => {
  // Build payload - only include optional fields if provided
  const payload: ChatMessageRequest = {
    message,
    ...(sessionId && { session_id: sessionId }),
    ...(context && { context }),
  };

  try {
    const response = await httpClient.post<ChatMessageResponse>(
      "/chat/message",
      payload
    );

    return response.data;
  } catch (error: unknown) {
    const status = errorStatus(error);
    console.error("Failed to send chat message:", error);
    console.error("Error response data:", errorData(error));
    console.error("Error status:", status);
    console.error("Payload sent:", payload);

    if (status === 429) {
      throw new Error("Rate limit exceeded. Please wait before sending another message.");
    }

    if (status === 401) {
      throw new Error("Authentication required for this action.");
    }

    if (status === 422 || status === 400) {
      const details = extractBackendMessage(errorData(error)) || JSON.stringify(errorData(error));
      throw new Error(`Validation error: ${details}`);
    }

    throw error;
  }
};

/**
 * Get user's support tickets
 *
 * @param statusFilter - Optional status filter (open, in_progress, resolved, closed)
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20)
 * @returns TicketsListResponse with list of tickets
 */
export const getSupportTickets = async (
  statusFilter?: string,
  page: number = 1,
  limit: number = 20
): Promise<TicketsListResponse> => {
  try {
    const params = {
      page,
      limit,
      ...(statusFilter && { status_filter: statusFilter }),
    };

    // Backend endpoint returns { tickets, total, page, limit } - map to the
    // { data, total_records, total_pages } shape callers expect.
    const response = await httpClient.get<{
      tickets: SupportTicket[];
      total: number;
      page: number;
      limit: number;
    }>("/tickets/list", { params });

    const { tickets, total, page: responsePage, limit: responseLimit } = response.data;

    return {
      data: tickets,
      page: responsePage,
      limit: responseLimit,
      total_records: total,
      total_pages: Math.ceil(total / responseLimit),
    };
  } catch (error: unknown) {
    console.error("Failed to get support tickets:", error);

    if (errorStatus(error) === 401) {
      throw new Error("Authentication required to view tickets.");
    }

    throw error;
  }
};

/**
 * Escalate a chat issue to a support ticket
 *
 * Backend endpoint: POST /api/v1/tickets/create
 * Accepts JSON body with ticket details
 * Authentication: JWT Bearer token via httpOnly cookies (for authenticated users)
 *
 * @param request - Escalation request with issue details
 * @returns EscalationResponse with ticket details
 */
// Authenticated users: backend expects AuthenticatedTicketCreate
// (no email/user_type/name/verification_token - user comes from the session cookie)
// Guest users: backend expects GuestTicketCreate
const buildTicketBody = (request: EscalationRequest, forAuthenticated: boolean) =>
  forAuthenticated
    ? {
        subject: request.issue_title,
        description: request.issue_description,
        affected_feature: mapFeatureToBackend(request.issue_category),
        priority: mapPriorityToBackend(request.issue_details?.priority),
        ...(request.issue_details?.steps_to_reproduce && {
          steps_to_reproduce: request.issue_details.steps_to_reproduce
        }),
      }
    : {
        subject: request.issue_title,
        description: request.issue_description,
        affected_feature: mapFeatureToBackend(request.issue_category),
        email: request.contact_email,
        user_type: request.issue_details?.user_type || 'other',
        name: request.issue_details?.requester_name,
        priority: mapPriorityToBackend(request.issue_details?.priority),
        ...(request.issue_details?.steps_to_reproduce && {
          steps_to_reproduce: request.issue_details.steps_to_reproduce
        }),
      };

// Backend error responses are wrapped as {success: false, error: {message, error_code}},
// not FastAPI's default {detail: "..."} - unwrap whichever shape shows up.
function extractBackendMessage(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const body = data as { error?: { message?: unknown }; detail?: unknown; message?: unknown };
  for (const candidate of [body.error?.message, body.detail, body.message]) {
    if (typeof candidate === "string" && candidate) return candidate;
  }
  return undefined;
}

export const escalateToSupport = async (
  request: EscalationRequest
): Promise<EscalationResponse> => {
  // Use the correct backend endpoint for ticket creation
  const endpoint = '/tickets/create';

  // Prepare headers with verification token if available
  const headers: Record<string, string> = {
    // Don't auto-logout on 401 — let the application handle it
    'X-Skip-Auth-Redirect': 'true',
  };
  if (request.issue_details?.verification_token) {
    headers['X-Verification-Token'] = request.issue_details.verification_token;
  }

  // isUserAuthenticated() is a local heuristic (token-refresh timestamp) that
  // can disagree with the backend's real httpOnly session cookie - a stale
  // cookie can outlive it, or the cookie can already be gone while the
  // timestamp hasn't expired yet. Send our best guess, and if the backend
  // reports the shape doesn't match the real session, retry once with the
  // other shape instead of failing the whole submission.
  let authenticated = isUserAuthenticated();

  const attempt = async (forAuthenticated: boolean) => {
    const ticketBody = buildTicketBody(request, forAuthenticated);
    // Never log `headers`: it carries the X-Verification-Token.
    logger.debug('[escalateToSupport] Submitting ticket:', {
      url: endpoint,
      authenticatedShape: forAuthenticated,
      hasToken: !!request.issue_details?.verification_token,
    });
    return httpClient.post<EscalationResponse>(endpoint, ticketBody, { headers });
  };

  try {
    let response;
    try {
      response = await attempt(authenticated);
    } catch (error: unknown) {
      const backendMessage: string = extractBackendMessage(errorData(error)) || '';
      const shapeMismatch =
        errorStatus(error) === 400 &&
        (backendMessage.includes('Authenticated users must provide') ||
          backendMessage.includes('Guest users must provide'));

      if (shapeMismatch) {
        authenticated = !authenticated;
        response = await attempt(authenticated);
      } else {
        throw error;
      }
    }

    logger.debug('[escalateToSupport] Success:', response.data);
    return response.data;
  } catch (error: unknown) {
    const status = errorStatus(error);
    console.error("Failed to escalate to support:", error);
    console.error("Error details:", {
      status,
      message: extractBackendMessage(errorData(error)) || errorMessage(error),
      url: isAxiosError(error) ? error.response?.config?.url : undefined,
      data: errorData(error),
    });

    if (status === 401 || status === 403) {
      // Don't show auth error message - just re-throw for frontend to handle silently
      throw error;
    }

    if (status === 404) {
      const backendMessage = extractBackendMessage(errorData(error));
      throw new Error(
        backendMessage || "Ticket creation endpoint is not available on the backend. Please check if the backend is running and has the required endpoint implemented."
      );
    }

    if (status === 400) {
      const backendMessage = extractBackendMessage(errorData(error));
      throw new Error(
        backendMessage || "Invalid escalation request. Please check your input."
      );
    }

    if (!isAxiosError(error) || !error.response) {
      throw new Error(
        "Unable to connect to the backend service. Please ensure the backend is running."
      );
    }

    // Generic error with backend message if available
    const backendMessage = extractBackendMessage(errorData(error)) || errorMessage(error);
    throw new Error(
      `Failed to create ticket: ${backendMessage}`
    );
  }
};

/**
 * Get feature cost information (public, no auth required)
 *
 * @returns Object with feature costs
 */
export const getFeatureCosts = async (): Promise<Record<string, unknown>> => {
  try {
    const response = await httpClient.get<Record<string, unknown>>("/credits/costs");
    return response.data;
  } catch (error: unknown) {
    console.error("Failed to get feature costs:", error);
    throw error;
  }
};

/**
 * Get billing summary (requires authentication)
 *
 * @returns Object with subscription, billing, and credits data
 */
export const getBillingSummary = async (): Promise<Record<string, unknown>> => {
  try {
    const response = await httpClient.get<Record<string, unknown>>("/billing/summary");
    return response.data;
  } catch (error: unknown) {
    console.error("Failed to get billing summary:", error);

    if (errorStatus(error) === 401) {
      throw new Error("Authentication required to view billing information.");
    }

    throw error;
  }
};

/**
 * Get list of invoices (requires authentication)
 *
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20)
 * @param statusFilter - Optional status filter
 * @returns Object with paginated invoices
 */
export const getInvoices = async (
  page: number = 1,
  limit: number = 20,
  statusFilter?: string
): Promise<Record<string, unknown>> => {
  try {
    const params = {
      page,
      limit,
      ...(statusFilter && { status_filter: statusFilter }),
    };

    const response = await httpClient.get<Record<string, unknown>>("/invoices", { params });
    return response.data;
  } catch (error: unknown) {
    console.error("Failed to get invoices:", error);

    if (errorStatus(error) === 401) {
      throw new Error("Authentication required to view invoices.");
    }

    throw error;
  }
};

/**
 * Get specific invoice details (requires authentication)
 *
 * @param invoiceId - Invoice ID
 * @returns Invoice details
 */
export const getInvoiceDetails = async (invoiceId: string): Promise<Record<string, unknown>> => {
  try {
    const response = await httpClient.get<Record<string, unknown>>(`/invoices/${invoiceId}`);
    return response.data;
  } catch (error: unknown) {
    console.error(`Failed to get invoice ${invoiceId}:`, error);
    const status = errorStatus(error);

    if (status === 404) {
      throw new Error("Invoice not found.");
    }

    if (status === 403) {
      throw new Error("You do not have access to this invoice.");
    }

    if (status === 401) {
      throw new Error("Authentication required.");
    }

    throw error;
  }
};

/**
 * Request to send OTP for ticket verification
 */
export interface SendTicketOtpRequest {
  email: string;
}

/**
 * Response when OTP is sent
 */
export interface SendTicketOtpResponse {
  success: boolean;
  message: string;
  otp_id?: string;
}

/**
 * Request to verify OTP
 */
export interface VerifyTicketOtpRequest {
  email: string;
  otp: string;
}

/**
 * Response when OTP is verified
 */
export interface VerifyTicketOtpResponse {
  success: boolean;
  verified: boolean;
  message: string;
  token?: string;
}

/**
 * Send OTP to user email for ticket verification
 * Used for unauthenticated users to verify email before creating tickets
 *
 * @param request - Email address to send OTP to
 * @returns Success message with OTP ID
 */
export const sendTicketOtp = async (
  request: SendTicketOtpRequest
): Promise<SendTicketOtpResponse> => {
  try {
    const response = await httpClient.post<SendTicketOtpResponse>(
      "/chat/ticket/send-otp",
      request,
      {
        headers: {
          'X-Skip-Auth-Redirect': 'true',
        },
      }
    );

    return response.data;
  } catch (error: unknown) {
    console.error("Failed to send OTP:", error);

    if (errorStatus(error) === 404) {
      console.error("Backend endpoint /api/v1/chat/ticket/send-otp not found");
      throw new Error(
        "OTP service is not available. Please contact support or try again later."
      );
    }

    throw new Error(
      extractBackendMessage(errorData(error)) || "Failed to send OTP to email"
    );
  }
};

/**
 * Verify OTP sent to user email
 * Used for unauthenticated users to complete ticket creation
 *
 * @param request - Email and OTP code
 * @returns Verification token if successful
 */
export const verifyTicketOtp = async (
  request: VerifyTicketOtpRequest
): Promise<VerifyTicketOtpResponse> => {
  try {
    const response = await httpClient.post<VerifyTicketOtpResponse>(
      "/chat/ticket/verify-otp",
      request,
      {
        headers: {
          'X-Skip-Auth-Redirect': 'true',
        },
      }
    );

    return response.data;
  } catch (error: unknown) {
    console.error("Failed to verify OTP:", error);

    if (errorStatus(error) === 404) {
      console.error("Backend endpoint /api/v1/chat/ticket/verify-otp not found");
      throw new Error(
        "OTP verification service is not available. Please contact support or try again later."
      );
    }

    throw new Error(
      extractBackendMessage(errorData(error)) || "Invalid or expired OTP"
    );
  }
};

const chatbotApi = {
  sendChatMessage,
  getSupportTickets,
  escalateToSupport,
  getFeatureCosts,
  getBillingSummary,
  getInvoices,
  getInvoiceDetails,
  sendTicketOtp,
  verifyTicketOtp,
};

export default chatbotApi;
