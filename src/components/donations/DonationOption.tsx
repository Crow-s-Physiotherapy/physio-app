import { useState } from 'react';
import DonationForm from './DonationForm';
import PaymentProcessor from './PaymentProcessor';
import { emailService } from '../../services/emailService';
import type { DonationFormData, DonationResponse } from '../../types/donation';

interface DonationOptionProps {
  onDonationComplete?: (donation: DonationResponse) => void;
  onSkip: () => void;
  showInBookingFlow?: boolean;
}

type DonationStep = 'option' | 'form' | 'payment' | 'success';

export default function DonationOption({
  onDonationComplete,
  onSkip,
}: DonationOptionProps) {
  const [currentStep, setCurrentStep] = useState<DonationStep>('option');
  const [donationData, setDonationData] = useState<DonationFormData | null>(
    null
  );
  const [donationResponse, setDonationResponse] =
    useState<DonationResponse | null>(null);

  const handleDonateClick = () => {
    setCurrentStep('form');
  };

  const handleDonationFormSubmit = (data: DonationFormData) => {
    setDonationData(data);
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = async (response: DonationResponse) => {
    try {
      // Send confirmation email
      if (donationData?.donorEmail && !donationData.isAnonymous) {
        try {
          const emailResult = await emailService.sendDonationConfirmation({
            donorName: donationData.donorName || 'Anonymous',
            donorEmail: donationData.donorEmail,
            amount: donationData.amount,
            currency: donationData.currency,
            message: donationData.message || '',
            donationType: donationData.donationType,
            donationId: response.donation.id,
          });

          if (!emailResult.success) {
            console.warn('Email sending failed:', emailResult.error);
            // Could show a warning to user but don't fail the donation
          } else {
            console.log('Donation confirmation email sent successfully');
          }
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Don't fail the donation process if email fails
        }
      }

      setDonationResponse(response);
      setCurrentStep('success');
      if (onDonationComplete) {
        onDonationComplete(response);
      }
    } catch (error) {
      console.error('Error processing successful donation:', error);
      // Still show success since payment went through
      setDonationResponse(response);
      setCurrentStep('success');
      if (onDonationComplete) {
        onDonationComplete(response);
      }
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Donation payment error:', error);
    // Go back to form to try again
    setCurrentStep('form');
  };

  const handlePaymentCancel = () => {
    setCurrentStep('form');
  };

  const handleSkipDonation = () => {
    onSkip();
  };

  const handleDonationComplete = () => {
    onSkip(); // Continue with the booking flow
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'option':
        return (
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-8 border border-blue-200 shadow-xl">
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-4 shadow-lg">
                  <svg
                    className="h-10 w-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl mr-2">🎉</span>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Appointment Confirmed!
                  </h3>
                  <span className="text-2xl ml-2">✨</span>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  💙 Want to Support Our Mission?
                </h4>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Your appointment is all set! Would you like to make a donation
                  to help us continue providing quality physiotherapy services
                  to our community?
                </p>

                <div className="text-sm text-gray-500 mb-4">
                  <span className="inline-flex items-center">
                    <svg
                      className="w-4 h-4 mr-1 text-green-500"
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
                    100% of donations go directly to patient care
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-all">
                  <div className="text-2xl mb-2">🏥</div>
                  <div className="font-bold text-blue-600 text-lg">$25</div>
                  <div className="text-gray-600 text-sm">
                    Supports one patient session
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-purple-100 hover:shadow-md transition-all">
                  <div className="text-2xl mb-2">🔧</div>
                  <div className="font-bold text-purple-600 text-lg">$50</div>
                  <div className="text-gray-600 text-sm">
                    Equipment maintenance
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-pink-100 hover:shadow-md transition-all">
                  <div className="text-2xl mb-2">📚</div>
                  <div className="font-bold text-pink-600 text-lg">$100</div>
                  <div className="text-gray-600 text-sm">
                    New educational programs
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleDonateClick}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
                >
                  <span className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 mr-2 group-hover:animate-pulse"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    Make a Donation
                  </span>
                </button>
                <button
                  onClick={handleSkipDonation}
                  className="px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:bg-white hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all duration-200"
                >
                  Continue Without Donating
                </button>
              </div>

              <div className="mt-6 flex items-center justify-center text-xs text-gray-500">
                <svg
                  className="w-4 h-4 mr-1 text-green-500"
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
                Donations are optional and secure • You can also donate anytime
                on our donations page
              </div>
            </div>
          </div>
        );

      case 'form':
        return (
          <div>
            <div className="mb-4 text-center">
              <button
                onClick={() => setCurrentStep('option')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to options
              </button>
            </div>
            <DonationForm
              onSubmit={handleDonationFormSubmit}
              isLoading={false}
              showInBookingFlow={true}
            />
          </div>
        );

      case 'payment':
        return donationData ? (
          <div>
            <div className="mb-4 text-center">
              <button
                onClick={() => setCurrentStep('form')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to donation form
              </button>
            </div>
            <PaymentProcessor
              donationData={donationData}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />
          </div>
        ) : null;

      case 'success':
        return (
          <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-8 border border-green-200 shadow-xl">
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-4 shadow-lg animate-pulse">
                  <svg
                    className="h-10 w-10 text-white"
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
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl mr-2">🎉</span>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Thank You So Much!
                  </h3>
                  <span className="text-2xl ml-2">💚</span>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6">
                <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                  Your generous{' '}
                  {donationResponse?.donation.donationType === 'monthly'
                    ? 'monthly '
                    : ''}
                  donation of{' '}
                  <span className="font-bold text-green-600">
                    ${donationResponse?.donation.amount.toFixed(2)}
                    {donationResponse?.donation.donationType === 'monthly' &&
                      '/month'}
                  </span>{' '}
                  has been processed successfully! 🌟
                </p>

                {donationResponse?.donation.donationType === 'monthly' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-center mb-2">
                      <svg
                        className="w-5 h-5 text-purple-600 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span className="font-semibold text-purple-800">
                        Monthly Support Activated!
                      </span>
                    </div>
                    <p className="text-sm text-purple-700">
                      You'll receive monthly updates on how your ongoing support
                      is making a difference. You can manage or cancel your
                      subscription anytime.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl mb-1">🏥</div>
                    <div className="text-sm font-medium text-gray-700">
                      Better Care
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">👥</div>
                    <div className="text-sm font-medium text-gray-700">
                      More Patients
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">📈</div>
                    <div className="text-sm font-medium text-gray-700">
                      Growing Impact
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-green-800 mb-1">
                  🌱 Your Impact
                </p>
                <p className="text-sm text-green-700">
                  Your support helps us continue providing quality physiotherapy
                  services, maintain our equipment, and develop new educational
                  resources for our community.
                </p>
              </div>

              <button
                onClick={handleDonationComplete}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
              >
                <span className="flex items-center justify-center">
                  <svg
                    className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                  Continue to Your Appointment
                </span>
              </button>

              <p className="text-xs text-gray-500 mt-4">
                A confirmation email has been sent with your donation receipt
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="donation-option">{renderCurrentStep()}</div>;
}
