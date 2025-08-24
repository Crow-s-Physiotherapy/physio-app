# EmailJS Donation Confirmation Template

## Template Configuration

**Service ID:** `service_ex845yc` **Template ID:** `template_6whb2xs` **Public
Key:** `Hik0alZwgbsXhpGVg`

## Template Variables

The following variables are available in the EmailJS template:

### Basic Information

- `{{to_email}}` - Recipient email address
- `{{to_name}}` - Recipient name (donor name)
- `{{donor_name}}` - Donor's full name
- `{{donation_date}}` - Date of donation (formatted)
- `{{donation_time}}` - Time of donation (formatted)

### Donation Details

- `{{donation_amount}}` - Amount donated (formatted with 2 decimals)
- `{{donation_currency}}` - Currency code (USD, EUR, etc.)
- `{{donation_type}}` - Type of donation (one_time or monthly)
- `{{donation_id}}` - Unique donation identifier
- `{{donation_message}}` - Optional message from donor

### Clinic Information

- `{{clinic_name}}` - Juan Crow Larrea - Physiotherapy
- `{{clinic_email}}` - matasanosphysio@gmail.com
- `{{clinic_phone}}` - (+61) 416 214 955
- `{{clinic_address}}` - Australia
- `{{clinic_website}}` - https://physioconnect.com

### Tax & Receipt Information

- `{{tax_deductible}}` - Tax deductibility notice
- `{{receipt_note}}` - Receipt keeping instructions

### Monthly Subscription Specific

- `{{unsubscribe_url}}` - URL to cancel monthly subscription (only for monthly
  donations)
- `{{subscription_id}}` - Stripe subscription ID (only for monthly donations)

## HTML Template Structure

```html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You for Your Donation</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding: 20px 0;
                border-bottom: 2px solid #e0e0e0;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .content {
                padding: 30px 0;
            }
            .donation-details {
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .amount {
                font-size: 32px;
                font-weight: bold;
                color: #059669;
                text-align: center;
                margin: 20px 0;
            }
            .footer {
                border-top: 2px solid #e0e0e0;
                padding: 20px 0;
                text-align: center;
                font-size: 14px;
                color: #666;
            }
            .button {
                display: inline-block;
                padding: 12px 24px;
                background: #dc2626;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin: 10px 0;
            }
            .monthly-info {
                background: #fef3c7;
                border: 1px solid #f59e0b;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="logo">{{clinic_name}}</div>
                <h1 style="color: #2563eb; margin: 0">
                    Thank You for Your Generous Donation! 💙
                </h1>
            </div>

            <!-- Content -->
            <div class="content">
                <p>Dear {{donor_name}},</p>

                <p>
                    We are incredibly grateful for your generous support! Your
                    donation helps us continue providing quality physiotherapy
                    services and educational resources to our community.
                </p>

                <!-- Donation Amount -->
                <div class="amount">
                    {{donation_currency}} ${{donation_amount}}
                    {{#donation_type_monthly}}/month{{/donation_type_monthly}}
                </div>

                <!-- Donation Details -->
                <div class="donation-details">
                    <h3 style="margin-top: 0; color: #374151">
                        Donation Details
                    </h3>
                    <p><strong>Donation ID:</strong> {{donation_id}}</p>
                    <p>
                        <strong>Date:</strong> {{donation_date}} at
                        {{donation_time}}
                    </p>
                    <p>
                        <strong>Type:</strong> {{#donation_type_monthly}}Monthly
                        Subscription{{/donation_type_monthly}}{{#donation_type_onetime}}One-time
                        Donation{{/donation_type_onetime}}
                    </p>
                    <p>
                        <strong>Amount:</strong> {{donation_currency}}
                        ${{donation_amount}}{{#donation_type_monthly}} per
                        month{{/donation_type_monthly}}
                    </p>
                    {{#donation_message}}
                    <p>
                        <strong>Your Message:</strong><br>
                        <em>"{{donation_message}}"</em>
                    </p>
                    {{/donation_message}}
                </div>

                <!-- Monthly Subscription Info -->
                {{#donation_type_monthly}}
                <div class="monthly-info">
                    <h3 style="margin-top: 0; color: #92400e">
                        Monthly Subscription
                    </h3>
                    <p>
                        <strong>Your monthly donation is now active!</strong>
                        This amount will be automatically charged on the same
                        date each month.
                    </p>
                    <p style="text-align: center; margin: 20px 0">
                        <a
                            href="{{unsubscribe_url}}"
                            class="button"
                            style="background: #dc2626; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block"
                        >Manage Monthly Donation</a>
                    </p>
                    <p style="font-size: 14px; color: #666; text-align: center">
                        You can cancel or modify your monthly donation at any
                        time using the link above, or contact us at
                        {{clinic_email}} for assistance.
                    </p>
                </div>
                {{/donation_type_monthly}}

                <!-- Impact Message -->
                <div
                    style="background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0"
                >
                    <h3 style="margin-top: 0; color: #065f46">Your Impact</h3>
                    <p>Your donation directly supports:</p>
                    <ul>
                        <li>
                            Quality physiotherapy treatments for patients in
                            need
                        </li>
                        <li>Educational resources and exercise programs</li>
                        <li>Community health and wellness initiatives</li>
                        <li>Continued professional development and training</li>
                    </ul>
                </div>

                <!-- Tax Information -->
                <div
                    style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0"
                >
                    <h3 style="margin-top: 0; color: #475569">
                        Receipt & Tax Information
                    </h3>
                    <p>{{tax_deductible}}</p>
                    <p>{{receipt_note}}</p>
                </div>

                <p>
                    If you have any questions about your donation or our
                    services, please don't hesitate to contact us.
                </p>

                <p>
                    With heartfelt gratitude,<br>
                    <strong>Juan Crow Larrea</strong><br>
                    Physiotherapist
                </p>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p><strong>{{clinic_name}}</strong></p>
                <p>Email: {{clinic_email}} | Phone: {{clinic_phone}}</p>
                <p>{{clinic_address}}</p>
                <p>
                    Website: <a href="{{clinic_website}}">{{clinic_website}}</a>
                </p>

                {{#donation_type_monthly}}
                <p style="margin-top: 20px; font-size: 12px">
                    <strong>Monthly Subscription:</strong> Next payment on the
                    same date next month.
                    <a href="{{unsubscribe_url}}">Manage subscription</a> or
                    contact us at {{clinic_email}}.
                </p>
                {{/donation_type_monthly}}
            </div>
        </div>
    </body>
</html>
```

