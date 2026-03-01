/**
 * Structured logging and observability
 * All logs include:
 * - Timestamp
 * - Log level (info, warn, error, debug)
 * - Component/module
 * - Message
 * - Context (user ID, request ID, etc.)
 *
 * Never logs: auth tokens, passwords, sensitive keys
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface LoggerConfig {
  isDevelopment: boolean;
  enableRemoteLogging?: boolean;
}

let config: LoggerConfig = {
  isDevelopment: typeof window === 'undefined' ? process.env.NODE_ENV === 'development' : false,
  enableRemoteLogging: false,
};

/**
 * Initialize logging configuration
 */
export function initializeLogger(cfg: Partial<LoggerConfig>) {
  config = { ...config, ...cfg };
}

/**
 * Create a logger instance for a specific module
 *
 * @example
 * const logger = createLogger('blog-service');
 * logger.info('Blog post created', { postId: '123', slug: 'my-post' });
 */
export function createLogger(module: string) {
  return {
    debug: (message: string, context?: Record<string, unknown>) =>
      log('debug', module, message, context),

    info: (message: string, context?: Record<string, unknown>) =>
      log('info', module, message, context),

    warn: (message: string, context?: Record<string, unknown>) =>
      log('warn', module, message, context),

    error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) =>
      logError('error', module, message, error, context),
  };
}

/**
 * Log a message with context
 */
function log(level: LogLevel, module: string, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    ...(context && { context }),
  };

  // Console output in development
  if (config.isDevelopment) {
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${module}]`;
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(prefix, message, context || '');
  }

  // Send to remote logging service if enabled (e.g., Sentry, Datadog)
  if (config.enableRemoteLogging) {
    sendRemoteLog(entry);
  }
}

/**
 * Log an error with stack trace
 */
function logError(
  level: LogLevel,
  module: string,
  message: string,
  error?: Error | unknown,
  context?: Record<string, unknown>
) {
  const errorInfo = error instanceof Error ? {
    message: error.message,
    stack: error.stack,
    code: (error as unknown as { code?: string }).code,
  } : error ? {
    message: String(error),
  } : undefined;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    context,
    ...(errorInfo && { error: errorInfo }),
  };

  // Console output
  if (config.isDevelopment) {
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${module}]`;
    if (error instanceof Error) {
      console.error(prefix, message, error);
    } else {
      console.error(prefix, message, error || '');
    }
  }

  // Remote logging
  if (config.enableRemoteLogging) {
    sendRemoteLog(entry);
  }
}

/**
 * Send log to remote service
 * Placeholder for integration with Sentry, Datadog, LogRocket, etc.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function sendRemoteLog(entry: LogEntry) {
  // TODO: Integrate with observability service
  // Example: Sentry.captureMessage(entry.message, entry.level);
  // Example: datadog.logger.log(entry.message, entry);
  // console.debug('Remote log:', entry);
}

/**
 * Structured logger for API route handlers
 */
export const apiLogger = createLogger('api');

/**
 * Structured logger for database operations
 */
export const dbLogger = createLogger('database');

/**
 * Structured logger for authentication
 */
export const authLogger = createLogger('auth');

/**
 * Structured logger for business logic
 */
export const appLogger = createLogger('app');

/**
 * Metrics tracker for monitoring
 * (To integrate with monitoring services)
 */
export interface MetricEvent {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
}

export function trackMetric(metric: MetricEvent) {
  if (config.isDevelopment) {
    console.debug(`[METRIC] ${metric.name}: ${metric.value}${metric.unit || ''}`);
  }

  // TODO: Send to monitoring service (e.g., Datadog, StatsD)
}

/**
 * Track API response times
 */
export function trackApiLatency(
  endpoint: string,
  method: string,
  statusCode: number,
  durationMs: number
) {
  trackMetric({
    name: 'api_request_latency',
    value: durationMs,
    unit: 'ms',
    tags: {
      endpoint,
      method,
      status_code: String(statusCode),
    },
  });
}

/**
 * Track error occurrence
 */
export function trackError(code: string, module: string) {
  trackMetric({
    name: 'error_count',
    value: 1,
    tags: {
      code,
      module,
    },
  });
}
