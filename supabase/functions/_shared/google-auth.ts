// Declare Deno global for Supabase Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Google OAuth and Calendar API utilities
import type { GoogleTokenResponse, GoogleCalendarEvent } from './types.ts';

// Additional types for this module
interface CreateEventParams {
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
  patientEmail?: string;
}

interface CheckAvailabilityParams {
  start: string;
  end: string;
}

interface AvailabilityResult {
  available: boolean;
  busyTimes: Array<{
    start: string;
    end: string;
  }>;
}

/**
 * Validates that all required Google OAuth environment variables are present
 * @throws Error if any required environment variables are missing
 */
function validateGoogleCredentials(): void {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');

  const missing = [];
  if (!clientId) missing.push('GOOGLE_CLIENT_ID');
  if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
  if (!refreshToken) missing.push('GOOGLE_REFRESH_TOKEN');

  if (missing.length > 0) {
    throw new Error(`Missing Google OAuth credentials: ${missing.join(', ')}`);
  }
}

/**
 * Handles network errors and provides user-friendly error messages
 * @param error - The caught error
 * @param operation - Description of the operation that failed
 * @throws Error with user-friendly message
 */
function handleNetworkError(error: any, operation: string): never {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    throw new Error(
      `Network error during ${operation}. Please check your connection.`
    );
  }
  if (error.message.includes('timeout')) {
    throw new Error(`Request timeout during ${operation}. Please try again.`);
  }
  throw error;
}

/**
 * Refreshes the Google access token using the stored refresh token
 * @returns Promise<string> - Fresh access token
 */
