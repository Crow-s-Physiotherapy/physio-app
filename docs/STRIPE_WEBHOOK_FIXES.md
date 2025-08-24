# Donation System Fixes

## Issues Fixed

### 1. Stripe Webhook Removed

**Problem**: The stripe-webhook edge function was causing issues because EmailJS cannot be called from backend functions.

**Solution**: 
- Completely removed the stripe-webhook edge function
- Reverted to sending all emails from the frontend (both one-time and monthly donations)
- Updated email template with subscription management instructions

**Files Modified**:
- `supabase/functions/stripe-webhook/` (deleted)
- `src/pages/Donations.tsx`
- `docs/EMAILJS_DONATION_TEMPLATE.md`

### 2. Customer Name Issue in Stripe Dashboard

**Problem**: All subscription customers appeared as "Anonymous Donor" in Stripe dashboard even when donor provided their name.

**Solution**:
- Fixed the create-subscription function to properly parse metadata from the request
- Updated customer creation/retrieval logic to use the donor name
- Added customer name updating for existing customers
- Enhanced webhook to extract customer name from both metadata and customer object

**Files Modified**:
- `supabase/functions/create-subscription/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

### 3. Email Sending Restored

**Problem**: After removing the webhook, we needed to ensure all donations (one-time and monthly) send confirmation emails.

**Solution**:
- Reverted frontend to send emails for all donation types
- Updated success message to always show "email has been sent"
- Removed webhook-related email logic

**Files Modified**:
- `src/pages/Donations.tsx`

### 4. Email Template with Subscription Management Link

**Problem**: Users needed a way to manage their monthly subscriptions, and the email should redirect to our own page.

**Solution**:
- Updated email template to include a "Manage Monthly Donation" button
- The button links to our frontend `/manage-subscription` page with the subscription ID
- The frontend page then redirects to the existing Supabase unsubscribe function
- Provides a seamless user experience through our own domain

**Files Modified**:
- `docs/EMAILJS_DONATION_TEMPLATE.md`
- `src/services/emailService.ts`
- `src/pages/ManageSubscription.tsx`

### 5. Missing Subscription Management Page

**Problem**: The unsubscribe link didn't have a proper frontend page for users to manage their subscriptions.

**Solution**:
- Created a new `ManageSubscription` component that redirects to the Supabase function
- Added the route to the main App router
- The existing unsubscribe-donation function provides a complete web interface

**Files Modified**:
- `src/pages/ManageSubscription.tsx` (new)
- `src/App.tsx`

## Environment Variables Required

Make sure these environment variables are set in your project:

```bash
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key (for backend functions)
VITE_EMAILJS_SERVICE_ID=service_... # Your EmailJS service ID
VITE_EMAILJS_TEMPLATE_ID_DONATION=template_... # Your EmailJS template ID
VITE_EMAILJS_PUBLIC_KEY=... # Your EmailJS public key
```

Note: Webhook secret is no longer needed since we removed the webhook function.

## Testing the Fixes

### 1. Test Customer Names
- Create a monthly subscription with a donor name
- Check Stripe dashboard to verify the customer name appears correctly
- Verify the customer name appears in the confirmation email

### 2. Test Email Sending
- Create a one-time donation → should receive immediate email
- Create a monthly subscription → should receive immediate email with management instructions

### 3. Test Subscription Management
- Create a monthly subscription
- Follow the Stripe customer portal link from the email
- Verify users can manage their subscriptions through Stripe's interface

## Email-Based Subscription Management

Since we removed the webhook, subscription management is now handled through:

- **Frontend Redirect**: Users click "Manage Monthly Donation" in their email, which takes them to `/manage-subscription?subscription_id=xxx`
- **Seamless Experience**: The frontend page immediately redirects to the Supabase unsubscribe function
- **Existing Interface**: Users see the existing unsubscribe-donation function's web interface for cancellation
- **Direct Contact**: Users can also contact the clinic directly for assistance

## Next Steps

1. **Deploy the changes** to your Supabase project
2. **Remove webhook secret** environment variable (no longer needed)
3. **Test the complete flow** from donation to email confirmation
4. **Verify Stripe customer portal** is properly configured for your account

## Security Notes

- All email sending is handled through EmailJS from the frontend
- Customer data is properly handled according to Stripe's security guidelines
- Subscription management is delegated to Stripe's secure customer portal
- No sensitive webhook processing is required