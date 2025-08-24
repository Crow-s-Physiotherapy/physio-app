// Application constants and configuration

export const APP_CONFIG = {
  name: import.meta.env['VITE_APP_NAME'] || 'Physiotherapy Platform',
  url: import.meta.env['VITE_APP_URL'] || 'http://localhost:5173',
} as const;

export const API_CONFIG = {
  supabase: {
    url: import.meta.env['VITE_SUPABASE_URL'] || '',
    anonKey: import.meta.env['VITE_SUPABASE_ANON_KEY'] || '',
  },
  google: {
    clientId: import.meta.env['VITE_GOOGLE_CLIENT_ID'] || '',
  },
  // YouTube API removed - using static thumbnails instead
  stripe: {
    publishableKey: import.meta.env['VITE_STRIPE_PUBLISHABLE_KEY'] || '',
  },
  emailjs: {
    serviceId: import.meta.env['VITE_EMAILJS_SERVICE_ID'] || '',
    templateId: import.meta.env['VITE_EMAILJS_TEMPLATE_ID'] || '',
    publicKey: import.meta.env['VITE_EMAILJS_PUBLIC_KEY'] || '',
  },
} as const;

export const APPOINTMENT_CONFIG = {
  defaultDuration: 60, // minutes
  bookingWindowDays: 30, // days in advance
  cancellationHours: 24, // hours before appointment
} as const;

export const VIDEO_CONFIG = {
  categories: [
    'Back Pain',
    'Neck Pain',
    'Shoulder Pain',
    'Knee Pain',
    'Hip Pain',
    'General Mobility',
    'Strength Training',
    'Posture Correction',
  ],
  difficulties: ['beginner', 'intermediate', 'advanced'] as const,
} as const;

export const DONATION_CONFIG = {
  currency: 'USD',
  defaultAmounts: [10, 25, 50, 100, 250],
  minimumAmount: 5,
  maximumAmount: 10000,
} as const;

// Pain assessment constants
export const PAIN_LEVELS = {
  1: 'No pain',
  2: 'Very mild pain',
  3: 'Mild pain',
  4: 'Moderate pain',
  5: 'Moderate-severe pain',
  6: 'Severe pain',
  7: 'Very severe pain',
  8: 'Extremely severe pain',
  9: 'Unbearable pain',
  10: 'Maximum pain possible',
} as const;

export const DAILY_IMPACT_LEVELS = {
  minimal: 'Minimal impact on daily activities',
  moderate: 'Some difficulty with daily activities',
  significant: 'Significant difficulty with daily activities',
  severe: 'Unable to perform most daily activities',
} as const;

// Form validation constants
export const VALIDATION_LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 255 },
  phone: { min: 10, max: 20 },
  message: { min: 10, max: 1000 },
  notes: { max: 500 },
  description: { min: 10, max: 1000 },
  title: { min: 5, max: 200 },
  symptom: { max: 200 },
  duration: { min: 1, max: 120 },
} as const;

// UI constants
export const UI_CONFIG = {
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
  debounceDelay: 300,
  toastDuration: 5000,
  loadingTimeout: 30000,
} as const;

// Date and time constants
export const DATE_CONFIG = {
  formats: {
    display: 'MMM dd, yyyy',
    input: 'yyyy-MM-dd',
    time: 'HH:mm',
    full: 'MMM dd, yyyy HH:mm',
  },
  businessHours: {
    start: '09:00',
    end: '17:00',
    timezone: 'America/New_York',
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  network: 'Network error. Please check your connection and try again.',
  server: 'Server error. Please try again later.',
  validation: 'Please check your input and try again.',
  unauthorized: 'You are not authorized to perform this action.',
  notFound: 'The requested resource was not found.',
  conflict: 'This action conflicts with existing data.',
  rateLimit: 'Too many requests. Please wait and try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  appointmentBooked: 'Appointment booked successfully!',
  assessmentSubmitted: 'Assessment submitted successfully!',
  donationCompleted: 'Thank you for your donation!',
  videoSaved: 'Video saved successfully!',
  categorySaved: 'Category saved successfully!',
  emailSent: 'Email sent successfully!',
} as const;
