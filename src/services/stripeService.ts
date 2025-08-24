import { loadStripe, type Stripe } from '@stripe/stripe-js';
import type {
  DonationFormData,
  DonationResponse,
  StripePaymentIntent,
} from '../types/donation';

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env['VITE_STRIPE_PUBLISHABLE_KEY'];
    if (!publishableKey) {
      throw new Error('Stripe publishable key is not configured');
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export class StripeService {
  private static instance: StripeService;
  private stripe: Promise<Stripe | null>;

  private constructor() {
    this.stripe = getStripe();
  }

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  /**
   * Create a payment intent for one-time donation or subscription for monthly donation
   */
  async createPaymentIntent(
    donationData: DonationFormData
  ): Promise<StripePaymentIntent> {
    try {
      const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'];
      const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'];

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing');
      }

      const endpoint =
        donationData.donationType === 'monthly'
          ? `${supabaseUrl}/functions/v1/create-subscription`
          : `${supabaseUrl}/functions/v1/create-payment-intent`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          amount: Math.round(donationData.amount * 100), // Convert to cents
          currency: donationData.currency.toLowerCase(),
          donationType: donationData.donationType,
          metadata: {
            donorName: donationData.donorName || 'Anonymous',
            donorEmail: donationData.donorEmail || '',
            message: donationData.message || '',
            isAnonymous: donationData.isAnonymous.toString(),
            donationType: donationData.donationType,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to create ${donationData.donationType === 'monthly' ? 'subscription' : 'payment intent'}`
        );
      }

      const paymentData = await response.json();

      // For subscriptions, the response structure is different
      if (donationData.donationType === 'monthly') {
        return {
          id: paymentData.subscriptionId, // Use subscriptionId as the main ID
          subscriptionId: paymentData.subscriptionId,
          clientSecret: paymentData.clientSecret,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: paymentData.status,
        };
      }

      // For one-time payments, return as-is
      return paymentData;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to initialize payment. Please try again.';
      throw new Error(errorMessage);
    }
  }

  /**
   * Confirm payment with Stripe
   */
  async confirmPayment(
    clientSecret: string,
    paymentMethodId: string,
    donationData: DonationFormData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const stripe = await this.stripe;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: paymentMethodId,
          receipt_email: donationData.donorEmail || '',
        }
      );

      if (error) {
        return {
          success: false,
          error: error.message || 'Payment failed',
        };
      }

      if (paymentIntent?.status === 'succeeded') {
        return { success: true };
      }

      return {
        success: false,
        error: 'Payment was not completed successfully',
      };
    } catch (error) {
      console.error('Error confirming payment:', error);
      const errorMessage = 'Payment processing failed. Please try again.';
      // Note: Toast notification should be handled by the calling component
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Process donation payment
   */
  async processDonation(
    donationData: DonationFormData
  ): Promise<DonationResponse> {
    try {
      // Create payment intent or subscription
      const paymentResponse = await this.createPaymentIntent(donationData);

      // For subscriptions, the response includes subscriptionId
      const stripeSubscriptionId =
        donationData.donationType === 'monthly'
          ? paymentResponse.subscriptionId
          : undefined;

      return {
        donation: {
          id: `donation_${Date.now()}`,
          donorName: donationData.donorName || '',
          donorEmail: donationData.donorEmail || '',
          amount: donationData.amount,
          currency: donationData.currency,
          message: donationData.message || '',
          isAnonymous: donationData.isAnonymous,
          donationType: donationData.donationType,
          stripePaymentIntentId: paymentResponse.id,
          stripeSubscriptionId: stripeSubscriptionId || '',
          paymentStatus: 'pending' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        clientSecret: paymentResponse.clientSecret,
        success: true,
      };
    } catch (error) {
      console.error('Error processing donation:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Donation processing failed';
      // Note: Toast notification should be handled by the calling component
      return {
        donation: {} as any,
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Get Stripe instance
   */
  getStripeInstance(): Promise<Stripe | null> {
    return this.stripe;
  }
}

export const stripeService = StripeService.getInstance();
