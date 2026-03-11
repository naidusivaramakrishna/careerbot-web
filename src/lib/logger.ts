// src/lib/logger.ts
// Centralized logging utility for CareerBOT

interface LoggerConfig {
  enabledInProduction: boolean;
  prefix: string;
}

const config: LoggerConfig = {
  enabledInProduction: true, // Enable logs in production for Docker visibility
  prefix: '[CareerBOT]',
};

const isProduction = process.env.NODE_ENV === 'production';

function shouldLog(): boolean {
  return !isProduction || config.enabledInProduction;
}

export const logger = {
  debug: (_message: string, ..._args: unknown[]) => {
    if (shouldLog()) {
      console.log(`${config.prefix} [DEBUG]`, _message, ..._args);
    }
    void _message;
    void _args;
  },

  info: (_message: string, ..._args: unknown[]) => {
    if (shouldLog()) {
      console.log(`${config.prefix} [INFO]`, _message, ..._args);
    }
    void _message;
    void _args;
  },

  warn: (_message: string, ..._args: unknown[]) => {
    if (shouldLog()) {
      console.warn(`${config.prefix} [WARN]`, _message, ..._args);
    }
    void _message;
    void _args;
  },

  error: (_message: string, ..._args: unknown[]) => {
    // Always log errors
    console.error(`${config.prefix} [ERROR]`, _message, ..._args);
    void _message;
    void _args;
  },

  // API-specific logging (disabled in production)
  api: {
    request: (_method: string, _url: string, _data?: unknown) => {
      if (shouldLog()) {
        console.log(`${config.prefix} [API] ${_method} ${_url}`, _data ?? '');
      }
      void _method;
      void _url;
      void _data;
    },
    response: (_method: string, _url: string, _status: number) => {
      if (shouldLog()) {
        console.log(`${config.prefix} [API] ${_method} ${_url} -> ${_status}`);
      }
      void _method;
      void _url;
      void _status;
    },
    error: (_method: string, _url: string, _error: unknown) => {
      console.error(`${config.prefix} [API ERROR] ${_method} ${_url}`, _error);
      void _method;
      void _url;
      void _error;
    },
  },
};

export default logger;
