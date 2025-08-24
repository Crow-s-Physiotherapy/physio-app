import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface GetAppointmentRequest {
  appointmentId: string;
}

interface GetAppointmentResponse {
  success: boolean;
  appointment?: {
    id: string;
    patientName: string;
    patientEmail: string;
    patientPhone?: string;
    appointmentDate: string;
    appointmentTime: string;
    duration: number;
    status: string;
    notes?: string;
    googleEventId?: string;
    createdAt: string;
    symptomAssessment?: {
      id: string;
      painLevel: number;
      primarySymptom?: string;
      painLocations?: string[];
      symptomDuration?: string;
      dailyImpact?: string;
      previousTreatments?: string;
      currentMedications?: string;
      additionalNotes?: string;
      symptoms: any;
    };
  };
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

    if (req.method === 'GET') {
      // Extract appointment ID from URL path
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      appointmentId = pathParts[pathParts.length - 1];
    } else if (req.method === 'POST') {
      // Extract appointment ID from request body
      const body: GetAppointmentRequest = await req.json();
      appointmentId = body.appointmentId;
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

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (appointmentError) {
      console.error('Error fetching appointment:', appointmentError);

      if (appointmentError.code === 'PGRST116') {
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

      throw new Error(
        `Failed to fetch appointment: ${appointmentError.message}`
      );
    }

    // Get associated symptom assessment if it exists
    // First try to find by appointment_id (proper relationship)
    let assessment = null;
    let assessmentError = null;

    const { data: assessmentByAppointment, error: appointmentLinkError } =
      await supabase
        .from('symptom_assessments')
        .select('*')
        .eq('appointment_id', appointment.id)
        .maybeSingle();

    if (appointmentLinkError && appointmentLinkError.code !== 'PGRST116') {
      console.warn(
        'Error fetching symptom assessment by appointment_id:',
        appointmentLinkError
      );
    }

    if (assessmentByAppointment) {
      assessment = assessmentByAppointment;
    } else {
      // Fallback: try to find by patient email and date (for older records)
      const { data: assessmentByPatient, error: patientLinkError } =
        await supabase
          .from('symptom_assessments')
          .select('*')
          .eq('patient_email', appointment.patient_email)
          .eq('assessment_date', appointment.appointment_date)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

      if (patientLinkError && patientLinkError.code !== 'PGRST116') {
        console.warn(
          'Error fetching symptom assessment by patient:',
          patientLinkError
        );
        assessmentError = patientLinkError;
      } else {
        assessment = assessmentByPatient;
      }
    }

    if (assessmentError) {
      console.warn('Error fetching symptom assessment:', assessmentError);
      // Don't fail the request if assessment fetch fails
    }

    // Format the response
    const response: GetAppointmentResponse = {
      success: true,
      appointment: {
        id: appointment.id,
        patientName: appointment.patient_name,
        patientEmail: appointment.patient_email,
        patientPhone: appointment.patient_phone,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        duration: appointment.duration,
        status: appointment.status,
        notes: appointment.notes,
        googleEventId: appointment.google_event_id,
        createdAt: appointment.created_at,
        symptomAssessment: assessment
          ? {
              id: assessment.id,
              painLevel: assessment.pain_level,
              primarySymptom: assessment.primary_symptom,
              painLocations: assessment.pain_locations,
              symptomDuration: assessment.symptom_duration,
              dailyImpact: assessment.daily_impact,
              previousTreatments: assessment.previous_treatments,
              currentMedications: assessment.current_medications,
              additionalNotes: assessment.additional_notes,
              symptoms: assessment.symptoms,
            }
          : undefined,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-appointment function:', error);

    const response: GetAppointmentResponse = {
      success: false,
      error: 'Failed to fetch appointment details',
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
