/**
 * RetryButton Component
 *
 * A button component with built-in retry logic and loading states
 * Requirements: 3.4, 6.4
 */

import React, { useState } from 'react';
import { ButtonWithLoading } from './LoadingStates';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface RetryButtonProps {
  onRetry: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  maxRetries?: number;
  retryDelay?: number;
  disabled?: boolean;
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  children,
  className = '',
  maxRetries = 3,
  retryDelay = 1000,
  disabled = false,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { handleError, showSuccess } = useErrorHandler();

  const handleRetry = async () => {
    if (retryCount >= maxRetries) {
      handleError(
        new Error('Maximum retry attempts reached'),
        'Retry operation'
      );
      return;
    }

    setIsRetrying(true);

    try {
      // Add delay for better UX
      if (retryCount > 0) {
        await new Promise(resolve =>
          setTimeout(resolve, retryDelay * retryCount)
        );
      }

      await onRetry();
      setRetryCount(0);
      showSuccess('Operation completed successfully');
    } catch (error) {
      setRetryCount(prev => prev + 1);
      handleError(error, `Retry attempt ${retryCount + 1}`);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <ButtonWithLoading
      isLoading={isRetrying}
      onClick={handleRetry}
      disabled={disabled || retryCount >= maxRetries}
      className={`
        ${className}
        ${retryCount >= maxRetries ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {isRetrying
        ? `Retrying... (${retryCount + 1}/${maxRetries})`
        : retryCount >= maxRetries
          ? 'Max retries reached'
          : retryCount > 0
            ? `Retry (${retryCount}/${maxRetries})`
            : children}
    </ButtonWithLoading>
  );
};

export default RetryButton;
