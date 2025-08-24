# Simplified Subscription Donations

## Overview

A streamlined approach to handle recurring monthly donations using Stripe subscriptions with minimal complexity.

## How It Works

### 1. Subscription Creation
- Creates/reuses Stripe customer
- Uses a single "Monthly Donation" product
- Reuses existing prices when possible to avoid Stripe limits
- Creates initial donation record with `payment_status: 'pending'`

### 2. Payment Processing
- **First Payment**: Webhook updates the initial donation record to `completed`
- **Recurring Payments**: Webhook creates new donation records for each monthly payment

### 3. Database Records
- Each monthly payment creates a separate donation record
- All records linked via `stripe_subscription_id`
- Clear audit trail of all payments

## Usage

### Frontend Integration
```typescript
// For recurring donations
const subscription = await donationService.createSubscription({
  donorName: 'Jane Smith',
  donorEmail: 'jane@example.com',
  amount: 25, // In dollars
  currency: 'USD',
  message: 'Monthly support',
  isAnonymous: false,
  donationType: 'recurring'
});

// Use subscription.clientSecret with Stripe Elements
```

### Key Benefits
- **Simple**: No complex product/price management
- **Scalable**: Reuses prices to avoid Stripe limits
- **Trackable**: Each payment creates a donation record
- **Reliable**: Webhook handles all payment updates

## Webhook Events

Configure these events in Stripe:
- `invoice.payment_succeeded` - Updates payment status
- `customer.subscription.deleted` - Marks subscription as cancelled
- `invoice.payment_failed` - Logs failed payments

## Database Schema

```sql
-- Donations table includes:
donation_type: 'one_time' | 'recurring'
stripe_subscription_id: VARCHAR(255) -- Links recurring donations
payment_status: 'pending' | 'completed' | 'failed' | 'cancelled'
```

## Error Prevention

- **Price Reuse**: Checks existing prices before creating new ones
- **Customer Deduplication**: Reuses existing customers by email
- **Proper Status Tracking**: Webhook updates ensure accurate payment status