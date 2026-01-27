// src/lib/logger.ts
// Centralized logging utility for CareerBOT

interface LoggerConfig {
  enabledInProduction: boolean;
  prefix: string;
}

const config: LoggerConfig = {
  enabledInProduction: false,
  prefix: '[CareerBOT]',
};

const isProduction = process.env.NODE_ENV === 'production';

function shouldLog(): boolean {
  return !isProduction || config.enabledInProduction;
}

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (shouldLog()) {
      console.log(`${config.prefix} [DEBUG]`, message, ...args);
    }
  },

  info: (message: string, ...args: unknown[]) => {
    if (shouldLog()) {
      console.log(`${config.prefix} [INFO]`, message, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (shouldLog()) {
      console.warn(`${config.prefix} [WARN]`, message, ...args);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    // Always log errors
    console.error(`${config.prefix} [ERROR]`, message, ...args);
  },

  // API-specific logging (disabled in production)
  api: {
    request: (method: string, url: string, data?: unknown) => {
      if (shouldLog()) {
        console.log(`${config.prefix} [API] ${method} ${url}`, data ?? '');
      }
    },
    response: (method: string, url: string, status: number) => {
      if (shouldLog()) {
        console.log(`${config.prefix} [API] ${method} ${url} -> ${status}`);
      }
    },
    error: (method: string, url: string, error: unknown) => {
      console.error(`${config.prefix} [API ERROR] ${method} ${url}`, error);
    },
  },
};

export default logger;
