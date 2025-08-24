import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import {
  refreshGoogleToken,
  checkCalendarAvailability,
} from '../_shared/google-auth.ts';
import type {
  CheckAvailabilityRequest,
  CheckAvailabilityResponse,
} from '../_shared/types.ts';

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ available: false, error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: CheckAvailabilityRequest = await req.json();

    // Validate required fields
    if (!body.start || !body.end) {
      return new Response(
        JSON.stringify({
          available: false,
          error: 'Missing required fields: start, end',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate date formats
    const startDate = new Date(body.start);
    const endDate = new Date(body.end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new Response(
        JSON.stringify({
          available: false,
          error: 'Invalid date format. Use ISO 8601 format.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (startDate >= endDate) {
      return new Response(
        JSON.stringify({
          available: false,
          error: 'End time must be after start time',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get fresh access token
    const accessToken = await refreshGoogleToken();

    // Check calendar availability
    const availabilityResult = await checkCalendarAvailability(accessToken, {
      start: body.start,
      end: body.end,
    });

    const response: CheckAvailabilityResponse = {
      available: availabilityResult.available,
      busyTimes: availabilityResult.busyTimes,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking availability:', error);

    // Don't expose sensitive error details in production
    let errorMessage = 'Failed to check availability';
    let statusCode = 500;

    // Handle specific Google API errors
    if (error.message.includes('Failed to refresh Google token')) {
      errorMessage = 'Calendar authentication failed. Please contact support.';
      statusCode = 401;
    } else if (
      error.message.includes('Failed to check calendar availability: 403')
    ) {
      errorMessage =
        'Insufficient calendar permissions. Please contact support.';
      statusCode = 403;
    } else if (
      error.message.includes('Failed to check calendar availability')
    ) {
      errorMessage = 'Unable to check calendar availability. Please try again.';
      statusCode = 500;
    } else if (error.message.includes('Missing Google OAuth credentials')) {
      errorMessage =
        'Calendar service is temporarily unavailable. Please contact support.';
      statusCode = 503;
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage =
        'Network error. Please check your connection and try again.';
      statusCode = 503;
    }

    const response: CheckAvailabilityResponse = {
      available: false,
      error: errorMessage,
    };

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
