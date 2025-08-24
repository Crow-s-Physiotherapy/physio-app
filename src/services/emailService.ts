/**
 * Email Service using EmailJS
 *
 * This service handles sending email notifications for appointment-related events:
 * - Appointment confirmation emails
 * - Appointment update notifications
 * - Appointment cancellation notifications
 * - Reminder emails
 *
 * Requirements: 1.6
 */

import emailjs from '@emailjs/browser';

// Donation confirmation email interface
interface DonationConfirmationData {
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  message?: string;
  donationId: string;
  donationType: 'one_time' | 'monthly';
  stripeSubscriptionId?: string;
}

// EmailJS configuration
const EMAILJS_SERVICE_ID = import.meta.env['VITE_EMAILJS_SERVICE_ID'];
const EMAILJS_TEMPLATE_ID_DONATION = 'template_6whb2xs';
const EMAILJS_PUBLIC_KEY = import.meta.env['VITE_EMAILJS_PUBLIC_KEY'];

// Initialize EmailJS
let isInitialized = false;

const initializeEmailJS = (): void => {
  if (!isInitialized && EMAILJS_PUBLIC_KEY) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    isInitialized = true;
  }
};

/**
 * Send donation confirmation email with validation and tracking
 * Requirement: 5.3
 */
export const sendDonationConfirmation = async (
  donationData: DonationConfirmationData
): Promise<{
  success: boolean;
  attemptId?: string;
  error?: string;
}> => {
  // Import validation utilities
  const { validateDonationEmail, checkEmailDeliverability } = await import(
    '../utils/emailValidation'
  );
  const { emailDeliveryTracker } = await import(
    '../utils/emailDeliveryTracker'
  );

  try {
    // Validate email address
    const emailValidation = validateDonationEmail(donationData.donorEmail);
    if (!emailValidation.isValid) {
      return {
        success: false,
        error: emailValidation.error || 'Invalid email address',
      };
    }

    // Check email deliverability
    const deliverabilityCheck = checkEmailDeliverability(
      donationData.donorEmail
    );
    if (!deliverabilityCheck.reliable) {
      console.warn(
        'Email deliverability concerns:',
        deliverabilityCheck.warnings
      );
    }

    // Track delivery attempt
    const attemptId = emailDeliveryTracker.trackDeliveryAttempt(
      donationData.donationId,
      emailValidation.sanitizedEmail!,
      'donation_confirmation'
    );

    initializeEmailJS();

    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID_DONATION) {
      const error = 'EmailJS configuration missing for donation emails';
      emailDeliveryTracker.updateDeliveryStatus(attemptId, 'failed', error);
      return {
        success: false,
        attemptId,
        error,
      };
    }

    // Generate unsubscribe URL for monthly donations - point to our frontend page
    const appUrl = import.meta.env['VITE_APP_URL'] || window.location.origin;
    const unsubscribeUrl =
      donationData.donationType === 'monthly' &&
      donationData.stripeSubscriptionId
        ? `${appUrl}/manage-subscription?subscription_id=${donationData.stripeSubscriptionId}`
        : '';

    const templateData = {
      to_email: emailValidation.sanitizedEmail,
      to_name: donationData.donorName,
      donor_name: donationData.donorName,
      donation_amount: donationData.amount.toFixed(2),
      donation_currency: donationData.currency.toUpperCase(),
      donation_message: donationData.message || '',
      donation_id: donationData.donationId,
      donation_type: donationData.donationType,
      donation_type_monthly: donationData.donationType === 'monthly',
      donation_type_onetime: donationData.donationType === 'one_time',
      donation_date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      donation_time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      clinic_name: 'Juan Crow Larrea - Physiotherapy',
      clinic_email: 'matasanosphysio@gmail.com',
      clinic_phone: '(+61) 416 214 955',
      clinic_address: 'Australia',
      clinic_website: 'https://physioconnect.com',
      // Monthly subscription specific
      unsubscribe_url: unsubscribeUrl,
      subscription_id: donationData.stripeSubscriptionId || '',
      // Tax information
      tax_deductible:
        'This donation may be tax-deductible. Please consult your tax advisor.',
      receipt_note:
        'Please keep this email as your donation receipt for tax purposes.',
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID_DONATION,
      templateData
    );

    if (response.status === 200) {
      emailDeliveryTracker.updateDeliveryStatus(
        attemptId,
        'sent',
        undefined,
        response
      );
      console.log('Donation confirmation email sent successfully:', response);
      return {
        success: true,
        attemptId,
      };
    } else {
      const error = `Email service returned status ${response.status}`;
      emailDeliveryTracker.updateDeliveryStatus(
        attemptId,
        'failed',
        error,
        response
      );
      return {
        success: false,
        attemptId,
        error,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error sending donation confirmation email:', error);

    // Update tracking if donationData exists
    if (donationData && typeof donationData === 'object') {
      try {
        const { emailDeliveryTracker } = await import(
          '../utils/emailDeliveryTracker'
        );
        const attemptId = emailDeliveryTracker.trackDeliveryAttempt(
          donationData.donationId,
          donationData.donorEmail,
          'donation_confirmation'
        );
        emailDeliveryTracker.updateDeliveryStatus(
          attemptId,
          'failed',
          errorMessage
        );
        return {
          success: false,
          attemptId,
          error: errorMessage,
        };
      } catch (trackingError) {
        console.error('Error updating delivery tracking:', trackingError);
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const emailService = {
  sendDonationConfirmation,
};

export default emailService;
