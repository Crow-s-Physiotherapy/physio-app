// Shared types for Edge Functions

export interface SymptomAssessmentData {
  painLevel: number;
  painLocation: string[];
  symptomDuration: string;
  previousTreatments: string;
  currentMedications: string;
  additionalNotes: string;
  primarySymptom: string;
  secondarySymptoms?: string[];
  onsetDate?: string;
  triggerEvents?: string[];
  worseningFactors?: string[];
  relievingFactors?: string[];
  dailyImpact: 'minimal' | 'moderate' | 'significant' | 'severe';
}

export interface NewAppointmentRequest {
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  notes?: string;
  symptomAssessment?: SymptomAssessmentData;
}

export interface NewAppointmentResponse {
  success: boolean;
  eventId?: string;
  appointmentDetails?: AppointmentData;
  error?: string;
}

export interface AppointmentData {
  eventId: string;
  patientName: string;
  patientEmail: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  symptomAssessment: SymptomAssessmentData;
  meetLink?: string; // Google Meet link for remote session
  createdAt: string;
}

export interface CheckAvailabilityRequest {
  start: string; // ISO 8601 format
  end: string; // ISO 8601 format
}

export interface CheckAvailabilityResponse {
  available: boolean;
  busyTimes?: Array<{
    start: string;
    end: string;
    eventId?: string;
    summary?: string;
    appointmentId?: string;
  }>;
  error?: string;
}

export interface UpdateAppointmentRequest {
  appointmentId: string;
  eventId?: string;
  startTime?: string;
  endTime?: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  notes?: string;
  symptomAssessment?: SymptomAssessmentData;
}

export interface UpdateAppointmentResponse {
  success: boolean;
  appointmentId?: string;
  eventId?: string;
  error?: string;
}

export interface CancelAppointmentRequest {
  appointmentId: string;
  eventId?: string;
}

export interface CancelAppointmentResponse {
  success: boolean;
  error?: string;
}

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    displayName?: string;
  }>;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: 'hangoutsMeet';
      };
    };
  };
  hangoutLink?: string; // Generated Google Meet link
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}
