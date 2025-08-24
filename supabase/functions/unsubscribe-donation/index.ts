import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const subscriptionId = url.searchParams.get('subscription_id');
    const token = url.searchParams.get('token');

    if (!subscriptionId) {
      return new Response(
        generateErrorPage(
          'Missing subscription ID',
          'The unsubscribe link appears to be invalid.'
        ),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe configuration missing');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify the subscription exists in Stripe
    let subscription: Stripe.Subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(subscriptionId);

      if (subscription.status === 'canceled') {
        return new Response(
          generateErrorPage(
            'Already cancelled',
            'This subscription has already been cancelled.'
          ),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          }
        );
      }
    } catch (stripeError) {
      console.error('Subscription not found in Stripe:', stripeError);
      return new Response(
        generateErrorPage(
          'Subscription not found',
          'We could not find this subscription in our records.'
        ),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    // Handle GET request - show confirmation page
    if (req.method === 'GET') {
      return new Response(generateConfirmationPage(subscription), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Handle POST request - actually cancel the subscription
    if (req.method === 'POST') {
      try {
        // Cancel the subscription in Stripe
        const canceledSubscription =
          await stripe.subscriptions.cancel(subscriptionId);

        if (canceledSubscription.status === 'canceled') {
          console.log('Subscription cancelled successfully:', subscriptionId);

          // Return success page
          return new Response(generateSuccessPage(subscription), {
            headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          });
        } else {
          throw new Error('Failed to cancel subscription');
        }
      } catch (stripeError) {
        console.error('Stripe cancellation error:', stripeError);
        return new Response(
          generateErrorPage(
            'Cancellation failed',
            'We encountered an error while canceling your subscription. Please contact support.'
          ),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          }
        );
      }
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response(
      generateErrorPage(
        'System error',
        'An unexpected error occurred. Please try again later or contact support.'
      ),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      }
    );
  }
});

