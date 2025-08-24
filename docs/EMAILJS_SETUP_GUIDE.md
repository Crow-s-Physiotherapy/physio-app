# EmailJS Donation Template Setup Guide

## Overview

This guide will help you set up the EmailJS template for donation confirmations. The template supports both one-time donations and monthly subscriptions, with automatic unsubscribe functionality for monthly donations.

## Prerequisites

- EmailJS account with service ID: `service_ex845yc`
- Public key: `Hik0alZwgbsXhpGVg`
- Template ID: `template_6whb2xs`

## Step 1: Create the Template

1. Log into your EmailJS dashboard
2. Navigate to **Email Templates**
3. Click **Create New Template**
4. Set the template ID to: `template_6whb2xs`

## Step 2: Configure Template Settings

### Basic Settings
- **Template Name**: Donation Confirmation
- **Subject**: `Thank you for your donation, {{donor_name}}!`
- **From Name**: `Juan Crow Larrea - Physiotherapy`
- **From Email**: `matasanosphysio@gmail.com`
- **Reply To**: `matasanosphysio@gmail.com`

### HTML Content

Copy the HTML template from `docs/EMAILJS_DONATION_TEMPLATE.md` into the HTML content area.

### Text Content (Fallback)

Copy the text template from `docs/EMAILJS_DONATION_TEMPLATE.md` into the text content area.

## Step 3: Template Variables

The following variables are automatically populated by the application:

### Required Variables
- `{{to_email}}` - Recipient email
- `{{to_name}}` - Recipient name
- `{{donor_name}}` - Donor's name
- `{{donation_amount}}` - Amount (formatted)
- `{{donation_currency}}` - Currency code
- `{{donation_id}}` - Unique donation ID
- `{{donation_type}}` - 'one_time' or 'monthly'

### Conditional Variables (Monthly Only)
- `{{donation_type_monthly}}` - Boolean for monthly donations
- `{{unsubscribe_url}}` - Unsubscribe link
- `{{subscription_id}}` - Stripe subscription ID

### Clinic Information
- `{{clinic_name}}` - Juan Crow Larrea - Physiotherapy
- `{{clinic_email}}` - matasanosphysio@gmail.com
- `{{clinic_phone}}` - (+61) 416 214 955
- `{{clinic_address}}` - Australia
- `{{clinic_website}}` - https://physioconnect.com

## Step 4: Test the Template

1. Use EmailJS's test feature with sample data:

```json
{
  "to_email": "test@example.com",
  "to_name": "Test User",
  "donor_name": "Test User",
  "donation_amount": "25.00",
  "donation_currency": "USD",
  "donation_type": "monthly",
  "donation_type_monthly": true,
  "donation_type_onetime": false,
  "donation_id": "don_test123",
  "donation_date": "Monday, January 15, 2024",
  "donation_time": "2:30 PM",
  "donation_message": "Keep up the great work!",
  "unsubscribe_url": "https://swtqgdyyzficdfjpabpl.supabase.co/functions/v1/unsubscribe-donation?subscription_id=sub_test123",
  "subscription_id": "sub_test123",
  "clinic_name": "Juan Crow Larrea - Physiotherapy",
  "clinic_email": "matasanosphysio@gmail.com",
  "clinic_phone": "(+61) 416 214 955",
  "clinic_address": "Australia",
  "clinic_website": "https://physioconnect.com",
  "tax_deductible": "This donation may be tax-deductible. Please consult your tax advisor.",
  "receipt_note": "Please keep this email as your donation receipt for tax purposes."
}
```

## Step 5: Verify Integration

1. Make a test donation through the application
2. Check that the email is sent correctly
3. For monthly donations, verify the unsubscribe link works
4. Test both anonymous and named donations

## Troubleshooting

### Email Not Sending
- Check EmailJS service status
- Verify template ID matches: `template_6whb2xs`
- Ensure all required variables are provided
- Check browser console for errors

### Unsubscribe Link Not Working
- Verify Supabase edge function is deployed
- Check that `STRIPE_SECRET_KEY` is set in Supabase environment
- Ensure subscription ID is valid in Stripe

### Template Variables Not Rendering
- Check variable names match exactly (case-sensitive)
- Verify conditional logic syntax: `{{#variable}}...{{/variable}}`
- Test with sample data first

## Monthly Donation Flow

1. User completes monthly donation
2. Stripe creates subscription
3. Webhook receives `invoice.payment_succeeded` event
4. Database updated with subscription details
5. Confirmation email sent with unsubscribe link
6. Future recurring payments trigger additional emails

## Unsubscribe Flow

1. User clicks unsubscribe link in email
2. Edge function displays confirmation page
3. User confirms cancellation
4. Stripe subscription cancelled
5. Database updated
6. Success page displayed

## Security Notes

- Unsubscribe links are direct to Supabase edge functions
- No authentication required (subscription ID acts as token)
- Subscription validation prevents unauthorized cancellations
- All Stripe operations use server-side secret key