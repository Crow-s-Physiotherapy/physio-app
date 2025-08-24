import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import {
  refreshGoogleToken,
  createCalendarEvent,
} from '../_shared/google-auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type {
  NewAppointmentRequest,
  NewAppointmentResponse,
} from '../_shared/types.ts';

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Method not allowed',
        }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: NewAppointmentRequest = await req.json();

    // Validate required fields
    if (
      !body.startTime ||
      !body.endTime ||
      !body.patientName ||
      !body.patientEmail
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Missing required fields: startTime, endTime, patientName, patientEmail',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate symptom assessment if provided
    if (body.symptomAssessment) {
      if (
        !body.symptomAssessment.painLevel ||
        body.symptomAssessment.painLevel < 1 ||
        body.symptomAssessment.painLevel > 10
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Pain level must be between 1 and 10',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Validate date formats
    const startDate = new Date(body.startTime);
    const endDate = new Date(body.endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new Response(
        JSON.stringify({
          success: false,
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
          success: false,
          error: 'End time must be after start time',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate that the appointment is in the future
    const now = new Date();
    if (startDate <= now) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Appointment must be scheduled for a future time',
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

    // Store appointment in database first
    const appointmentData = {
      patient_name: body.patientName,
      patient_email: body.patientEmail,
      patient_phone: body.patientPhone || '',
      appointment_date: body.startTime.split('T')[0],
      appointment_time: new Date(body.startTime).toTimeString().split(' ')[0],
      duration: Math.round(
        (new Date(body.endTime).getTime() -
          new Date(body.startTime).getTime()) /
          (1000 * 60)
      ),
      status: 'scheduled',
      notes: body.notes || '',
    };

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single();

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError);
      throw new Error(
        `Failed to create appointment: ${appointmentError.message}`
      );
    }

    // Store symptom assessment if provided
    let assessmentId = null;
    if (body.symptomAssessment) {
      const assessmentData = {
        appointment_id: appointment.id, // Link to the appointment
        patient_name: body.patientName,
        patient_email: body.patientEmail,
        pain_level: body.symptomAssessment.painLevel,
        assessment_date: body.startTime.split('T')[0],
        primary_symptom: body.symptomAssessment.primarySymptom,
        pain_locations: body.symptomAssessment.painLocation,
        symptom_duration: body.symptomAssessment.symptomDuration,
        daily_impact: body.symptomAssessment.dailyImpact,
        previous_treatments: body.symptomAssessment.previousTreatments,
        current_medications: body.symptomAssessment.currentMedications,
        additional_notes: body.symptomAssessment.additionalNotes,
        symptoms: {
          primarySymptom: body.symptomAssessment.primarySymptom,
          secondarySymptoms: body.symptomAssessment.secondarySymptoms || [],
          onsetDate: body.symptomAssessment.onsetDate,
          triggerEvents: body.symptomAssessment.triggerEvents || [],
          worseningFactors: body.symptomAssessment.worseningFactors || [],
          relievingFactors: body.symptomAssessment.relievingFactors || [],
          dailyImpact: body.symptomAssessment.dailyImpact,
          painLocation: body.symptomAssessment.painLocation,
          symptomDuration: body.symptomAssessment.symptomDuration,
          previousTreatments: body.symptomAssessment.previousTreatments,
          currentMedications: body.symptomAssessment.currentMedications,
          additionalNotes: body.symptomAssessment.additionalNotes,
        },
      };

      const { data: assessment, error: assessmentError } = await supabase
        .from('symptom_assessments')
        .insert([assessmentData])
        .select()
        .single();

      if (assessmentError) {
        console.error('Error creating assessment:', assessmentError);
        // Don't fail the appointment creation if assessment fails
        console.warn(
          'Continuing with appointment creation despite assessment error'
        );
      } else {
        assessmentId = assessment.id;
      }
    }

    // Get fresh access token
    const accessToken = await refreshGoogleToken();

    // Create calendar event with reference to database records
    const eventSummary = `Physiotherapy - ${body.patientName}`;

    // Create event description with proper formatting
    const baseUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173';
    const appointmentDetailsUrl = `${baseUrl}/appointment/${appointment.id}`;
    const cancelAppointmentUrl = `${baseUrl}/cancel/${appointment.id}`;

    const eventDescription = `Patient: ${body.patientName}
Email: ${body.patientEmail}
Phone: ${body.patientPhone || 'Not provided'}

Appointment ID: ${appointment.id}
${assessmentId ? `Assessment ID: ${assessmentId}` : ''}
${body.notes ? `Notes: ${body.notes}` : ''}

📋 View Details: ${appointmentDetailsUrl}
❌ Cancel Appointment: ${cancelAppointmentUrl}

For questions, please contact the clinic directly.`;

    const calendarResult = await createCalendarEvent(accessToken, {
      summary: eventSummary,
      description: eventDescription,
      startTime: body.startTime,
      endTime: body.endTime,
      patientEmail: body.patientEmail,
    });

    const eventId = calendarResult.eventId;
    const meetLink = calendarResult.meetLink;

    // Update appointment with Google Calendar event ID and Meet link
    await supabase
      .from('appointments')
      .update({
        google_event_id: eventId,
        meet_link: meetLink,
      })
      .eq('id', appointment.id);

    // Prepare appointment details for response
    const appointmentDetails = {
      eventId: eventId,
      patientName: body.patientName,
      patientEmail: body.patientEmail,
      startTime: body.startTime,
      endTime: body.endTime,
      status: 'scheduled' as const,
      symptomAssessment: body.symptomAssessment || {
        painLevel: 5,
        painLocation: [],
        symptomDuration: '',
        previousTreatments: '',
        currentMedications: '',
        additionalNotes: '',
        primarySymptom: '',
        secondarySymptoms: [],
        triggerEvents: [],
        worseningFactors: [],
        relievingFactors: [],
        dailyImpact: 'moderate' as const,
      },
      meetLink: meetLink,
      createdAt: new Date().toISOString(),
    };

    const response: NewAppointmentResponse = {
      success: true,
      eventId: eventId,
      appointmentDetails: appointmentDetails,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating appointment:', error);

    // Don't expose sensitive error details in production
    let errorMessage = 'Failed to create appointment';
    let statusCode = 500;

    // Handle specific Google API errors
    if (error.message.includes('Failed to refresh Google token')) {
      errorMessage = 'Calendar authentication failed. Please contact support.';
      statusCode = 401;
    } else if (error.message.includes('Failed to create calendar event: 409')) {
      errorMessage =
        'Time slot is no longer available. Please select a different time.';
      statusCode = 409;
    } else if (error.message.includes('Failed to create calendar event: 403')) {
      errorMessage =
        'Insufficient calendar permissions. Please contact support.';
      statusCode = 403;
    } else if (error.message.includes('Failed to create calendar event')) {
      errorMessage = 'Unable to create calendar event. Please try again.';
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

    const response: NewAppointmentResponse = {
      success: false,
      error: errorMessage,
    };

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
