# Environment Variables Setup Guide

## Overview

This guide covers the environment variables required for the donation email system to work properly.

## Environment Variables by Location

### Frontend Environment Variables (.env file)

These variables are used by the React frontend and should be set in your `.env` file in the project root.

#### Stripe Product IDs (Frontend - .env file)
```bash
VITE_STRIPE_PRODUCT_ID_5=prod_SsQT1yYTx4eeh2
VITE_STRIPE_PRODUCT_ID_10=prod_SsQTWzBktIJmbs
VITE_STRIPE_PRODUCT_ID_25=prod_SsQU8OUL9XWtmZ
VITE_STRIPE_PRODUCT_ID_50=prod_SsQUkinXtIUKID
VITE_STRIPE_PRODUCT_ID_100=prod_SsQU2MysCPlLmR
```

## Supabase Edge Functions Environment Variables

These variables need to be set in your Supabase project dashboard under **Settings > Edge Functions > Environment Variables**.

### Required Variables

#### Stripe Configuration
```bash
STRIPE_SECRET_KEY=sk_test_51QcCtHA00Im61pfwWcCIqA7YBYsP7F1eMjRpeaVRtRzEy8mqxX7XpF9FGPqeAHcZGbQHHqcOlvvs3oX1VaaTd6GD004Cs2hae4
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

#### EmailJS Configuration
```bash
EMAILJS_SERVICE_ID=service_ex845yc
EMAILJS_TEMPLATE_ID_DONATION=template_6whb2xs
EMAILJS_PUBLIC_KEY=Hik0alZwgbsXhpGVg
```

#### Supabase Configuration (Usually Auto-Set)
```bash
SUPABASE_URL=https://swtqgdyyzficdfjpabpl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## How to Set Environment Variables

### Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Scroll down to **Environment Variables**
4. Click **Add Variable** for each required variable
5. Enter the variable name and value
6. Click **Save**

### Via Supabase CLI

```bash
# Set individual variables
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set EMAILJS_SERVICE_ID=service_ex845yc
supabase secrets set EMAILJS_TEMPLATE_ID_DONATION=template_6whb2xs
supabase secrets set EMAILJS_PUBLIC_KEY=Hik0alZwgbsXhpGVg

# Or set multiple at once from a file
supabase secrets set --env-file .env.production
```

## Variable Descriptions

### STRIPE_SECRET_KEY
- **Purpose**: Authenticates with Stripe API
- **Format**: `sk_test_...` (test) or `sk_live_...` (production)
- **Where to find**: Stripe Dashboard → Developers → API Keys

### STRIPE_WEBHOOK_SECRET
- **Purpose**: Verifies webhook signatures from Stripe
- **Format**: `whsec_...`
- **Where to find**: Stripe Dashboard → Developers → Webhooks → Select your webhook → Signing secret

### EMAILJS_SERVICE_ID
- **Purpose**: Identifies your EmailJS service
- **Value**: `service_ex845yc`
- **Where to find**: EmailJS Dashboard → Email Services

### EMAILJS_TEMPLATE_ID_DONATION
- **Purpose**: Identifies the donation confirmation email template
- **Value**: `template_6whb2xs`
- **Where to find**: EmailJS Dashboard → Email Templates

### EMAILJS_PUBLIC_KEY
- **Purpose**: Authenticates with EmailJS API
- **Value**: `Hik0alZwgbsXhpGVg`
- **Where to find**: EmailJS Dashboard → Account → General

### VITE_STRIPE_PRODUCT_ID_* (Frontend Variables)
- **Purpose**: Maps monthly subscription amounts to Stripe product IDs
- **Format**: `prod_...`
- **Where to find**: Stripe Dashboard → Products → Select product → Copy product ID
- **Variables**:
  - `VITE_STRIPE_PRODUCT_ID_5` - Product ID for $5/month subscription
  - `VITE_STRIPE_PRODUCT_ID_10` - Product ID for $10/month subscription  
  - `VITE_STRIPE_PRODUCT_ID_25` - Product ID for $25/month subscription
  - `VITE_STRIPE_PRODUCT_ID_50` - Product ID for $50/month subscription
  - `VITE_STRIPE_PRODUCT_ID_100` - Product ID for $100/month subscription

## Testing Configuration

After setting the environment variables, you can test if they're properly configured:

### Test Webhook Configuration
```bash
# Deploy the webhook function
supabase functions deploy stripe-webhook

# Check function logs
supabase functions logs stripe-webhook
```

### Test EmailJS Configuration
The webhook will log whether EmailJS configuration is available:
- ✅ `Processing successful subscription payment` - Configuration OK
- ⚠️ `EmailJS configuration missing, skipping email send` - Variables not set

## Security Notes

1. **Never commit secrets to version control**
2. **Use test keys for development**
3. **Rotate keys regularly in production**
4. **Monitor usage in Stripe and EmailJS dashboards**

## Troubleshooting

### Common Issues

#### "EmailJS configuration missing"
- Check that all three EmailJS variables are set
- Verify variable names match exactly (case-sensitive)
- Redeploy the function after setting variables

#### "Stripe configuration missing"
- Ensure STRIPE_SECRET_KEY is set
- Verify the key format (starts with `sk_`)
- Check that the key is for the correct environment (test/live)

#### "Webhook signature verification failed"
- Verify STRIPE_WEBHOOK_SECRET is set correctly
- Ensure the webhook endpoint URL is correct in Stripe
- Check that the webhook is configured for `invoice.payment_succeeded` events

### Verification Commands

```bash
# List all secrets (values are hidden)
supabase secrets list

# Check function deployment status
supabase functions list

# View recent function logs
supabase functions logs stripe-webhook --follow
```