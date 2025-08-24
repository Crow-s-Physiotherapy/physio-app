# Stripe Product IDs Configuration Guide

## Overview

This guide explains how to configure Stripe product IDs for monthly subscription donations using environment variables.

## Environment Variables Setup

### 1. Add to .env file

Add the following variables to your `.env` file in the project root:

```bash
# Stripe Product IDs for Monthly Subscriptions
VITE_STRIPE_PRODUCT_ID_5=prod_SsQT1yYTx4eeh2
VITE_STRIPE_PRODUCT_ID_10=prod_SsQTWzBktIJmbs
VITE_STRIPE_PRODUCT_ID_25=prod_SsQU8OUL9XWtmZ
VITE_STRIPE_PRODUCT_ID_50=prod_SsQUkinXtIUKID
VITE_STRIPE_PRODUCT_ID_100=prod_SsQU2MysCPlLmR
```

### 2. Variable Naming Convention

- Format: `VITE_STRIPE_PRODUCT_ID_{AMOUNT}`
- Amount corresponds to monthly subscription amounts: 5, 10, 25, 50, 100
- All variables must start with `VITE_` to be accessible in the frontend

## How It Works

### 1. Dynamic Loading

The system dynamically loads product IDs from environment variables:

```typescript
const getStripeProductIds = (): Record<MonthlySubscriptionAmount, string> => {
  return {
    5: import.meta.env.VITE_STRIPE_PRODUCT_ID_5 || 'prod_SsQT1yYTx4eeh2',
    10: import.meta.env.VITE_STRIPE_PRODUCT_ID_10 || 'prod_SsQTWzBktIJmbs',
    25: import.meta.env.VITE_STRIPE_PRODUCT_ID_25 || 'prod_SsQU8OUL9XWtmZ',
    50: import.meta.env.VITE_STRIPE_PRODUCT_ID_50 || 'prod_SsQUkinXtIUKID',
    100: import.meta.env.VITE_STRIPE_PRODUCT_ID_100 || 'prod_SsQU2MysCPlLmR',
  };
};
```

### 2. Fallback Values

If environment variables are not set, the system falls back to default product IDs.

### 3. Validation

Use the validation function to check configuration:

```typescript
import { validateStripeProductIds } from '../types/donation';

const validation = validateStripeProductIds();
if (!validation.isValid) {
  console.error('Missing Stripe product IDs for amounts:', validation.missingIds);
}
```

## Getting Product IDs from Stripe

### 1. Access Stripe Dashboard

1. Log into your Stripe Dashboard
2. Navigate to **Products**
3. Select or create products for each subscription amount

### 2. Copy Product IDs

1. Click on a product
2. Copy the Product ID (starts with `prod_`)
3. Add to your `.env` file

### 3. Create Products (if needed)

For each monthly amount ($5, $10, $25, $50, $100):

1. Click **Add Product**
2. Set name: "Monthly Donation - $X"
3. Set pricing: Recurring, monthly, amount in cents
4. Save and copy the product ID

## Environment-Specific Configuration

### Development (.env)
```bash
VITE_STRIPE_PRODUCT_ID_5=prod_test_5_dollars
VITE_STRIPE_PRODUCT_ID_10=prod_test_10_dollars
# ... etc
```

### Production (.env.production)
```bash
VITE_STRIPE_PRODUCT_ID_5=prod_live_5_dollars
VITE_STRIPE_PRODUCT_ID_10=prod_live_10_dollars
# ... etc
```

## Troubleshooting

### Common Issues

#### "Product ID not found"
- Check that the environment variable is set correctly
- Verify the product ID exists in your Stripe account
- Ensure the variable name matches the expected format

#### "Invalid product ID format"
- Product IDs should start with `prod_`
- Check for typos in the environment variable value

#### "Environment variable not loading"
- Ensure variable names start with `VITE_`
- Restart your development server after adding variables
- Check that the `.env` file is in the project root

### Validation Commands

```typescript
// In your component or service
import { validateStripeProductIds, STRIPE_PRODUCT_IDS } from '../types/donation';

// Check configuration
const validation = validateStripeProductIds();
console.log('Configuration valid:', validation.isValid);
console.log('Missing IDs:', validation.missingIds);

// View current product IDs
console.log('Current product IDs:', STRIPE_PRODUCT_IDS);
```

## Security Notes

1. **Frontend Variables**: These are exposed to the client-side code
2. **Product IDs are Safe**: Product IDs are not sensitive and can be public
3. **Secret Keys**: Never put secret keys in frontend environment variables
4. **Version Control**: You can safely commit product IDs to version control

## Testing

### 1. Verify Configuration

```bash
# Check that variables are loaded
npm run dev
# Open browser console and check:
# console.log(import.meta.env.VITE_STRIPE_PRODUCT_ID_5)
```

### 2. Test Subscription Creation

1. Create a test monthly donation
2. Verify the correct product ID is used in Stripe
3. Check that the subscription is created successfully

### 3. Validate All Amounts

Test each monthly subscription amount (5, 10, 25, 50, 100) to ensure all product IDs work correctly.