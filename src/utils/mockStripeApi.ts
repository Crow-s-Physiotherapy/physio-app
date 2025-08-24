// Mock Stripe API for development
// In production, this would be replaced with actual backend API calls

export interface MockPaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export class MockStripeApi {
  private static instance: MockStripeApi;

  private constructor() {}

  public static getInstance(): MockStripeApi {
    if (!MockStripeApi.instance) {
      MockStripeApi.instance = new MockStripeApi();
    }
    return MockStripeApi.instance;
  }

  /**
   * Mock create payment intent endpoint
   */
  async createPaymentIntent(data: {
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
  }): Promise<MockPaymentIntent> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock payment intent
    const paymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: paymentIntentId,
      amount: data.amount,
      currency: data.currency,
      status: 'requires_payment_method',
      clientSecret: `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 16)}`,
    };
  }

  /**
   * Mock retrieve payment intent endpoint
   */
  async retrievePaymentIntent(
    paymentIntentId: string
  ): Promise<MockPaymentIntent> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      id: paymentIntentId,
      amount: 2500, // $25.00 in cents
      currency: 'usd',
      status: 'succeeded',
      clientSecret: `${paymentIntentId}_secret_retrieved`,
    };
  }
}

export const mockStripeApi = MockStripeApi.getInstance();

// Global fetch override for development
if (import.meta.env.DEV) {
  const originalFetch = window.fetch;

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();

    // Intercept payment intent creation
    if (url.includes('/api/create-payment-intent') && init?.method === 'POST') {
      try {
        const body = init.body ? JSON.parse(init.body as string) : {};
        const paymentIntent = await mockStripeApi.createPaymentIntent(body);

        return new Response(JSON.stringify(paymentIntent), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to create payment intent' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Intercept payment intent retrieval
    if (url.includes('/api/payment-intent/') && init?.method === 'GET') {
      try {
        const paymentIntentId = url.split('/').pop() || '';
        const paymentIntent =
          await mockStripeApi.retrievePaymentIntent(paymentIntentId);

        return new Response(JSON.stringify(paymentIntent), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Payment intent not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Fall back to original fetch for all other requests
    return originalFetch(input, init);
  };
}
