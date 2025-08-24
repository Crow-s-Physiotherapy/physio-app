/**
 * Application Configuration
 *
 * Handles environment variables and provides fallbacks for development
 */

export const config = {
  supabase: {
    url: import.meta.env['VITE_SUPABASE_URL'] || 'https://demo.supabase.co',
    anonKey: import.meta.env['VITE_SUPABASE_ANON_KEY'] || 'demo-key',
  },
  youtube: {
    apiKey: import.meta.env['VITE_YOUTUBE_API_KEY'] || 'demo-key',
  },
  stripe: {
    publishableKey:
      import.meta.env['VITE_STRIPE_PUBLISHABLE_KEY'] || 'demo-key',
  },
  emailjs: {
    serviceId: import.meta.env['VITE_EMAILJS_SERVICE_ID'] || 'demo-service',
    templateId: import.meta.env['VITE_EMAILJS_TEMPLATE_ID'] || 'demo-template',
    publicKey: import.meta.env['VITE_EMAILJS_PUBLIC_KEY'] || 'demo-key',
  },
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Check if we're using demo/fallback values
export const isUsingDemoConfig = {
  supabase:
    config.supabase.url === 'https://demo.supabase.co' ||
    config.supabase.anonKey === 'demo-key',
  youtube: config.youtube.apiKey === 'demo-key',
  stripe: config.stripe.publishableKey === 'demo-key',
  emailjs: config.emailjs.serviceId === 'demo-service',
};

export default config;
