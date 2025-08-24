import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import {
  refreshGoogleToken,
  deleteCalendarEvent,
} from '../_shared/google-auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface CancelAppointmentRequest {
  appointmentId: string;
  reason?: string;
}

interface CancelAppointmentResponse {
  success: boolean;
  message?: string;
  error?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Allow both GET and POST requests
    let appointmentId: string;
    let reason: string | undefined;

    if (req.method === 'GET') {
      // Extract appointment ID from URL path
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      appointmentId = pathParts[pathParts.length - 1];
      reason = url.searchParams.get('reason') || undefined;
    } else if (req.method === 'POST') {
      // Extract from request body
      const body: CancelAppointmentRequest = await req.json();
      appointmentId = body.appointmentId;
      reason = body.reason;
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Method not allowed. Use GET or POST.',
        }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate appointment ID
    if (!appointmentId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Appointment ID is required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get appointment details first
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (fetchError) {
      console.error('Error fetching appointment:', fetchError);

      if (fetchError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Appointment not found',
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      throw new Error(`Failed to fetch appointment: ${fetchError.message}`);
    }

    // Check if appointment is already cancelled
    if (appointment.status === 'cancelled') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Appointment is already cancelled',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if appointment is in the past
    const appointmentDateTime = new Date(
      `${appointment.appointment_date}T${appointment.appointment_time}`
    );
    const now = new Date();

    if (appointmentDateTime < now) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cannot cancel past appointments',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update appointment status in database
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || 'Cancelled by patient',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      throw new Error(`Failed to cancel appointment: ${updateError.message}`);
    }

    // Delete from Google Calendar if event ID exists
    if (appointment.google_event_id) {
      try {
        const accessToken = await refreshGoogleToken();
        await deleteCalendarEvent(accessToken, appointment.google_event_id);
      } catch (calendarError) {
        console.warn('Failed to delete calendar event:', calendarError);
        // Don't fail the cancellation if calendar deletion fails
        // The appointment is still cancelled in our database
      }
    }

    const response: CancelAppointmentResponse = {
      success: true,
      message: 'Appointment cancelled successfully',
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in cancel-appointment function:', error);

    let errorMessage = 'Failed to cancel appointment';
    let statusCode = 500;

    // Handle specific errors
    if (error.message.includes('Failed to refresh Google token')) {
      errorMessage =
        'Calendar authentication failed. Appointment cancelled in system but may still appear in calendar.';
      statusCode = 207; // Partial success
    }

    const response: CancelAppointmentResponse = {
      success: false,
      error: errorMessage,
    };

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
