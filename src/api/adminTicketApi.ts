/**
 * Admin Ticket Management API Client
 * Handles all admin-level ticket operations: listing, filtering, updating status/priority,
 * assigning, replying, adding notes, escalating, resolving, and closing tickets.
 */

import { httpClient } from '@/lib/http';
import logger from '@/lib/logger';

// ==================== TYPES ====================

export interface TicketListFilters {
  page?: number;
  page_size?: number;
  status?: string;
  priority?: string;
  search?: string;
  assigned_to?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface TicketListItem {
  ticket_id: string;
  subject: string;
  requester_name?: string;
  requester_email: string;
  category: string;
  priority: string;
  status: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketListResponse {
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
  tickets: TicketListItem[];
}

export interface TicketStatsResponse {
  total: number;
  open: number;
  in_progress: number;
  waiting_user: number;
  resolved: number;
  closed: number;
  urgent: number;
}

export interface TicketReply {
  author: string;
  message: string;
  created_at: string;
  internal: boolean;
}

export interface ActivityLogEntry {
  timestamp: string;
  action: string;
  field?: string;
  old_value?: string;
  new_value?: string;
  changed_by?: string;
  /** Why the change was made (e.g. the closing reason or resolution summary). */
  reason?: string;
}

export interface TicketDetailResponse {
  ticket_id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  requester_name?: string;
  requester_email: string;
  requester_type: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  original_question?: string;
  chatbot_answer?: string;
  replies: TicketReply[];
  activity_log: ActivityLogEntry[];
  attachment_count: number;
}

// ==================== API FUNCTIONS ====================

/**
 * Convert a picked calendar date (YYYY-MM-DD) to the UTC instant of local
 * midnight in the viewer's own timezone. `dayOffset` 1 gives the midnight
 * after the date, which is the exclusive end of a range ending on that date.
 * Built from local components so DST days and any timezone are handled by the
 * browser; returns the input unchanged if it is not a plain date.
 */
export const localDateToUtcIso = (value: string, dayOffset = 0): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day) + dayOffset).toISOString();
};

/**
 * Append the filters shared by the list and export requests. Date filters are
 * sent as [local start-of-day, local start of the day after the end date) in UTC.
 */
const appendFilterParams = (params: URLSearchParams, filters: TicketListFilters): void => {
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.search) params.append('search', filters.search);
  if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
  if (filters.date_from) params.append('date_from', localDateToUtcIso(filters.date_from));
  if (filters.date_to) params.append('date_to', localDateToUtcIso(filters.date_to, 1));
  if (filters.sort_by) params.append('sort_by', filters.sort_by);
  if (filters.sort_order) params.append('sort_order', filters.sort_order);
};

/**
 * Get dashboard statistics for all tickets
 */
export const getTicketStats = async (): Promise<TicketStatsResponse> => {
  try {
    const response = await httpClient.get<TicketStatsResponse>(
      '/admin/api/v1/tickets/stats'
    );
    return response.data;
  } catch (error) {
    logger.error('Failed to get ticket statistics:', error);
    throw error;
  }
};

/**
 * List tickets with advanced filtering and pagination
 */