## Text Template (Fallback)

```
Thank You for Your Generous Donation!

Dear {{donor_name}},

We are incredibly grateful for your generous support! Your donation helps us continue providing quality physiotherapy services and educational resources to our community.

DONATION DETAILS:
- Donation ID: {{donation_id}}
- Date: {{donation_date}} at {{donation_time}}
- Type: {{#donation_type_monthly}}Monthly Subscription{{/donation_type_monthly}}{{#donation_type_onetime}}One-time Donation{{/donation_type_onetime}}
- Amount: {{donation_currency}} ${{donation_amount}}{{#donation_type_monthly}} per month{{/donation_type_monthly}}

{{#donation_message}}
Your Message: "{{donation_message}}"
{{/donation_message}}

{{#donation_type_monthly}}
MONTHLY SUBSCRIPTION:
Your monthly donation is now active! This amount will be automatically charged on the same date each month.

To manage your subscription, visit: {{unsubscribe_url}}
Or contact us directly at {{clinic_email}} for assistance.

You can cancel or modify your monthly donation at any time using the link above.
{{/donation_type_monthly}}

YOUR IMPACT:
Your donation directly supports:
- Quality physiotherapy treatments for patients in need
- Educational resources and exercise programs  
- Community health and wellness initiatives
- Continued professional development and training

RECEIPT & TAX INFORMATION:
{{tax_deductible}}
{{receipt_note}}

If you have any questions about your donation or our services, please contact us at {{clinic_email}}.

With heartfelt gratitude,
Juan Crow Larrea
Physiotherapist

{{clinic_name}}
Email: {{clinic_email}}
Phone: {{clinic_phone}}
{{clinic_address}}
Website: {{clinic_website}}

{{#donation_type_monthly}}
To manage your monthly subscription: {{unsubscribe_url}} or contact {{clinic_email}}
{{/donation_type_monthly}}
```

## Setup Instructions

1. Log into your EmailJS dashboard
2. Navigate to Email Templates
3. Create a new template with ID: `template_6whb2xs`
4. Copy the HTML template above into the HTML content area
5. Copy the text template above into the Text content area
6. Save the template
7. Test with sample data to ensure all variables render correctly
