/**
 * Email validation utilities for donation email notifications
 * Requirements: 5.3
 */

/**
 * Validate email address format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate email domain (basic check for common issues)
 */
export const isValidEmailDomain = (email: string): boolean => {
  const domain = email.split('@')[1];
  if (!domain) return false;

  // Check for common typos and invalid domains
  const invalidDomains = [
    'test.com',
    'example.com',
    'localhost',
    'temp.com',
    'fake.com',
    'invalid.com',
  ];

  return !invalidDomains.includes(domain.toLowerCase());
};

/**
 * Sanitize email address
 */
export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Comprehensive email validation for donation emails
 */
export const validateDonationEmail = (
  email: string
): {
  isValid: boolean;
  error?: string;
  sanitizedEmail?: string;
} => {
  if (!email || email.trim().length === 0) {
    return {
      isValid: false,
      error: 'Email address is required',
    };
  }

  const sanitizedEmail = sanitizeEmail(email);

  if (!isValidEmail(sanitizedEmail)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    };
  }

  if (!isValidEmailDomain(sanitizedEmail)) {
    return {
      isValid: false,
      error: 'Please enter a valid email domain',
    };
  }

  if (sanitizedEmail.length > 254) {
    return {
      isValid: false,
      error: 'Email address is too long',
    };
  }

  return {
    isValid: true,
    sanitizedEmail,
  };
};

/**
 * Check if email provider is likely to have delivery issues
 */
export const checkEmailDeliverability = (
  email: string
): {
  reliable: boolean;
  warnings: string[];
} => {
  const domain = email.split('@')[1]?.toLowerCase();
  const warnings: string[] = [];
  let reliable = true;

  if (!domain) {
    return { reliable: false, warnings: ['Invalid email format'] };
  }

  // Check for temporary email providers
  const tempEmailProviders = [
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'tempmail.org',
    'throwaway.email',
  ];

  if (tempEmailProviders.some(provider => domain.includes(provider))) {
    reliable = false;
    warnings.push(
      'Temporary email provider detected - emails may not be delivered'
    );
  }

  // Check for common typos in popular providers
  const commonTypos: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
  };

  if (domain in commonTypos) {
    warnings.push(`Did you mean ${commonTypos[domain]}?`);
  }

  return { reliable, warnings };
};

/**
 * Format email for display (mask for privacy)
 */
export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;

  if (localPart.length <= 2) {
    return `${localPart[0]}*@${domain}`;
  }

  const maskedLocal = `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}`;
  return `${maskedLocal}@${domain}`;
};

export const emailValidation = {
  isValidEmail,
  isValidEmailDomain,
  sanitizeEmail,
  validateDonationEmail,
  checkEmailDeliverability,
  maskEmail,
};

export default emailValidation;
