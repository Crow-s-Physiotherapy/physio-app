# Email Notification Setup Guide

This guide explains how to configure EmailJS for donation confirmation emails in the physiotherapy platform.

## Overview

The platform uses EmailJS to send donation confirmation emails directly from the frontend without requiring a backend email server. This approach is:

- ✅ **Cost-effective**: No server infrastructure needed
- ✅ **Reliable**: Uses established email providers
- ✅ **Scalable**: Handles volume without server management
- ✅ **Secure**: No sensitive credentials in backend

## EmailJS Setup Steps

### 1. Create EmailJS Account

1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Connect Email Service

1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider:
   - **Gmail** (recommended for development)
   - **Outlook/Hotmail**
   - **Yahoo**
   - **Custom SMTP**

4. Follow the connection wizard:
   - For Gmail: Allow EmailJS access to your account
   - For others: Provide SMTP credentials

5. Test the connection and save

### 3. Create Email Template

1. Go to **Email Templates** in EmailJS dashboard
2. Click **Create New Template**
3. Use this template structure:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Donation Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .donation-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .amount { font-size: 24px; font-weight: bold; color: #059669; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🙏 Thank You for Your Donation!</h1>
        </div>
        
        <div class="content">
            <p>Dear {{donor_name}},</p>
            
            <p>Thank you so much for your generous donation to {{clinic_name}}! Your support helps us continue providing quality physiotherapy services to our community.</p>
            
            <div class="donation-details">
                <h3>Donation Details</h3>
                <p><strong>Amount:</strong> <span class="amount">${{donation_amount}} {{donation_currency}}</span></p>
                <p><strong>Date:</strong> {{donation_date}} at {{donation_time}}</p>
                <p><strong>Donation ID:</strong> {{donation_id}}</p>
                {{#donation_message}}
                <p><strong>Your Message:</strong> "{{donation_message}}"</p>
                {{/donation_message}}
            </div>
            
            <p><strong>🌟 Your Impact:</strong> Your donation helps us:</p>
            <ul>
                <li>Provide quality physiotherapy services</li>
                <li>Maintain and upgrade our equipment</li>
                <li>Develop new educational resources</li>
                <li>Support patients in need</li>
            </ul>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>📄 Tax Information:</strong> {{tax_deductible}}</p>
                <p><strong>🧾 Receipt:</strong> {{receipt_note}}</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>{{clinic_name}}</strong></p>
            <p>{{clinic_address}}</p>
            <p>Phone: {{clinic_phone}} | Email: {{clinic_email}}</p>
            <p>Website: {{clinic_website}}</p>
            <hr>
            <p>This is an automated confirmation email. Please keep this for your records.</p>
        </div>
    </div>
</body>
</html>
```

4. Set the template variables:
   - **Subject**: `Thank you for your donation to {{clinic_name}}! 🙏`
   - **From Name**: `{{clinic_name}}`
   - **From Email**: Your verified email address
   - **To Email**: `{{to_email}}`

5. Save the template and note the **Template ID**

### 4. Get API Keys

1. Go to **Account** → **General**
2. Copy your **Public Key**
3. Go to **Email Services** and copy your **Service ID**
4. Go to **Email Templates** and copy your **Template ID**

### 5. Update Environment Variables

Update your `.env` file with the EmailJS credentials:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_your_service_id
VITE_EMAILJS_TEMPLATE_ID_DONATION=template_your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

## Testing the Setup

### 1. Use the Built-in Tester

1. Start your development server: `npm run dev`
2. Navigate to `/admin` in your browser
3. Go to the **Email Testing** tab
4. Enter your email address
5. Click **Run Email Tests**
6. Check your email inbox for the test message

### 2. Manual Testing

You can also test manually by making a donation:

1. Go to `/donations`
2. Fill out the donation form with your email
3. Complete the payment process
4. Check your email for the confirmation

### 3. Console Testing

For development testing, you can use the browser console:

```javascript
// Test email configuration
import { emailTesting } from './src/utils/emailTesting';
emailTesting.testEmailConfiguration().then(console.log);

// Test sending email
emailTesting.testDonationConfirmationEmail('your-email@example.com').then(console.log);

// Run full test suite
emailTesting.runEmailTestSuite('your-email@example.com').then(console.log);
```

## Troubleshooting

### Common Issues

1. **"EmailJS configuration missing"**
   - Check that all environment variables are set correctly
   - Restart your development server after updating `.env`

2. **"Email sending failed"**
   - Verify your EmailJS service is connected and active
   - Check that your template ID is correct
   - Ensure your email service has sufficient quota

3. **Emails not received**
   - Check spam/junk folder
   - Verify the recipient email address is valid
   - Check EmailJS dashboard for delivery logs

4. **Template variables not working**
   - Ensure template variable names match exactly (case-sensitive)
   - Check for typos in variable names
   - Verify template is saved and published

### Debug Mode

Enable debug logging by adding to your `.env`:

```env
VITE_DEBUG_EMAIL=true
```

This will log detailed information about email sending attempts.

### Rate Limits

EmailJS free tier includes:
- 200 emails/month
- 50 emails/day
- Rate limiting may apply

For production, consider upgrading to a paid plan.

## Security Considerations

1. **Public Keys**: EmailJS public keys are safe to expose in frontend code
2. **Email Validation**: The system validates email addresses before sending
3. **Spam Prevention**: EmailJS has built-in spam protection
4. **Data Privacy**: No sensitive payment data is included in emails

## Production Deployment

### Vercel Deployment

1. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Add the EmailJS environment variables
   - Redeploy your application

### Domain Verification

For better deliverability:
1. Add your domain to EmailJS
2. Set up SPF/DKIM records if using custom domain
3. Monitor delivery rates in EmailJS dashboard

## Monitoring and Analytics

### Email Delivery Tracking

The system includes built-in delivery tracking:

```javascript
import { emailDeliveryTracker } from './src/utils/emailDeliveryTracker';

// Get delivery statistics
const stats = emailDeliveryTracker.getDeliveryStats();
console.log('Email delivery stats:', stats);

// Get failed deliveries
const failed = emailDeliveryTracker.getFailedDeliveries();
console.log('Failed deliveries:', failed);
```

### EmailJS Dashboard

Monitor your email usage:
1. Go to EmailJS dashboard
2. Check **Usage** tab for statistics
3. Review **Logs** for delivery details
4. Set up alerts for quota limits

## Support

- **EmailJS Documentation**: https://www.emailjs.com/docs/
- **EmailJS Support**: https://www.emailjs.com/support/
- **Platform Issues**: Check the admin email tester for diagnostics

## Template Customization

You can customize the email template by:

1. Modifying the HTML template in EmailJS dashboard
2. Adding new template variables
3. Updating the template data in `src/services/emailService.ts`
4. Testing changes with the built-in email tester

Remember to test all changes thoroughly before deploying to production!