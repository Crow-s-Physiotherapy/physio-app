/**
 * ToastTest Component
 *
 * Simple component to test if toast notifications are working
 */

import React from 'react';
import { useToast } from '../../contexts/ToastContext';

const ToastTest: React.FC = () => {
  const toast = useToast();

  const testSuccess = () => {
    toast.success('Success toast is working!');
  };

  const testError = () => {
    toast.error('Error toast is working!');
  };

  const testWarning = () => {
    toast.warning('Warning toast is working!');
  };

  const testInfo = () => {
    toast.info('Info toast is working!');
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Toast Test</h3>
      <div className="space-x-2">
        <button
          onClick={testSuccess}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Success
        </button>
        <button
          onClick={testError}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Test Error
        </button>
        <button
          onClick={testWarning}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Test Warning
        </button>
        <button
          onClick={testInfo}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Info
        </button>
      </div>
    </div>
  );
};

export default ToastTest;
