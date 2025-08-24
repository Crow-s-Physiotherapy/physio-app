import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type {
  DonationFormData,
  PresetDonationAmount,
  MonthlySubscriptionAmount,
} from '../../types/donation';
import {
  DONATION_AMOUNTS,
  SUPPORTED_CURRENCIES,
  MONTHLY_SUBSCRIPTION_AMOUNTS,
} from '../../types/donation';
import { useToast } from '../../contexts/ToastContext';
import {STRIPE_PRODUCT_IDS} from '../../types/donation';

interface DonationFormProps {
  onSubmit: (data: DonationFormData) => void;
  isLoading?: boolean;
  initialAmount?: number;
  showInBookingFlow?: boolean;
}

const donationSchema = yup.object({
  amount: yup
    .number()
    .min(1, 'Minimum donation amount is $1')
    .max(10000, 'Maximum donation amount is $10,000')
    .required('Please enter a donation amount')
    .test(
      'monthly-amount',
      'Please select one of the available monthly amounts',
      function (value) {
        const { donationType } = this.parent;
        if (donationType === 'monthly') {
          return Object.keys(STRIPE_PRODUCT_IDS).map(Number).includes(value);
        }
        return true;
      }
    ),
  currency: yup
    .string()
    .oneOf(SUPPORTED_CURRENCIES, 'Please select a valid currency')
    .required('Please select a currency'),
  donationType: yup
    .string()
    .oneOf(['one_time', 'monthly'], 'Please select a valid donation type')
    .required('Please select donation type'),
  donorName: yup.string().when(['isAnonymous', 'donationType'], {
    is: (isAnonymous: boolean, donationType: string) =>
      !isAnonymous || donationType === 'monthly',
    then: schema => schema.required('Please enter your name'),
    otherwise: schema => schema.optional(),
  }),
  donorEmail: yup.string().when(['isAnonymous', 'donationType'], {
    is: (isAnonymous: boolean, donationType: string) =>
      !isAnonymous || donationType === 'monthly',
    then: schema =>
      schema
        .email('Please enter a valid email')
        .required('Please enter your email'),
    otherwise: schema => schema.email('Please enter a valid email').optional(),
  }),
  message: yup
    .string()
    .max(500, 'Message must be less than 500 characters')
    .optional(),
  isAnonymous: yup
    .boolean()
    .required()
    .test(
      'monthly-anonymous',
      'Monthly donations cannot be anonymous (email required for cancellation)',
      function (value) {
        const { donationType } = this.parent;
        if (donationType === 'monthly' && value === true) {
          return false;
        }
        return true;
      }
    ),
});

