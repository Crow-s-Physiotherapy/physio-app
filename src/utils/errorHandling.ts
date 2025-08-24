/**
 * Error handling utilities for API failures and user feedback
 * Requirements: 3.4, 4.5, 6.4
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    status: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, AppError);
  }
}

/**
 * Parse and normalize different types of errors
 */
export const parseError = (error: unknown): ApiError => {
  // Handle AppError instances
  if (error instanceof AppError) {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
    };
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return {
      message: error.message,
      status: 500,
      code: 'UNKNOWN_ERROR',
    };
  }

  // Handle fetch/network errors
  if (typeof error === 'object' && error !== null) {
    const err = error as any;

    // Handle Supabase errors
    if (err.error && err.error.message) {
      return {
        message: err.error.message,
        status: err.status || 500,
        code: err.error.code || 'SUPABASE_ERROR',
        details: err.error.details,
      };
    }

    // Handle HTTP response errors
    if (err.status && err.statusText) {
      return {
        message: err.statusText || 'Request failed',
        status: err.status,
        code: 'HTTP_ERROR',
      };
    }

    // Handle generic object errors
    if (err.message) {
      return {
        message: err.message,
        status: err.status || 500,
        code: err.code || 'GENERIC_ERROR',
      };
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      status: 500,
      code: 'STRING_ERROR',
    };
  }

  // Fallback for unknown error types
  return {
    message: 'An unexpected error occurred',
    status: 500,
    code: 'UNKNOWN_ERROR',
    details: error,
  };
};

/**
 * Get user-friendly error messages based on error codes
 */
export const getUserFriendlyMessage = (error: ApiError): string => {
  const { code, status, message } = error;

  // Network and connectivity errors
  if (code === 'NETWORK_ERROR' || status === 0) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  // Authentication errors
  if (status === 401 || code === 'UNAUTHORIZED') {
    return 'Your session has expired. Please refresh the page and try again.';
  }

  // Permission errors
  if (status === 403 || code === 'FORBIDDEN') {
    return 'You do not have permission to perform this action.';
  }

  // Not found errors
  if (status === 404 || code === 'NOT_FOUND') {
    return 'The requested resource was not found.';
  }

  // Validation errors
  if (status === 400 || code === 'VALIDATION_ERROR') {
    return message || 'Please check your input and try again.';
  }

  // Rate limiting
  if (status === 429 || code === 'RATE_LIMIT') {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Server errors
  if ((status && status >= 500) || code === 'INTERNAL_ERROR') {
    return 'A server error occurred. Please try again later.';
  }

  // Google Calendar specific errors
  if (code === 'CALENDAR_ERROR') {
    return 'Unable to access calendar. Please try again or contact support.';
  }

  if (code === 'CALENDAR_CONFLICT') {
    return 'This time slot is no longer available. Please select a different time.';
  }

  // Payment errors
  if (code === 'PAYMENT_ERROR') {
    return 'Payment processing failed. Please check your payment details and try again.';
  }

  // Email errors
  if (code === 'EMAIL_ERROR') {
    return 'Unable to send email notification. The appointment was still created successfully.';
  }

  // Video/YouTube errors
  if (code === 'VIDEO_ERROR') {
    return 'Unable to load video content. Please try again later.';
  }

  // Return the original message if it's user-friendly, otherwise use a generic message
  if (message && message.length < 100 && !message.includes('Error:')) {
    return message;
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Retry mechanism for failed operations
 */
export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  retryCondition?: (error: unknown) => boolean;
}

export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    retryCondition = error => {
      const parsed = parseError(error);
      // Retry on network errors, server errors, and rate limiting
      return (
        parsed.status === 0 ||
        (parsed.status && parsed.status >= 500) ||
        parsed.status === 429 ||
        parsed.code === 'NETWORK_ERROR'
      );
    },
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Don't retry if the error doesn't meet retry conditions
      if (!retryCondition(error)) {
        break;
      }

      // Calculate delay with optional exponential backoff
      const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;

      // Add some jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * currentDelay;
      const totalDelay = currentDelay + jitter;

      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError;
};

/**
 * Async error handler wrapper for React components
 */
export const handleAsyncError = (
  error: unknown,
  context: string = 'Operation'
): ApiError => {
  const parsedError = parseError(error);

  // Log error for debugging (in development)
  if (import.meta.env.DEV) {
    console.error(`${context} failed:`, {
      message: parsedError.message,
      status: parsedError.status,
      code: parsedError.code,
      details: parsedError.details,
      originalError: error,
    });
  }

  return parsedError;
};

/**
 * Create error handlers for common scenarios
 */
export const createErrorHandlers = (showToast: (message: string) => void) => ({
  handleApiError: (error: unknown, context: string = 'Operation') => {
    const parsedError = handleAsyncError(error, context);
    const userMessage = getUserFriendlyMessage(parsedError);
    showToast(userMessage);
    return parsedError;
  },

  handleFormError: (
    error: unknown,
    fallbackMessage: string = 'Please check your input and try again.'
  ) => {
    const parsedError = handleAsyncError(error, 'Form submission');
    const userMessage =
      parsedError.status === 400 ? parsedError.message : fallbackMessage;
    showToast(userMessage);
    return parsedError;
  },

  handleNetworkError: (error: unknown) => {
    const parsedError = handleAsyncError(error, 'Network request');
    const userMessage =
      'Unable to connect to the server. Please check your internet connection.';
    showToast(userMessage);
    return parsedError;
  },
});

/**
 * Error boundary error handler
 */
export const handleErrorBoundaryError = (
  error: Error,
  errorInfo: React.ErrorInfo
) => {
  // Log error for debugging
  console.error('ErrorBoundary caught an error:', error, errorInfo);

  // In production, you might want to send this to an error reporting service
  if (import.meta.env.PROD) {
    // Example: Send to error reporting service
    // errorReportingService.captureException(error, { extra: errorInfo });
  }
};