export async function refreshGoogleToken(): Promise<string> {
  try {
    validateGoogleCredentials();

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
    const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN')!;

    const tokenUrl = 'https://oauth2.googleapis.com/token';

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: 'unknown_error', error_description: errorText };
      }

      // Handle specific OAuth errors with detailed messages
      if (response.status === 400) {
        if (errorData.error === 'invalid_grant') {
          throw new Error(
            'REFRESH_TOKEN_EXPIRED: The refresh token has expired or been revoked. Please regenerate your Google OAuth credentials. This commonly happens in testing mode where tokens expire after 7 days.'
          );
        } else if (errorData.error === 'invalid_client') {
          throw new Error(
            'INVALID_CLIENT_CREDENTIALS: The Google Client ID or Client Secret is invalid. Please verify your OAuth credentials.'
          );
        } else {
          throw new Error(
            `INVALID_REFRESH_REQUEST: ${errorData.error_description || 'Invalid refresh token request'}`
          );
        }
      } else if (response.status === 401) {
        throw new Error(
          'UNAUTHORIZED_REFRESH: The refresh token is unauthorized. This may indicate the token has been revoked or the OAuth app configuration has changed.'
        );
      } else {
        throw new Error(
          `REFRESH_TOKEN_ERROR_${response.status}: ${errorData.error_description || 'Unknown token refresh error'}`
        );
      }
    }

    const tokenData: GoogleTokenResponse = await response.json();

    // Log successful refresh (without exposing the actual token)
    console.log('Google token refreshed successfully');

    return tokenData.access_token;
  } catch (error) {
    // Enhanced error logging for debugging
    console.error('Google token refresh error details:', {
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    handleNetworkError(error, 'token refresh');
  }
}

/**
 * Creates a new event in the primary Google Calendar with Google Meet link
 * @param accessToken - Fresh Google access token
 * @param eventParams - Event details including optional patient email
 * @returns Promise<{eventId: string, meetLink?: string}> - Created event ID and Meet link
 */
export async function createCalendarEvent(
  accessToken: string,
  eventParams: CreateEventParams
): Promise<{ eventId: string; meetLink?: string }> {
  try {
    const calendarId = 'primary';
    // Add sendUpdates=all parameter to send calendar invites to attendees
    // Add conferenceDataVersion=1 to enable Google Meet link generation
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?sendUpdates=all&conferenceDataVersion=1`;

    // Default timezone - you may want to make this configurable
    const timeZone = 'America/New_York';

    const eventData: GoogleCalendarEvent = {
      summary: eventParams.summary,
      description: eventParams.description,
      start: {
        dateTime: eventParams.startTime,
        timeZone: timeZone,
      },
      end: {
        dateTime: eventParams.endTime,
        timeZone: timeZone,
      },
      // Add Google Meet conference data for automatic video link generation
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };

    // Add patient as attendee if email is provided
    if (eventParams.patientEmail) {
      eventData.attendees = [
        {
          email: eventParams.patientEmail,
          responseStatus: 'needsAction',
        },
      ];
    }

    const response = await fetch(calendarUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Calendar event creation failed:', errorText);

      // Handle specific Calendar API errors
      if (response.status === 400) {
        throw new Error('Failed to create calendar event: Invalid event data');
      } else if (response.status === 401) {
        throw new Error(
          'Failed to create calendar event: Authentication expired'
        );
      } else if (response.status === 403) {
        throw new Error(
          'Failed to create calendar event: Insufficient permissions'
        );
      } else if (response.status === 409) {
        throw new Error(
          'Failed to create calendar event: Calendar conflict detected'
        );
      } else {
        throw new Error(`Failed to create calendar event: ${response.status}`);
      }
    }

    const createdEvent = await response.json();

    // Extract Google Meet link from the created event
    const meetLink =
      createdEvent.hangoutLink ||
      createdEvent.conferenceData?.entryPoints?.find(
        (entry: any) => entry.entryPointType === 'video'
      )?.uri;

    return {
      eventId: createdEvent.id,
      meetLink: meetLink,
    };
  } catch (error) {
    handleNetworkError(error, 'calendar event creation');
  }
}

/**
 * Deletes an event from the primary Google Calendar
 * @param accessToken - Fresh Google access token
 * @param eventId - ID of the event to delete
 * @returns Promise<void>
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  try {
    const calendarId = 'primary';
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`;

    const response = await fetch(calendarUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Calendar event deletion failed:', errorText);

      // Handle specific error cases
      if (response.status === 404) {
        throw new Error('Appointment not found in calendar');
      } else if (response.status === 403) {
        throw new Error('Insufficient permissions to delete appointment');
      } else if (response.status === 401) {
        throw new Error('Calendar authentication expired');
      } else {
        throw new Error(`Failed to delete calendar event: ${response.status}`);
      }
    }
  } catch (error) {
    handleNetworkError(error, 'calendar event deletion');
  }
}

/**
 * Gets detailed event information for a specific event
 * @param accessToken - Fresh Google access token
 * @param eventId - Google Calendar event ID
 * @returns Promise<GoogleCalendarEvent | null> - Event details or null if not found
 */
export async function getCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<GoogleCalendarEvent | null> {
  try {
    const calendarId = 'primary';
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`;

    const response = await fetch(calendarUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Event not found
      }
      const errorText = await response.text();
      console.error('Get calendar event failed:', errorText);
      throw new Error(`Failed to get calendar event: ${response.status}`);
    }

    const eventData = await response.json();
    return eventData;
  } catch (error) {
    handleNetworkError(error, 'calendar event retrieval');
  }
}

/**
 * Checks availability using Google Calendar freebusy API
 * @param accessToken - Fresh Google access token
 * @param params - Time range to check
 * @returns Promise<AvailabilityResult> - Availability status and busy times
 */
export async function checkCalendarAvailability(
  accessToken: string,
  params: CheckAvailabilityParams
): Promise<AvailabilityResult> {
  try {
    const freebusyUrl = 'https://www.googleapis.com/calendar/v3/freeBusy';

    const requestBody = {
      timeMin: params.start,
      timeMax: params.end,
      items: [
        {
          id: 'primary',
        },
      ],
    };

    const response = await fetch(freebusyUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Freebusy query failed:', errorText);

      // Handle specific Calendar API errors
      if (response.status === 400) {
        throw new Error(
          'Failed to check calendar availability: Invalid time range'
        );
      } else if (response.status === 401) {
        throw new Error(
          'Failed to check calendar availability: Authentication expired'
        );
      } else if (response.status === 403) {
        throw new Error(
          'Failed to check calendar availability: Insufficient permissions'
        );
      } else {
        throw new Error(
          `Failed to check calendar availability: ${response.status}`
        );
      }
    }

    const freebusyData = await response.json();
    const primaryCalendarBusy = freebusyData.calendars?.primary?.busy || [];

    // Transform busy times to our format
    const busyTimes = primaryCalendarBusy.map((busyPeriod: any) => ({
      start: busyPeriod.start,
      end: busyPeriod.end,
    }));

    // Determine if the requested time slot is available
    const requestStart = new Date(params.start);
    const requestEnd = new Date(params.end);

    const isAvailable = !busyTimes.some((busyTime: any) => {
      const busyStart = new Date(busyTime.start);
      const busyEnd = new Date(busyTime.end);

      // Check if there's any overlap between requested time and busy time
      return requestStart < busyEnd && requestEnd > busyStart;
    });

    return {
      available: isAvailable,
      busyTimes: busyTimes,
    };
  } catch (error) {
    handleNetworkError(error, 'calendar availability check');
  }
}

/**
 * Gets detailed availability with event information including Meet links
 * @param accessToken - Fresh Google access token
 * @param params - Time range to check
 * @returns Promise<DetailedAvailabilityResult> - Availability with detailed event info
 */
export async function getDetailedAvailability(
  accessToken: string,
  params: CheckAvailabilityParams
): Promise<{
  available: boolean;
  busyTimes: Array<{
    start: string;
    end: string;
    eventId?: string;
    summary?: string;
    meetLink?: string;
    appointmentData?: any;
  }>;
}> {
  try {
    // First get basic availability
    const basicAvailability = await checkCalendarAvailability(
      accessToken,
      params
    );

    // Then get detailed event information for each busy period
    const detailedBusyTimes = await Promise.all(
      basicAvailability.busyTimes.map(async busyTime => {
        // For now, we'll use a simple approach to get events in the time range
        // In a more sophisticated implementation, we'd get the event ID from the freebusy response
        return {
          start: busyTime.start,
          end: busyTime.end,
          // We'll enhance this later to include actual event details
        };
      })
    );

    return {
      available: basicAvailability.available,
      busyTimes: detailedBusyTimes,
    };
  } catch (error) {
    handleNetworkError(error, 'detailed availability check');
  }
}
