// Donation-related type definitions

export interface Donation {
  id: string;
  donorName?: string;
  donorEmail?: string;
  amount: number;
  currency: string;
  message?: string;
  isAnonymous: boolean;
  donationType: 'one_time' | 'monthly';
  stripePaymentIntentId?: string;
  stripeSubscriptionId?: string;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Form data types for donations
export interface DonationFormData {
  donorName?: string;
  donorEmail?: string;
  amount: number;
  currency: string;
  message?: string;
  isAnonymous: boolean;
  donationType: 'one_time' | 'monthly';
}

export interface PaymentFormData extends DonationFormData {
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
}

// API response types
export interface DonationResponse {
  donation: Donation;
  clientSecret?: string; // For Stripe payment confirmation
  success: boolean;
  message?: string;
}

export interface DonationsListResponse {
  donations: Donation[];
  total: number;
  totalAmount: number;
  page: number;
  limit: number;
}

export interface DonationStatsResponse {
  totalDonations: number;
  totalAmount: number;
  averageAmount: number;
  donorCount: number;
  monthlyStats: MonthlyDonationStats[];
}

// Utility types
export type PaymentStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface MonthlyDonationStats {
  month: string;
  year: number;
  totalAmount: number;
  donationCount: number;
}

export interface DonationFilters {
  paymentStatus?: PaymentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  currency?: string;
  isAnonymous?: boolean;
}

// Stripe-related types
export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
  subscriptionId?: string; // For monthly subscriptions
}

export interface StripeSubscriptionResponse {
  subscriptionId: string;
  clientSecret: string;
  customerId: string;
  status: string;
  amount: number;
  currency: string;
}

export interface PaymentMethodData {
  type: 'card';
  card: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  };
  billing_details?: {
    name?: string;
    email?: string;
    address?: {
      line1?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
}

// Predefined donation amounts
export const DONATION_AMOUNTS = [5, 10, 25, 50, 100, 250, 500] as const;
export type PresetDonationAmount = (typeof DONATION_AMOUNTS)[number];

// Monthly subscription amounts with Stripe product IDs
// export const MONTHLY_SUBSCRIPTION_AMOUNTS = [5, 10, 25, 50, 100] as const;
export const MONTHLY_SUBSCRIPTION_AMOUNTS = [3, 5] as const;
export type MonthlySubscriptionAmount =
  (typeof MONTHLY_SUBSCRIPTION_AMOUNTS)[number];

// Function to get Stripe product IDs from environment variables
const getStripeProductIds = (): Record<MonthlySubscriptionAmount, string> => {
  return {
    3: import.meta.env['VITE_STRIPE_PRODUCT_ID_3'],
    5: import.meta.env['VITE_STRIPE_PRODUCT_ID_5'],
    // 25: import.meta.env['VITE_STRIPE_PRODUCT_ID_25'] || 'prod_SsQU8OUL9XWtmZ',
    // 50: import.meta.env['VITE_STRIPE_PRODUCT_ID_50'] || 'prod_SsQUkinXtIUKID',
    // 100: import.meta.env['VITE_STRIPE_PRODUCT_ID_100'] || 'prod_SsQU2MysCPlLmR',
  };
};

export const STRIPE_PRODUCT_IDS: Record<MonthlySubscriptionAmount, string> =
  getStripeProductIds();

// Debug: Log product IDs in development
if (import.meta.env.DEV) {
  console.log('Stripe Product IDs loaded:', STRIPE_PRODUCT_IDS);
}

// Utility function to validate Stripe product IDs configuration
export const validateStripeProductIds = (): {
  isValid: boolean;
  missingIds: MonthlySubscriptionAmount[];
} => {
  const missingIds: MonthlySubscriptionAmount[] = [];

  MONTHLY_SUBSCRIPTION_AMOUNTS.forEach(amount => {
    const productId = STRIPE_PRODUCT_IDS[amount];
    if (!productId || !productId.startsWith('prod_')) {
      missingIds.push(amount);
    }
  });

  return {
    isValid: missingIds.length === 0,
    missingIds,
  };
};

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// Campaign and progress types
export interface DonationCampaign {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  currency: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignProgress {
  campaignId: string;
  totalRaised: number;
  donorCount: number;
  percentageComplete: number;
  daysRemaining?: number;
  recentDonations: Donation[];
}
