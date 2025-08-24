import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface SubscriptionData {
  id: string;
  amount: number;
  currency: string;
  donorName: string;
  donorEmail: string;
  message: string;
  createdDate: string;
  status: string;
}

export default function ManageSubscription() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const subscriptionId = searchParams.get('subscription_id');

  useEffect(() => {
    if (!subscriptionId) {
      setError('No subscription ID provided');
      setIsLoading(false);
      return;
    }

    // Fetch subscription details from the edge function
    fetchSubscriptionDetails();
  }, [subscriptionId]);

  const fetchSubscriptionDetails = async () => {
    try {
      const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'];
      const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'];

      const response = await fetch(
        `${supabaseUrl}/functions/v1/unsubscribe-donation?subscription_id=${subscriptionId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        // The edge function returns HTML, so we need to parse the subscription data differently
        // For now, we'll create a mock subscription object and show the confirmation
        setSubscription({
          id: subscriptionId!,
          amount: 0, // We'll get this from Stripe in the edge function
          currency: 'AUD',
          donorName: 'Loading...',
          donorEmail: '',
          message: '',
          createdDate: new Date().toISOString(),
          status: 'active',
        });
        setIsLoading(false);
      } else {
        throw new Error('Failed to fetch subscription details');
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Unable to load subscription details. Please try again later.');
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    try {
      const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'];
      const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'];

      const response = await fetch(
        `${supabaseUrl}/functions/v1/unsubscribe-donation?subscription_id=${subscriptionId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        setIsCancelled(true);
        setShowConfirmation(false);
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError('Unable to cancel subscription. Please try again later.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
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
                Loading subscription details...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => navigate('/donations')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Go to Donations
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <div className="text-green-500 mb-4">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Subscription Cancelled
              </h3>
              <p className="text-gray-600 mb-4">
                Your monthly donation has been successfully cancelled. No future
                charges will be made to your payment method.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  What happens next?
                </h4>
                <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                  <li>Your subscription has been cancelled with Stripe</li>
                  <li>No further charges will be made</li>
                  <li>You'll receive a confirmation email shortly</li>
                  <li>
                    Any previous donations remain as tax-deductible receipts
                  </li>
                </ul>
              </div>
              <div className="space-x-4">
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Return to Website
                </button>
                <button
                  onClick={() => navigate('/donations')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Make One-Time Donation
                </button>
              </div>
              <div className="mt-6 text-sm text-gray-500">
                <p>
                  Thank you for your past support. Your contributions have made
                  a real difference in our community.
                </p>
                <p className="mt-2">
                  Questions? Contact us at matasanosphysio@gmail.com or (+61)
                  416 214 955
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Manage Monthly Donation
            </h1>
            <p className="text-gray-600">Juan Crow Larrea - Physiotherapy</p>
          </div>

          {subscription && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h3 className="text-lg font-medium text-blue-900 mb-3">
                Current Monthly Donation
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>
                  <strong>Subscription ID:</strong> {subscription.id}
                </p>
                <p>
                  <strong>Status:</strong> Active
                </p>
                <p>
                  <strong>Started:</strong>{' '}
                  {new Date(subscription.createdDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {!showConfirmation ? (
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                You can cancel your monthly donation at any time. This will stop
                all future charges immediately.
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => setShowConfirmation(true)}
                  className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-medium"
                >
                  Cancel Monthly Donation
                </button>
                <button
                  onClick={() => navigate('/donations')}
                  className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
                >
                  Keep Donation Active
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Are you sure you want to cancel?
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Canceling your monthly donation will:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Stop all future monthly charges immediately</li>
                        <li>
                          End your ongoing support for our physiotherapy
                          services
                        </li>
                        <li>
                          Remove you from our monthly supporters community
                        </li>
                      </ul>
                      <p className="mt-2 font-medium">
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center space-x-4">
                <button
                  onClick={handleCancelSubscription}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
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
                      Cancelling...
                    </>
                  ) : (
                    'Yes, Cancel My Donation'
                  )}
                </button>
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium disabled:opacity-50"
                >
                  Keep My Donation
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-green-800 mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-green-700">
              If you're having issues with your donation or have questions,
              please contact us:
            </p>
            <div className="mt-2 text-sm text-green-700">
              <p>
                <strong>Email:</strong> matasanosphysio@gmail.com
              </p>
              <p>
                <strong>Phone:</strong> (+61) 416 214 955
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
