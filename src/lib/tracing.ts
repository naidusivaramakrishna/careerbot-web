/**
 * Tracing and Logging Utility
 *
 * Provides comprehensive logging for API requests with correlation and trace IDs.
 * Useful for debugging, monitoring, and tracking user sessions.
 */

import { getCorrelationId } from './correlationId';

export interface TraceContext {
  correlationId: string | null;
  traceId?: string;
  service?: string;
  endpoint?: string;
  method?: string;
}

export interface LogData {
  [key: string]: unknown;
}

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Format log message with trace context
 */
function formatLogMessage(
  level: LogLevel,
  message: string,
  context: Partial<TraceContext>,
  _data?: LogData
): void {
  const correlationId = context.correlationId || getCorrelationId();
  const timestamp = new Date().toISOString();

  // Logging is disabled in production
  // const logPrefix = `[${timestamp}] [${level}]`;
  // const traceInfo = [
  //   correlationId && `correlation_id=${correlationId}`,
  //   context.traceId && `trace_id=${context.traceId}`,
  //   context.service && `service=${context.service}`,
  // ]
  //   .filter(Boolean)
  //   .join(' ');

  // const fullMessage = traceInfo ? `${logPrefix} ${traceInfo} - ${message}` : `${logPrefix} ${message}`;
  // const styles: Record<LogLevel, string> = {
  //   [LogLevel.DEBUG]: 'color: #888',
  //   [LogLevel.INFO]: 'color: #0066cc',
  //   [LogLevel.WARN]: 'color: #ff9900',
  //   [LogLevel.ERROR]: 'color: #cc0000; font-weight: bold',
  // };

  // if (_data) {
  //   // console.log(`%c${fullMessage}`, styles[level], _data);
  // } else {
  //   // console.log(`%c${fullMessage}`, styles[level]);
  // }

  // Prevent unused variable warnings
  void level;
  void message;
  void correlationId;
  void timestamp;
  void _data;
}

/**
 * Logger class for structured logging
 */
export class TraceLogger {
  private context: Partial<TraceContext>;

  constructor(context?: Partial<TraceContext>) {
    this.context = context || {};
  }

  debug(message: string, data?: LogData): void {
    if (process.env.NODE_ENV === 'development') {
      formatLogMessage(LogLevel.DEBUG, message, this.context, data);
    }
  }

  info(message: string, data?: LogData): void {
    if (process.env.NODE_ENV === 'development') {
      formatLogMessage(LogLevel.INFO, message, this.context, data);
    }
  }

  warn(message: string, data?: LogData): void {
    if (process.env.NODE_ENV === 'development') {
      formatLogMessage(LogLevel.WARN, message, this.context, data);
    }
  }

  error(message: string, data?: LogData): void {
    // Always log errors, but with minimal data in production
    if (process.env.NODE_ENV === 'development') {
      formatLogMessage(LogLevel.ERROR, message, this.context, data);
    } else {
      // Production: log only message and correlation ID
      // // console.error(`[ERROR] ${message}`, { correlationId: this.context.correlationId });
    }
  }

  /**
   * Update context for this logger instance
   */
  setContext(context: Partial<TraceContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Get current context
   */
  getContext(): Partial<TraceContext> {
    return { ...this.context };
  }
}

/**
 * Default logger instance
 */
export const logger = new TraceLogger({ service: 'frontend' });

/**
 * Create logger for specific API endpoint
 */
export function createApiLogger(endpoint: string, method: string = 'GET'): TraceLogger {
  return new TraceLogger({
    service: 'frontend',
    endpoint,
    method,
    correlationId: getCorrelationId(),
  });
}

/**
 * Log API request
 * In production: logs only method/URL, no payload data (security)
 */
export function logApiRequest(method: string, url: string, data?: unknown): void {
  const logger = createApiLogger(url, method);
  if (process.env.NODE_ENV === 'development') {
    logger.info(`API Request: ${method} ${url}`, data ? { payload: data } : undefined);
  } else {
    logger.info(`API Request: ${method} ${url}`);
  }
}

/**
 * Log API response
 * In production: logs only status code, no response data (security)
 */
export function logApiResponse(
  method: string,
  url: string,
  status: number,
  traceId?: string,
  data?: unknown
): void {
  const logger = createApiLogger(url, method);
  if (traceId) {
    logger.setContext({ traceId });
  }

  if (status >= 200 && status < 300) {
    if (process.env.NODE_ENV === 'development') {
      logger.info(`API Response: ${method} ${url} - ${status}`, data ? { response: data } : undefined);
    } else {
      logger.info(`API Response: ${method} ${url} - ${status}`);
    }
  } else if (status >= 400) {
    logger.error(`API Response: ${method} ${url} - ${status}`);
  } else {
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`API Response: ${method} ${url} - ${status}`, data ? { response: data } : undefined);
    } else {
      logger.warn(`API Response: ${method} ${url} - ${status}`);
    }
  }
}

/**
 * Log API error
 * In production: logs only message and correlation ID (no backend data)
 */
export function logApiError(method: string, url: string, error: unknown): void {
  const logger = createApiLogger(url, method);

  if (process.env.NODE_ENV === 'development') {
    const err = error as Record<string, unknown> | undefined;
    const response = err?.response as Record<string, unknown> | undefined;
    const headers = response?.headers as Record<string, unknown> | undefined;

    const errorData: LogData = {
      message: err?.message,
      status: response?.status,
      data: response?.data,
    };

    // Capture trace ID from error response if available
    const traceId = headers?.['x-trace-id'] as string | undefined;
    if (traceId) {
      logger.setContext({ traceId });
    }

    logger.error(`API Error: ${method} ${url}`, errorData);
  } else {
    // Production: minimal error info
    logger.error(`API Error: ${method} ${url}`);
  }
}

/**
 * Display current session info (useful for debugging)
 * Only displays in development mode
 */
export function displaySessionInfo(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Logging is disabled
  // const correlationId = getCorrelationId();
  // console.group('%c🔍 Session Tracing Info', 'color: #0066cc; font-weight: bold; font-size: 14px');
  // console.log(`Correlation ID: ${correlationId || 'Not initialized'}`);
  // console.log(`Environment: ${process.env.NODE_ENV}`);
  // console.log(`Timestamp: ${new Date().toISOString()}`);
  // console.groupEnd();
}

/**
 * Extract trace IDs from error for user-facing display
 */
export function getTraceIdsFromError(error: unknown): { correlationId: string | null; traceId?: string } {
  const err = error as Record<string, unknown> | undefined;
  const response = err?.response as Record<string, unknown> | undefined;
  const headers = response?.headers as Record<string, unknown> | undefined;

  return {
    correlationId: getCorrelationId(),
    traceId: headers?.['x-trace-id'] as string | undefined,
  };
}