export const listAdminTickets = async (
  filters: TicketListFilters = {}
): Promise<TicketListResponse> => {
  try {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    appendFilterParams(params, filters);

    const queryString = params.toString();
    const url = `/admin/api/v1/tickets${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.get<TicketListResponse>(url);
    return response.data;
  } catch (error) {
    logger.error('Failed to list tickets:', error);
    throw error;
  }
};

/**
 * Get full ticket details including conversation history and activity log
 */
export const getTicketDetails = async (ticketId: string): Promise<TicketDetailResponse> => {
  try {
    const response = await httpClient.get<TicketDetailResponse>(
      `/admin/api/v1/tickets/${encodeURIComponent(ticketId)}`
    );
    return response.data;
  } catch (error) {
    logger.error(`Failed to get ticket details for ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Update ticket status
 */
export const updateTicketStatus = async (
  ticketId: string,
  status: string,
  reason?: string
): Promise<void> => {
  try {
    await httpClient.patch(`/admin/api/v1/tickets/${encodeURIComponent(ticketId)}/status`, {
      status,
      reason,
    });
    logger.info(`Updated ticket ${ticketId} status to ${status}`);
  } catch (error) {
    logger.error(`Failed to update ticket status for ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Update ticket priority
 */
export const updateTicketPriority = async (
  ticketId: string,
  priority: string,
  reason?: string
): Promise<void> => {
  try {
    await httpClient.patch(`/admin/api/v1/tickets/${encodeURIComponent(ticketId)}/priority`, {
      priority,
      reason,
    });
    logger.info(`Updated ticket ${ticketId} priority to ${priority}`);
  } catch (error) {
    logger.error(`Failed to update ticket priority for ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Assign or reassign a ticket to an admin/agent
 */
export const assignTicket = async (
  ticketId: string,
  assignedTo: string,
  reason?: string
): Promise<void> => {
  try {
    await httpClient.patch(`/admin/api/v1/tickets/${encodeURIComponent(ticketId)}/assign`, {
      assigned_to: assignedTo,
      reason,
    });
    logger.info(`Assigned ticket ${ticketId} to ${assignedTo}`);
  } catch (error) {
    logger.error(`Failed to assign ticket ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Send a reply to the ticket (user-visible or internal note)
 */
export const sendTicketReply = async (
  ticketId: string,
  message: string,
  internal: boolean = false
): Promise<void> => {
  try {
    await httpClient.post(`/admin/api/v1/tickets/${encodeURIComponent(ticketId)}/reply`, {
      message,
      internal,
    });
    logger.info(`Added ${internal ? 'internal note' : 'reply'} to ticket ${ticketId}`);
  } catch (error) {
    logger.error(`Failed to send reply for ticket ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Add an internal note (private, not visible to user)
 */
export const addInternalNote = async (
  ticketId: string,
  message: string
): Promise<void> => {
  return sendTicketReply(ticketId, message, true);
};

/**
 * Escalate a ticket to a higher tier
 */
export const escalateTicket = async (
  ticketId: string,
  reason: string,
  escalatedTo?: string
): Promise<void> => {
  try {
    await httpClient.patch(`/admin/api/v1/tickets/${encodeURIComponent(ticketId)}/escalate`, {
      reason,
      escalated_to: escalatedTo,
    });
    logger.info(`Escalated ticket ${ticketId}: ${reason}`);
  } catch (error) {
    logger.error(`Failed to escalate ticket ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Resolve a ticket with a resolution summary
 */
export const resolveTicket = async (
  ticketId: string,
  resolutionSummary: string
): Promise<void> => {
  try {
    await httpClient.patch(`/admin/api/v1/tickets/${encodeURIComponent(ticketId)}/resolve`, {
      resolution_summary: resolutionSummary,
    });
    logger.info(`Resolved ticket ${ticketId}`);
  } catch (error) {
    logger.error(`Failed to resolve ticket ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Close a resolved or abandoned ticket
 */
export const closeTicket = async (
  ticketId: string,
  closingReason: string
): Promise<void> => {
  try {
    await httpClient.patch(`/admin/api/v1/tickets/${encodeURIComponent(ticketId)}/close`, {
      closing_reason: closingReason,
    });
    logger.info(`Closed ticket ${ticketId}`);
  } catch (error) {
    logger.error(`Failed to close ticket ${ticketId}:`, error);
    throw error;
  }
};

export interface StaffMember {
  id: string;
  email: string;
  full_name?: string;
  role: string;
}

/**
 * Staff a ticket can be assigned to (active admins, super admins, support)
 */
export const getAssignableStaff = async (): Promise<StaffMember[]> => {
  try {
    const response = await httpClient.get<StaffMember[]>('/admin/api/v1/tickets/staff');
    return response.data;
  } catch (error) {
    logger.error('Failed to get assignable staff:', error);
    throw error;
  }
};

/**
 * Download every ticket matching the filters as CSV (not just the current page).
 * Returns the file contents; the caller triggers the browser download.
 */
export const exportAdminTickets = async (
  filters: TicketListFilters = {}
): Promise<Blob> => {
  try {
    // Pagination does not apply to an export
    const params = new URLSearchParams();
    appendFilterParams(params, filters);
    const queryString = params.toString();
    const response = await httpClient.get<Blob>(
      `/admin/api/v1/tickets/export${queryString ? `?${queryString}` : ''}`,
      { responseType: 'blob' }
    );
    return response.data;
  } catch (error) {
    logger.error('Failed to export tickets:', error);
    throw error;
  }
};

/**
 * Pull a human-readable message out of an API error (FastAPI's `detail`).
 */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  return typeof detail === 'string' && detail ? detail : fallback;
};
