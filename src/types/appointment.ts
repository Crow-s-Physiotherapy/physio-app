// Appointment-related type definitions

export interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  appointmentDate: Date;
  appointmentTime: string;
  duration: number; // in minutes
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  googleEventId?: string;
  symptomAssessmentId?: string;
  meetLink?: string; // Google Meet link for remote session
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Form data types for appointment booking
export interface AppointmentFormData {
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  appointmentDate: string; // ISO date string for forms
  appointmentTime: string; // Time string for forms
  notes?: string;
}

// API response types
export interface AppointmentResponse {
  appointment: Appointment;
  success: boolean;
  message?: string;
}

export interface AppointmentsListResponse {
  appointments: Appointment[];
  total: number;
  page: number;
  limit: number;
}

// Utility types for appointment management
export type AppointmentStatus = Appointment['status'];

export interface AppointmentFilters {
  status?: AppointmentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  patientEmail?: string;
}

export interface TimeSlot {
  date: Date;
  time: string;
  available: boolean;
  duration: number;
}

export interface AvailabilityResponse {
  date: string;
  timeSlots: TimeSlot[];
}
