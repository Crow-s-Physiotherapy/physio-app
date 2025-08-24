/**
 * useErrorHandler Hook
 *
 * Custom hook for handling errors with toast notifications and user feedback
 * Requirements: 3.4, 4.5, 6.4
 */

import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import {
  parseError,
  getUserFriendlyMessage,
  handleAsyncError,
} from '../utils/errorHandling';

export const useErrorHandler = () => {
  const toast = useToast();

  const handleError = useCallback(
    (error: unknown, context: string = 'Operation') => {
      const parsedError = handleAsyncError(error, context);
      const userMessage = getUserFriendlyMessage(parsedError);

      // Show error toast
      toast.error(userMessage);

      return parsedError;
    },
    [toast]
  );

  const handleApiError = useCallback(
    (error: unknown, context: string = 'API request') => {
      return handleError(error, context);
    },
    [handleError]
  );

  const handleFormError = useCallback(
    (
      error: unknown,
      fallbackMessage: string = 'Please check your input and try again.'
    ) => {
      const parsedError = parseError(error);
      const userMessage =
        parsedError.status === 400 ? parsedError.message : fallbackMessage;

      toast.error(userMessage);
      return parsedError;
    },
    [toast]
  );

  const handleNetworkError = useCallback(
    (error: unknown) => {
      const userMessage =
        'Unable to connect to the server. Please check your internet connection.';
      toast.error(userMessage);
      return parseError(error);
    },
    [toast]
  );

  const showSuccess = useCallback(
    (message: string) => {
      toast.success(message);
    },
    [toast]
  );

  const showWarning = useCallback(
    (message: string) => {
      toast.warning(message);
    },
    [toast]
  );

  const showInfo = useCallback(
    (message: string) => {
      toast.info(message);
    },
    [toast]
  );

  const showLoading = useCallback(
    (message: string) => {
      return toast.loading(message);
    },
    [toast]
  );

  const dismissToast = useCallback(
    (toastId?: string) => {
      toast.dismiss(toastId);
    },
    [toast]
  );

  return {
    handleError,
    handleApiError,
    handleFormError,
    handleNetworkError,
    showSuccess,
    showWarning,
    showInfo,
    showLoading,
    dismissToast,
  };
};

export default useErrorHandler;