export default function DonationForm({
  onSubmit,
  isLoading = false,
  initialAmount,
  showInBookingFlow = false,
}: DonationFormProps) {
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedPresetAmount, setSelectedPresetAmount] = useState<
    PresetDonationAmount | MonthlySubscriptionAmount | null
  >(
    initialAmount &&
      (DONATION_AMOUNTS.includes(initialAmount as PresetDonationAmount) ||
        MONTHLY_SUBSCRIPTION_AMOUNTS.includes(
          initialAmount as MonthlySubscriptionAmount
        ))
      ? (initialAmount as PresetDonationAmount | MonthlySubscriptionAmount)
      : null
  );
  const toast = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DonationFormData>({
    resolver: yupResolver(donationSchema) as any,
    defaultValues: {
      amount: initialAmount || 25,
      currency: 'USD',
      donationType: 'one_time',
      isAnonymous: false,
      donorName: '',
      donorEmail: '',
      message: '',
    },
  });

  const isAnonymous = watch('isAnonymous');
  const currentAmount = watch('amount');
  const donationType = watch('donationType');

  // Reset amount and anonymous setting when switching donation types
  useEffect(() => {
    if (donationType === 'monthly') {
      // Reset to first available monthly amount if current amount is not in monthly options
      if (
        !MONTHLY_SUBSCRIPTION_AMOUNTS.includes(
          currentAmount as MonthlySubscriptionAmount
        )
      ) {
        setValue('amount', MONTHLY_SUBSCRIPTION_AMOUNTS[0]);
        setSelectedPresetAmount(MONTHLY_SUBSCRIPTION_AMOUNTS[0]);
        setCustomAmount('');
      }
      // Monthly donations cannot be anonymous
      setValue('isAnonymous', false);
    } else {
      // For one-time donations, keep current amount if valid
      if (currentAmount < 1) {
        setValue('amount', 25);
        setSelectedPresetAmount(25);
        setCustomAmount('');
      }
    }
  }, [donationType, currentAmount, setValue]);

  const handlePresetAmountClick = (
    amount: PresetDonationAmount | MonthlySubscriptionAmount
  ) => {
    setSelectedPresetAmount(amount);
    setCustomAmount('');
    setValue('amount', amount);
  };

  const handleCustomAmountChange = (value: string) => {
    // Only allow custom amounts for one-time donations
    if (donationType === 'monthly') return;

    setCustomAmount(value);
    setSelectedPresetAmount(null);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      setValue('amount', numericValue);
    }
  };

  const onFormSubmit = (data: DonationFormData) => {
    try {
      onSubmit(data);
    } catch (error) {
      console.error('Error submitting donation form:', error);
      toast.error('Failed to process donation. Please try again.');
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-8 border border-blue-100">
      {!showInBookingFlow && (
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-white"
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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Support Our Mission
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
            Your generosity helps us continue providing quality physiotherapy
            services and educational resources to our community. Every
            contribution makes a difference! 💙
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
        {/* Donation Type Selection */}
        <div className="space-y-4">
          <label className="block text-lg font-semibold text-gray-800 mb-4">
            Choose Your Support Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                donationType === 'one_time'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <input
                type="radio"
                {...register('donationType')}
                value="one_time"
                className="sr-only"
              />
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    donationType === 'one_time'
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {donationType === 'one_time' && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    One-time Donation
                  </div>
                  <div className="text-sm text-gray-600">
                    Make a single contribution
                  </div>
                </div>
              </div>
            </label>

            <label
              className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                donationType === 'monthly'
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
              }`}
            >
              <input
                type="radio"
                {...register('donationType')}
                value="monthly"
                className="sr-only"
              />
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    donationType === 'monthly'
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300'
                  }`}
                >
                  {donationType === 'monthly' && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 flex items-center">
                    Monthly Support
                    <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      Popular
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Ongoing monthly contributions
                  </div>
                </div>
              </div>
            </label>
          </div>
          {errors.donationType && (
            <p className="text-sm text-red-600">
              {errors.donationType.message}
            </p>
          )}
        </div>

        {/* Amount Selection */}
        <div className="space-y-4">
          <label className="block text-lg font-semibold text-gray-800">
            {donationType === 'monthly' ? 'Monthly Amount' : 'Donation Amount'}
          </label>

          {/* Preset Amounts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(donationType === 'monthly'
              ? MONTHLY_SUBSCRIPTION_AMOUNTS
              : DONATION_AMOUNTS
            ).map(amount => (
              <button
                key={amount}
                type="button"
                onClick={() => handlePresetAmountClick(amount)}
                className={`relative px-4 py-3 rounded-xl border-2 text-center font-semibold transition-all transform hover:scale-105 ${
                  selectedPresetAmount === amount
                    ? donationType === 'monthly'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500 shadow-lg'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-500 shadow-lg'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <div className="text-lg">${amount}</div>
                {donationType === 'monthly' && (
                  <div className="text-xs opacity-90">/month</div>
                )}
              </button>
            ))}
          </div>

          {/* Custom Amount - Only for one-time donations */}
          {donationType === 'one_time' && (
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or enter a custom amount
              </label>
              <div className="flex items-center space-x-3">
                <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-300">
                  <span className="text-gray-600 font-medium">$</span>
                </div>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={e => handleCustomAmountChange(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  min="1"
                  max="10000"
                  step="0.01"
                />
                <select
                  {...register('currency')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {SUPPORTED_CURRENCIES.map(currency => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Monthly subscription info */}
          {donationType === 'monthly' && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-purple-600 mr-2 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-purple-800">
                  <p className="font-medium mb-1">Monthly Subscription:</p>
                  <p className="text-purple-700">
                    Choose from our preset monthly amounts. This amount will be
                    charged monthly and you can cancel anytime.
                  </p>
                </div>
              </div>
            </div>
          )}
          {errors.amount && (
            <p className="text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        {/* Anonymous Donation Toggle */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label
            className={`flex items-center ${donationType === 'monthly' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <input
              type="checkbox"
              {...register('isAnonymous')}
              disabled={donationType === 'monthly'}
              className={`w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 ${
                donationType === 'monthly'
                  ? 'cursor-not-allowed opacity-50'
                  : ''
              }`}
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">
                Make this donation anonymous
              </div>
              <div className="text-xs text-gray-500">
                {donationType === 'monthly'
                  ? 'Monthly donations require contact information for subscription management'
                  : "Your name won't be displayed publicly"}
              </div>
            </div>
          </label>
          {errors.isAnonymous && (
            <p className="mt-2 text-sm text-red-600">
              {errors.isAnonymous.message}
            </p>
          )}
        </div>

        {/* Donor Information */}
        {(!isAnonymous || donationType === 'monthly') && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Your Information
              </h3>
              {donationType === 'monthly' && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  Required for subscription management
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                {...register('donorName')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="Enter your full name"
              />
              {errors.donorName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.donorName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
                {donationType === 'monthly' && (
                  <span className="text-xs text-purple-600 ml-1">
                    (needed for cancellation link)
                  </span>
                )}
              </label>
              <input
                type="email"
                {...register('donorEmail')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="Enter your email address"
              />
              {errors.donorEmail && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.donorEmail.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Optional Message */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message of Support (Optional)
          </label>
          <textarea
            {...register('message')}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Share why you're supporting our mission... (optional)"
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600">
              {errors.message.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
            isLoading
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : donationType === 'monthly'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-6 w-6 text-gray-700"
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
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              {donationType === 'monthly' ? (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
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
                  Start Monthly Support - ${currentAmount.toFixed(2)}/month
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
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
                  Donate ${currentAmount.toFixed(2)} Now
                </>
              )}
            </span>
          )}
        </button>

        {/* Monthly Donation Info */}
        {donationType === 'monthly' && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-purple-600 mr-2 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-purple-800">
                <p className="font-medium mb-1">Monthly Donation Benefits:</p>
                <ul className="list-disc list-inside space-y-1 text-purple-700">
                  <li>Provides consistent support for our programs</li>
                  <li>Easy to manage - cancel or modify anytime</li>
                  <li>Receive monthly impact updates</li>
                  <li>Join our exclusive monthly supporters community</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Security Notice */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center">
          <svg
            className="h-6 w-6 text-green-600 mr-3"
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
          <div>
            <p className="text-sm font-medium text-green-800">
              Secure & Trusted
            </p>
            <p className="text-xs text-green-700">
              Your payment is secured by Stripe with bank-level encryption. We
              never store your card information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
