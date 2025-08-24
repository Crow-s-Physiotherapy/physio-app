# Subscription ID Fix for Email Unsubscribe URLs

## Problem

The `unsubscribe_url` in donation confirmation emails was empty because the subscription ID was not being properly passed through the payment flow.

## Root Cause Analysis

1. **create-subscription function** returns `subscriptionId` in the response
2. **stripeService.createPaymentIntent()** was not capturing the `subscriptionId` from the subscription response
3. **stripeService.processDonation()** was not passing the subscription ID to the donation object
4. **PaymentProcessor** was not preserving the subscription ID from the initial response
5. **emailService** was receiving empty `stripeSubscriptionId`, resulting in empty `unsubscribe_url`

## Solution

### 1. Updated stripeService.createPaymentIntent()
- Added logic to handle different response structures for subscriptions vs one-time payments
- For subscriptions, map `subscriptionId` to both `id` and `subscriptionId` fields
- Preserve the subscription response structure

### 2. Updated stripeService.processDonation()
- Extract `subscriptionId` from payment response for monthly donations
- Pass `stripeSubscriptionId` to the donation object
- Added debugging logs to track the flow

### 3. Updated PaymentProcessor
- Store the full donation response from initialization
- Pass the donation response to PaymentForm
- Preserve subscription ID through the payment confirmation flow

### 4. Updated emailService
- Added debugging logs to track subscription ID
- Verify unsubscribe URL generation

### 5. Updated type definitions
- Added `subscriptionId?` field to `StripePaymentIntent` interface

## Files Modified

- `src/services/stripeService.ts`
- `src/components/donations/PaymentProcessor.tsx`
- `src/services/emailService.ts`
- `src/types/donation.ts`

## Additional Fix: Authentication for Edge Function Access

### Problem
The ManageSubscription page was getting a 401 "Missing authorization header" error when trying to access the unsubscribe-donation edge function.

### Solution
Updated ManageSubscription component to:
- Make an authenticated fetch request with `Authorization: Bearer ${supabaseAnonKey}` header
- Replace the page content with the HTML response from the edge function
- Maintain the URL structure for better UX

### Files Modified
- `src/pages/ManageSubscription.tsx`

## Testing

After these changes, the flow should be:

1. User creates monthly donation
2. `create-subscription` returns `subscriptionId`
3. `stripeService` captures and passes subscription ID
4. `PaymentProcessor` preserves subscription ID through payment
5. `emailService` receives subscription ID and generates proper unsubscribe URL
6. Email contains working "Manage Monthly Donation" link
7. User clicks link → goes to `/manage-subscription?subscription_id=xxx`
8. Page makes authenticated request to unsubscribe-donation function
9. User sees the cancellation interface

## Expected Email Payload

```json
{
  "template_params": {
    "unsubscribe_url": "http://localhost:5173/manage-subscription?subscription_id=sub_xxxxx",
    "subscription_id": "sub_xxxxx",
    "donation_type_monthly": true,
    // ... other fields
  }
}
```

## Debugging

Added console.log statements to track:
- Payment response in stripeService
- Subscription ID extraction
- Email service inputs
- Unsubscribe URL generation

Remove these logs after confirming the fix works.