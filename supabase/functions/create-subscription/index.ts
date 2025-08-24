import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse request body
    const { amount, currency, metadata } = await req.json();
    const customerEmail = metadata?.donorEmail;
    const donorName = metadata?.donorName;
    const message = metadata?.message;
    const isAnonymous = metadata?.isAnonymous === 'true';

    // Validate required fields
    if (!amount || !currency) {
      return new Response(
        JSON.stringify({ error: 'Amount and currency are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Define allowed monthly amounts and their Stripe product IDs
    const MONTHLY_SUBSCRIPTION_PRODUCTS: Record<number, string> = {
      3: 'prod_SvVUqRDGIXm5TP',
      5: 'prod_SvVX8jxkLBb1Ad',
    };

    // Validate amount is one of the allowed monthly amounts
    const amountInDollars = Math.round(amount / 100);
    if (!MONTHLY_SUBSCRIPTION_PRODUCTS[amountInDollars]) {
      return new Response(
        JSON.stringify({
          error: `Invalid subscription amount. Allowed amounts are: $${Object.keys(MONTHLY_SUBSCRIPTION_PRODUCTS).join(', $')}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create or retrieve customer
    let customer;
    if (customerEmail) {
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        // Update customer name if it's different
        if (donorName && customer.name !== donorName) {
          customer = await stripe.customers.update(customer.id, {
            name: donorName,
          });
        }
      } else {
        customer = await stripe.customers.create({
          email: customerEmail,
          name: donorName || 'Anonymous Donor',
          metadata: {
            source: 'physiotherapy_donations',
          },
        });
      }
    } else {
      customer = await stripe.customers.create({
        name: donorName || 'Anonymous Donor',
        metadata: {
          source: 'physiotherapy_donations',
          anonymous: 'true',
        },
      });
    }

    // Get the predefined product ID for this amount
    const productId = MONTHLY_SUBSCRIPTION_PRODUCTS[amountInDollars];

    // Get the product from Stripe
    const product = await stripe.products.retrieve(productId);

    // Get the price for this product (should already exist)
    const prices = await stripe.prices.list({
      product: productId,
      currency: currency.toLowerCase(),
      limit: 1,
    });

    if (prices.data.length === 0) {
      return new Response(
        JSON.stringify({
          error: `No price found for product ${productId}. Please contact support.`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const price = prices.data[0];

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        donorName: donorName || '',
        donorEmail: customerEmail || '',
        message: message || '',
        isAnonymous: isAnonymous ? 'true' : 'false',
      },
    });

    const paymentIntent = subscription.latest_invoice?.payment_intent;

    // Note: We no longer save donation records to the database
    // All transaction data is managed through Stripe Dashboard

    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
        customerId: customer.id,
        status: subscription.status,
        amount: price.unit_amount,
        currency: price.currency,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating subscription:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create subscription';
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
