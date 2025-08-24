import { useState } from 'react';
import DonationForm from '../components/donations/DonationForm';
import PaymentProcessor from '../components/donations/PaymentProcessor';
import { sendDonationConfirmation } from '../services/emailService';
import type { DonationFormData, DonationResponse } from '../types/donation';

type DonationStep = 'form' | 'payment' | 'success' | 'error';

export default function Donations() {
  const [currentStep, setCurrentStep] = useState<DonationStep>('form');
  const [donationData, setDonationData] = useState<DonationFormData | null>(
    null
  );
  const [donationResponse, setDonationResponse] =
    useState<DonationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleDonationFormSubmit = (data: DonationFormData) => {
    setDonationData(data);
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = async (response: DonationResponse) => {
    try {
      setDonationResponse(response);

      // Send confirmation email for all donations (both one-time and monthly)
      if (donationData?.donorEmail && !donationData.isAnonymous) {
        try {
          const emailResult = await sendDonationConfirmation({
            donorName: donationData.donorName || 'Anonymous',
            donorEmail: donationData.donorEmail,
            amount: donationData.amount,
            currency: donationData.currency,
            message: donationData.message || '',
            donationId: response.donation.id,
            donationType: donationData.donationType,
            stripeSubscriptionId: response.donation.stripeSubscriptionId || '',
          });

          if (!emailResult.success) {
            console.warn('Email sending failed:', emailResult.error);
          } else {
            console.log('Donation confirmation email sent successfully');
          }
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }
      }

      setCurrentStep('success');
    } catch (error) {
      console.error('Error processing successful donation:', error);
      setErrorMessage(
        'Donation was processed but there was an error. Please contact support if you have any concerns.'
      );
      setCurrentStep('error');
    }
  };

  const handlePaymentError = (error: string) => {
    setErrorMessage(error);
    setCurrentStep('error');
  };

  const handlePaymentCancel = () => {
    setCurrentStep('form');
    setDonationData(null);
  };

  const handleStartOver = () => {
    setCurrentStep('form');
    setDonationData(null);
    setDonationResponse(null);
    setErrorMessage('');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'form':
        return (
          <DonationForm onSubmit={handleDonationFormSubmit} isLoading={false} />
        );

      case 'payment':
        return donationData ? (
          <PaymentProcessor
            donationData={donationData}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={handlePaymentCancel}
          />
        ) : null;

      case 'success':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="text-green-500 mb-4">
                <svg
                  className="h-16 w-16 mx-auto"
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

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Thank You for Your Donation!
              </h2>

              <p className="text-gray-600 mb-6">
                Your generous donation of $
                {donationResponse?.donation.amount.toFixed(2)} has been
                processed successfully.
              </p>

              {donationResponse?.donation.donorEmail &&
                !donationResponse.donation.isAnonymous && (
                  <div className="bg-blue-50 p-4 rounded-md mb-6">
                    <p className="text-sm text-blue-800">
                      A confirmation email has been sent to{' '}
                      {donationResponse.donation.donorEmail}
                    </p>
                  </div>
                )}

              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Donation ID:</strong>{' '}
                    {donationResponse?.donation.id}
                  </p>
                  <p>
                    <strong>Date:</strong>{' '}
                    {donationResponse?.donation.createdAt.toLocaleDateString()}
                  </p>
                  {donationResponse?.donation.message && (
                    <p>
                      <strong>Your Message:</strong> "
                      {donationResponse.donation.message}"
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleStartOver}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Make Another Donation
                  </button>
                  <button
                    onClick={() => (window.location.href = '/')}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Return to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg
                  className="h-16 w-16 mx-auto"
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

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Donation Failed
              </h2>

              <p className="text-gray-600 mb-6">
                {errorMessage ||
                  'There was an error processing your donation. Please try again.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleStartOver}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Try Again
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Support Our Mission
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your donations help us continue providing quality physiotherapy
            services, maintain our equipment, and develop new educational
            resources for our community.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - moved to top on mobile */}
          <div className="lg:order-2 space-y-6">
            {/* Impact Information */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Your Impact</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-200/50">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">$25</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-800">
                      One Session
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Provides one complete physiotherapy session for a patient in
                    need
                  </p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-200/50">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">$50</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-800">
                      Equipment & Resources
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Supports equipment maintenance and development of new
                    exercise resources
                  </p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-200/50">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">$100</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-800">
                      Educational Programs
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Funds development of new educational content and community
                    programs
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg border border-blue-300/30">
                <p className="text-xs text-blue-800 font-medium text-center">
                  💙 Every contribution makes a meaningful difference in our
                  community
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Questions?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                If you have any questions about donations or need assistance,
                please don't hesitate to contact us.
              </p>
              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  <strong>Email:</strong> matasanosphysio@gmail.com
                </p>
                <p>
                  <strong>Phone:</strong> (+61) 416 214 955
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 lg:order-1">{renderCurrentStep()}</div>
        </div>
      </div>
    </div>
  );
}
