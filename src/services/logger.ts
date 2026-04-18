/**
 * Structured logging / observability layer for STEMulator.
 *
 * Provides:
 *   - Levelled log output (DEBUG → INFO → WARN → ERROR)
 *   - Structured JSON metadata alongside human-readable messages
 *   - Automatic timestamps and caller labels
 *   - Error aggregation for surfacing in the UI
 *   - Configurable minimum log level (defaults to INFO in prod, DEBUG in dev)
 *
 * In production this can be pointed at a remote log collector (Datadog,
 * CloudWatch, etc.) by replacing the `transport` function.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
}

/** Subscribers receive every entry that passes the minimum level filter. */
export type LogSubscriber = (entry: LogEntry) => void;

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const isDev = import.meta.env?.DEV ?? true;
let minLevel: LogLevel = isDev ? "DEBUG" : "INFO";

const subscribers: Set<LogSubscriber> = new Set();

/** Rolling buffer of the last N errors, exposed for health / UI. */
const MAX_RECENT_ERRORS = 50;
const recentErrors: LogEntry[] = [];

// ---------------------------------------------------------------------------
// Transport (console by default — swap for remote in production)
// ---------------------------------------------------------------------------

function defaultTransport(entry: LogEntry): void {
  const tag = `[${entry.timestamp}] [${entry.level}]`;
  const consoleFn =
    entry.level === "ERROR"
      ? console.error
      : entry.level === "WARN"
        ? console.warn
        : entry.level === "DEBUG"
          ? console.debug
          : console.log;

  if (entry.meta && Object.keys(entry.meta).length > 0) {
    consoleFn(tag, entry.message, entry.meta);
  } else {
    consoleFn(tag, entry.message);
  }
}

// ---------------------------------------------------------------------------
// Core logger
// ---------------------------------------------------------------------------

function log(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
): void {
  if (LOG_LEVELS[level] < LOG_LEVELS[minLevel]) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    meta,
  };

  // Persist recent errors
  if (level === "ERROR") {
    recentErrors.push(entry);
    if (recentErrors.length > MAX_RECENT_ERRORS) recentErrors.shift();
  }

  defaultTransport(entry);

  // Notify subscribers (e.g. UI error banners, telemetry sinks)
  for (const sub of subscribers) {
    try {
      sub(entry);
    } catch {
      // Never let a subscriber crash the logger
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) =>
    log("DEBUG", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("INFO", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("WARN", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) =>
    log("ERROR", msg, meta),

  /** Change the minimum log level at runtime. */
  setLevel(level: LogLevel): void {
    minLevel = level;
  },

  /** Subscribe to log entries (returns an unsubscribe function). */
  subscribe(fn: LogSubscriber): () => void {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  },

  /** Get the rolling buffer of recent ERROR entries. */
  getRecentErrors(): readonly LogEntry[] {
    return recentErrors;
  },

  /** Clear the recent-error buffer (e.g. after the user dismisses a banner). */
  clearRecentErrors(): void {
    recentErrors.length = 0;
  },
};
