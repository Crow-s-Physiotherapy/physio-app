import React, { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import {
  withRetry,
  createErrorHandlers,
  type RetryOptions,
} from '../utils/errorHandling';

/**
 * Custom hook for API calls with error handling and retry logic
 * Requirements: 3.4, 4.5, 6.4
 */

interface UseApiCallOptions<T> extends RetryOptions {
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  loadingMessage?: string;
}

interface UseApiCallReturn<T> {
  data: T | null;
  loading: boolean;
  error: unknown | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export const useApiCall = <T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiCallOptions<T> = {}
): UseApiCallReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const toast = useToast();

  const {
    onSuccess,
    onError,
    showSuccessToast = false,
    showErrorToast = true,
    successMessage,
    loadingMessage,
    ...retryOptions
  } = options;

  // Memoize error handlers to prevent recreation
  const errorHandlers = React.useMemo(
    () => createErrorHandlers(toast.error),
    [toast.error]
  );

  // Memoize retry options to prevent recreation
  const stableRetryOptions = React.useMemo(
    () => retryOptions,
    [
      retryOptions.maxAttempts,
      retryOptions.delay,
      retryOptions.backoff,
      retryOptions.retryCondition,
    ]
  );

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setLoading(true);
      setError(null);

      let loadingToastId: string | undefined;
      if (loadingMessage) {
        loadingToastId = toast.loading(loadingMessage);
      }

      try {
        const result = await withRetry(
          () => apiFunction(...args),
          stableRetryOptions
        );

        setData(result);

        if (showSuccessToast && successMessage) {
          toast.success(successMessage);
        }

        onSuccess?.(result);
        return result;
      } catch (err) {
        setError(err);

        if (showErrorToast) {
          errorHandlers.handleApiError(err, 'API call');
        }

        onError?.(err);
        return null;
      } finally {
        setLoading(false);
        if (loadingToastId) {
          toast.dismiss(loadingToastId);
        }
      }
    },
    [
      apiFunction,
      onSuccess,
      onError,
      showSuccessToast,
      showErrorToast,
      successMessage,
      loadingMessage,
      toast,
      errorHandlers,
      stableRetryOptions,
    ]
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};

/**
 * Hook for form submissions with error handling
 */
interface UseFormSubmitOptions<T>
  extends Omit<UseApiCallOptions<T>, 'showSuccessToast' | 'showErrorToast'> {
  resetOnSuccess?: boolean;
}

export const useFormSubmit = <T>(
  submitFunction: (...args: any[]) => Promise<T>,
  options: UseFormSubmitOptions<T> = {}
): UseApiCallReturn<T> => {
  const { resetOnSuccess = true, ...apiOptions } = options;

  const apiCall = useApiCall(submitFunction, {
    ...apiOptions,
    showSuccessToast: true,
    showErrorToast: true,
    onSuccess: data => {
      if (resetOnSuccess) {
        // Reset form data after successful submission
        setTimeout(() => apiCall.reset(), 100);
      }
      options.onSuccess?.(data);
    },
  });

  return apiCall;
};

/**
 * Hook for data fetching with error handling
 */
interface UseFetchOptions<T> extends UseApiCallOptions<T> {
  immediate?: boolean;
}

export const useFetch = <T>(
  fetchFunction: () => Promise<T>,
  options: UseFetchOptions<T> = {}
): UseApiCallReturn<T> & { refetch: () => Promise<T | null> } => {
  const { immediate = false, ...apiOptions } = options;

  const apiCall = useApiCall(fetchFunction, {
    ...apiOptions,
    showErrorToast: true,
  });

  // Auto-execute on mount if immediate is true
  React.useEffect(() => {
    if (immediate) {
      apiCall.execute();
    }
  }, [immediate, apiCall.execute]);

  const refetch = useCallback(() => {
    return apiCall.execute();
  }, [apiCall.execute]);

  return {
    ...apiCall,
    refetch,
  };
};