function generateConfirmationPage(subscription: Stripe.Subscription): string {
  const donorName = subscription.metadata?.donorName || 'Anonymous';
  const donorEmail = subscription.metadata?.donorEmail || '';
  const message = subscription.metadata?.message || '';
  const amount = subscription.items.data[0]?.price?.unit_amount
    ? subscription.items.data[0].price.unit_amount / 100
    : 0;
  const currency =
    subscription.items.data[0]?.price?.currency?.toUpperCase() || 'USD';
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cancel Monthly Donation - Juan Crow Larrea Physiotherapy</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .donation-info {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .buttons {
            text-align: center;
            margin: 30px 0;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 0 10px;
            border: none;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-danger {
            background: #dc2626;
            color: white;
        }
        .btn-danger:hover {
            background: #b91c1c;
        }
        .btn-secondary {
            background: #6b7280;
            color: white;
        }
        .btn-secondary:hover {
            background: #4b5563;
        }
        .contact-info {
            background: #ecfdf5;
            border: 1px solid #10b981;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Juan Crow Larrea - Physiotherapy</div>
            <h1>Cancel Monthly Donation</h1>
        </div>

        <div class="donation-info">
            <h3>Current Monthly Donation</h3>
            <p><strong>Donor:</strong> ${donorName}</p>
            <p><strong>Amount:</strong> ${currency} $${amount.toFixed(2)} per month</p>
            <p><strong>Started:</strong> ${new Date(subscription.created * 1000).toLocaleDateString()}</p>
            ${message ? `<p><strong>Message:</strong> "${message}"</p>` : ''}
        </div>

        <div class="warning">
            <h3>⚠️ Are you sure you want to cancel?</h3>
            <p>Canceling your monthly donation will:</p>
            <ul>
                <li>Stop all future monthly charges immediately</li>
                <li>End your ongoing support for our physiotherapy services</li>
                <li>Remove you from our monthly supporters community</li>
            </ul>
            <p><strong>This action cannot be undone.</strong> If you change your mind later, you'll need to set up a new monthly donation.</p>
        </div>

        <div class="buttons">
            <form method="POST" style="display: inline;">
                <button type="submit" class="btn btn-danger">
                    Yes, Cancel My Monthly Donation
                </button>
            </form>
            <a href="https://physioconnect.com/donations" class="btn btn-secondary">
                Keep My Donation Active
            </a>
        </div>

        <div class="contact-info">
            <h3>Need Help?</h3>
            <p>If you're having issues with your donation or have questions, please contact us:</p>
            <p><strong>Email:</strong> matasanosphysio@gmail.com</p>
            <p><strong>Phone:</strong> (+61) 416 214 955</p>
        </div>

        <div style="text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280;">
            <p>Thank you for your past support. Your contributions have made a real difference in our community.</p>
        </div>
    </div>
</body>
</html>
  `;
}

function generateSuccessPage(subscription: Stripe.Subscription): string {
  const donorName = subscription.metadata?.donorName || 'Anonymous';
  const amount = subscription.items.data[0]?.price?.unit_amount
    ? subscription.items.data[0].price.unit_amount / 100
    : 0;
  const currency =
    subscription.items.data[0]?.price?.currency?.toUpperCase() || 'USD';
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Donation Cancelled - Juan Crow Larrea Physiotherapy</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .success-icon {
            width: 64px;
            height: 64px;
            background: #10b981;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .donation-summary {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 10px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
        }
        .btn:hover {
            background: #1d4ed8;
        }
        .contact-info {
            background: #ecfdf5;
            border: 1px solid #10b981;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">
            <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
        </div>
        
        <div class="logo">Juan Crow Larrea - Physiotherapy</div>
        <h1>Monthly Donation Cancelled</h1>
        
        <p>Your monthly donation has been successfully cancelled. No future charges will be made to your payment method.</p>

        <div class="donation-summary">
            <h3>Cancelled Donation Details</h3>
            <p><strong>Donor:</strong> ${donorName}</p>
            <p><strong>Amount:</strong> ${currency} $${amount.toFixed(2)} per month</p>
            <p><strong>Cancelled on:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3>What happens next?</h3>
            <ul style="text-align: left; display: inline-block;">
                <li>Your subscription has been cancelled with Stripe</li>
                <li>No further charges will be made</li>
                <li>You'll receive a confirmation email shortly</li>
                <li>Any previous donations remain as tax-deductible receipts</li>
            </ul>
        </div>

        <div class="contact-info">
            <h3>Thank You for Your Past Support</h3>
            <p>We're grateful for the support you've provided to our physiotherapy practice. Your contributions have helped us serve our community better.</p>
            <p>If you'd like to make a one-time donation in the future, you can always visit our donations page.</p>
        </div>

        <div>
            <a href="https://physioconnect.com" class="btn">Return to Website</a>
            <a href="https://physioconnect.com/donations" class="btn" style="background: #059669;">Make One-Time Donation</a>
        </div>

        <div style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            <p>Questions? Contact us at matasanosphysio@gmail.com or (+61) 416 214 955</p>
        </div>
    </div>
</body>
</html>
  `;
}

function generateErrorPage(title: string, message: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - Juan Crow Larrea Physiotherapy</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .error-icon {
            width: 64px;
            height: 64px;
            background: #dc2626;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 10px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
        }
        .btn:hover {
            background: #1d4ed8;
        }
        .contact-info {
            background: #fef2f2;
            border: 1px solid #f87171;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">
            <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
        </div>
        
        <div class="logo">Juan Crow Larrea - Physiotherapy</div>
        <h1>${title}</h1>
        
        <p>${message}</p>

        <div class="contact-info">
            <h3>Need Assistance?</h3>
            <p>If you continue to experience issues, please contact our support team:</p>
            <p><strong>Email:</strong> matasanosphysio@gmail.com</p>
            <p><strong>Phone:</strong> (+61) 416 214 955</p>
        </div>

        <div>
            <a href="https://physioconnect.com" class="btn">Return to Website</a>
            <a href="https://physioconnect.com/contact" class="btn" style="background: #059669;">Contact Support</a>
        </div>
    </div>
</body>
</html>
  `;
}
