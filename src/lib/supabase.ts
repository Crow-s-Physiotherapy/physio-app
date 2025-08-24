import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { config, isUsingDemoConfig } from './config';

// Create Supabase client with fallback for development
export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.anonKey
);

// Log warning if using demo configuration
if (isUsingDemoConfig.supabase && config.isDevelopment) {
  console.warn(
    '⚠️ Using demo Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables for full functionality.'
  );
}
