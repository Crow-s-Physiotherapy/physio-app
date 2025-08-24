/**
 * TypeScript interfaces for Supabase Edge Functions
 * These types match the interfaces defined in supabase/functions/_shared/types.ts
 * Updated to include symptom assessment data and appointment details
 */

import type { SymptomAssessmentFormData } from './assessment';

// Request/Response types for new-appointment Edge Function
export interface NewAppointmentRequest {
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
  patientName: string;
  patientEmail: string;
  symptomAssessment: SymptomAssessmentFormData;
}

export interface NewAppointmentResponse {
  success: boolean;
  eventId?: string;
  appointmentDetails?: AppointmentData;
  error?: string;
}

// Request/Response types for check-availability Edge Function (also returns appointment details)
export interface CheckAvailabilityRequest {
  start: string; // ISO 8601 format
  end: string; // ISO 8601 format
}

export interface CheckAvailabilityResponse {
  available: boolean;
  busyTimes?: Array<{
    start: string;
    end: string;
    eventId?: string; // Google Calendar event ID
    summary?: string; // Event title
    appointmentData?: AppointmentMetadata; // Parsed from event description
  }>;
  error?: string;
}

// Request/Response types for update-appointment Edge Function
export interface UpdateAppointmentRequest {
  eventId: string;
  startTime?: string;
  endTime?: string;
  patientName?: string;
  patientEmail?: string;
  symptomAssessment?: SymptomAssessmentFormData;
}

export interface UpdateAppointmentResponse {
  success: boolean;
  appointmentDetails?: AppointmentData;
  error?: string;
}

// Request/Response types for cancel-appointment Edge Function
export interface CancelAppointmentRequest {
  eventId: string;
}

export interface CancelAppointmentResponse {
  success: boolean;
  error?: string;
}

// Appointment data structures
export interface AppointmentData {
  eventId: string; // Google Calendar event ID
  patientName: string;
  patientEmail: string;
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
  status: 'scheduled' | 'completed' | 'cancelled';
  symptomAssessment: SymptomAssessmentFormData;
  meetLink?: string; // Google Meet link for remote session
  createdAt: string; // ISO 8601 format
}

// Metadata stored in Google Calendar event description as JSON
export interface AppointmentMetadata {
  patientName: string;
  patientEmail: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  symptomAssessment: SymptomAssessmentFormData;
  meetLink?: string; // Google Meet link for remote session
  createdAt: string; // ISO 8601 format
  bookingSource: 'web-platform';
}

// Error types for Edge Function handling
export interface EdgeFunctionError {
  message: string;
  status?: number;
  functionName?: string;
}
