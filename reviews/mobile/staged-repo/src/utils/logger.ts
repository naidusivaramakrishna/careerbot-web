// Lightweight logger silenced in production builds.
//
// React Native sets __DEV__ to true for development bundles and false for
// release builds. EXPO_PUBLIC_DEBUG_MODE lets us additionally opt in to
// verbose logging from a development build via .env.
//
// Use this instead of calling console.* directly so no diagnostic output
// (tokens, request bodies, API responses) ever reaches production logs.
//
// Ported from POC: src/utils/logger.js (direct port + TS types + JWT redaction).

type LogFn = (...args: unknown[]) => void;

const isDebugEnabled =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

const noop: LogFn = () => {
  /* intentionally empty */
};

// Defensive redaction: strip anything resembling a JWT before logging.
// Catches sloppy logger.info('token =', tokenValue) patterns.
function redactJwt(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[REDACTED-JWT]');
  }
  return value;
}

function makeLogger(fn: LogFn): LogFn {
  return (...args: unknown[]) => fn(...args.map(redactJwt));
}

export interface Logger {
  log: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

export const logger: Logger = {
  // logger is the OFFICIAL wrapper for console — these direct console calls
  // are deliberate (dev-only via isDebugEnabled gate, with JWT redaction).
  // The no-console rule blocks console.* everywhere else.
  // eslint-disable-next-line no-console
  log: isDebugEnabled ? makeLogger(console.log.bind(console)) : noop,
  // eslint-disable-next-line no-console
  info: isDebugEnabled ? makeLogger(console.info.bind(console)) : noop,
  warn: isDebugEnabled ? makeLogger(console.warn.bind(console)) : noop,
  error: isDebugEnabled ? makeLogger(console.error.bind(console)) : noop,
};

export default logger;
