import React, { useState, useEffect } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { stripeService } from '../../services/stripeService';
import type { DonationFormData, DonationResponse } from '../../types/donation';

interface PaymentProcessorProps {
  donationData: DonationFormData;
  onSuccess: (donation: DonationResponse) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

interface PaymentFormProps extends PaymentProcessorProps {
  clientSecret: string;
  donationResponse: DonationResponse;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
};

function PaymentForm({
  donationData,
  clientSecret,
  donationResponse,
  onSuccess,
  onError,
  onCancel,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Payment system is not ready. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card information is missing. Please try again.');
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: donationData.donorName || 'Anonymous Donor',
              email: donationData.donorEmail || null,
            },
          },
          ...(donationData.donorEmail && { receipt_email: donationData.donorEmail }),
        }
      );

      if (error) {
        onError(error.message || 'Payment failed. Please try again.');
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Mark as completed to prevent re-enabling the button
        setIsCompleted(true);

        // Payment successful
        const successMessage =
          donationData.donationType === 'monthly'
            ? 'Thank you for your monthly donation commitment!'
            : 'Thank you for your donation!';

        const successResponse: DonationResponse = {
          donation: {
            ...donationResponse.donation,
            id: `donation_${paymentIntent.id}`,
            stripePaymentIntentId: paymentIntent.id,
            paymentStatus: 'completed',
            updatedAt: new Date(),
          },
          success: true,
          message: successMessage,
        };

        onSuccess(successResponse);
      } else {
        onError('Payment was not completed successfully. Please try again.');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      onError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardChange = (event: any) => {
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Complete Your Donation
        </h3>
        <div className="bg-blue-50 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Donation Amount:</span>
            <span className="text-lg font-semibold text-blue-600">
              ${donationData.amount.toFixed(2)} {donationData.currency}
            </span>
          </div>
          {!donationData.isAnonymous && donationData.donorName && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-600">Donor:</span>
              <span className="text-sm text-gray-900">
                {donationData.donorName}
              </span>
            </div>
          )}
          {donationData.message && (
            <div className="mt-2">
              <span className="text-sm text-gray-600">Message:</span>
              <p className="text-sm text-gray-900 mt-1 italic">
                "{donationData.message}"
              </p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <CardElement
              options={cardElementOptions}
              onChange={handleCardChange}
            />
          </div>
          {cardError && (
            <p className="mt-2 text-sm text-red-600">{cardError}</p>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || isProcessing || isCompleted}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              isProcessing || !stripe || isCompleted
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing Payment...
              </span>
            ) : isCompleted ? (
              <span className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Payment Complete
              </span>
            ) : (
              `Donate $${donationData.amount.toFixed(2)}`
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 p-3 bg-gray-50 rounded-md">
        <div className="flex items-center">
          <svg
            className="h-5 w-5 text-green-500 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <p className="text-sm text-gray-600">
            Your payment is secured by Stripe. We never store your card
            information.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentProcessor(props: PaymentProcessorProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [donationResponse, setDonationResponse] =
    useState<DonationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create payment intent or subscription
        const response = await stripeService.processDonation(
          props.donationData
        );

        if (!response.success || !response.clientSecret) {
          throw new Error(response.message || 'Failed to initialize payment');
        }

        setClientSecret(response.clientSecret);
        setDonationResponse(response); // Store the full response to access subscription ID later
      } catch (err) {
        console.error('Payment initialization error:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to initialize payment'
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [props.donationData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="ml-3 text-gray-600">
            Initializing secure payment...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Payment Initialization Failed
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={props.onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!clientSecret || !donationResponse) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">
            Unable to initialize payment. Please try again.
          </p>
          <button
            onClick={props.onCancel}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripeService.getStripeInstance()}>
      <PaymentForm
        {...props}
        clientSecret={clientSecret}
        donationResponse={donationResponse}
      />
    </Elements>
  );
}
