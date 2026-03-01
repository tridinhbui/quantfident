/**
 * Structured error handling and error boundaries
 * Provides consistent error responses and tracking across the application
 */

import { NextResponse } from 'next/server';
import { apiLogger, trackError } from '@/lib/observability/logger';

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  error: string;
  code: string;
  status: number;
  timestamp: string;
  requestId?: string;
  details?: Record<string, unknown>;
}

/**
 * Custom error classes for different scenarios
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public code: string,
    public status: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'validation_error', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 'auth_required', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access forbidden') {
    super(message, 'forbidden', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(`${resource} not found`, 'not_found', 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfterSeconds: number) {
    super('Too many requests', 'rate_limit_exceeded', 429);
    this.details = { retryAfter: retryAfterSeconds };
    this.name = 'RateLimitError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 'conflict', 409);
    this.name = 'ConflictError';
  }
}

/**
 * Convert error to standard API response
 */
export function errorToResponse(error: unknown, requestId?: string): NextResponse<ApiErrorResponse> {
  let apiError: ApiError;

  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof SyntaxError) {
    apiError = new ValidationError('Invalid JSON');
  } else if (error instanceof TypeError) {
    apiError = new ValidationError(error.message);
  } else if (error instanceof Error) {
    // Generic error
    apiLogger.error('Unhandled error', error);
    apiError = new ApiError('Internal server error', 'server_error', 500);
  } else {
    // Unknown error type
    apiLogger.error('Unknown error type', error);
    apiError = new ApiError('Internal server error', 'server_error', 500);
  }

  // Track error
  trackError(apiError.code, 'api');

  // Build response
  const response: ApiErrorResponse = {
    error: apiError.message,
    code: apiError.code,
    status: apiError.status,
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
    ...(apiError.details && { details: apiError.details }),
  };

  // Log error if server error
  if (apiError.status >= 500) {
    apiLogger.error(`API Error [${apiError.code}]`, {
      status: apiError.status,
      message: apiError.message,
      details: apiError.details,
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiError.status === 429 && apiError.details?.retryAfter) {
    headers['Retry-After'] = String(apiError.details.retryAfter);
  }

  return NextResponse.json(response, {
    status: apiError.status,
    headers,
  });
}

/**
 * Middleware for catching and logging unhandled promise rejections
 */
export function setupGlobalErrorHandlers() {
  if (typeof window !== 'undefined') {
    // Client-side error handling
    window.addEventListener('error', (event) => {
      apiLogger.error('Unhandled error', event.error);
      trackError('unhandled_error', 'browser');
    });

    window.addEventListener('unhandledrejection', (event) => {
      apiLogger.error('Unhandled promise rejection', event.reason);
      trackError('unhandled_rejection', 'browser');
    });
  }
}

/**
 * Safe async handler wrapper for API routes
 * Catches errors and converts to proper responses
 */
export function asyncHandler(
  fn: (req: Request) => Promise<NextResponse>
): (req: Request) => Promise<NextResponse> {
  return async (req: Request) => {
    try {
      return await fn(req);
    } catch (error) {
      return errorToResponse(error);
    }
  };
}

/**
 * Validate required environment variables
 * Throws error if any are missing
 */
export function validateEnv(vars: string[]) {
  const missing = vars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(json: string, fallback?: T): T | null {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    apiLogger.warn('JSON parse error', { error: String(error), json: json.slice(0, 100) });
    return fallback ?? null;
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 100
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts - 1) {
        const delayMs = baseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('Max retry attempts exceeded');
}
