import { supabase } from '../lib/supabase';

export interface AppointmentDetails {
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
}

export interface GetAppointmentResponse {
  success: boolean;
  appointment?: AppointmentDetails;
  error?: string;
}

export interface CancelAppointmentResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Get appointment details by ID
 */
export const getAppointmentDetails = async (
  appointmentId: string
): Promise<AppointmentDetails> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-appointment', {
      body: { appointmentId },
    });

    if (error) {
      console.error('Error calling get-appointment function:', error);
      throw new Error(`Failed to fetch appointment: ${error.message}`);
    }

    const response = data as GetAppointmentResponse;

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch appointment');
    }

    if (!response.appointment) {
      throw new Error('Appointment not found');
    }

    return response.appointment;
  } catch (error) {
    console.error('Error fetching appointment details:', error);
    throw error;
  }
};

/**
 * Cancel an appointment
 */
export const cancelAppointment = async (
  appointmentId: string,
  reason?: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'cancel-appointment',
      {
        body: {
          appointmentId,
          reason,
        },
      }
    );

    if (error) {
      console.error('Error calling cancel-appointment function:', error);
      throw new Error(`Failed to cancel appointment: ${error.message}`);
    }

    const response = data as CancelAppointmentResponse;

    if (!response.success) {
      throw new Error(response.error || 'Failed to cancel appointment');
    }

    return response.message || 'Appointment cancelled successfully';
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw error;
  }
};

/**
 * Format appointment date and time for display
 */
export const formatAppointmentDateTime = (
  date: string,
  time: string
): string => {
  try {
    const appointmentDate = new Date(`${date}T${time}`);
    return appointmentDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return `${date} at ${time}`;
  }
};

/**
 * Check if appointment can be cancelled (not in the past and not already cancelled)
 */
export const canCancelAppointment = (
  appointment: AppointmentDetails
): boolean => {
  if (appointment.status === 'cancelled') {
    return false;
  }

  try {
    const appointmentDateTime = new Date(
      `${appointment.appointmentDate}T${appointment.appointmentTime}`
    );
    const now = new Date();
    return appointmentDateTime > now;
  } catch (error) {
    console.error('Error checking if appointment can be cancelled:', error);
    return false;
  }
};

/**
 * Get status display text and color
 */
export const getStatusDisplay = (
  status: string
): { text: string; color: string } => {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return { text: 'Scheduled', color: 'text-blue-600 bg-blue-100' };
    case 'confirmed':
      return { text: 'Confirmed', color: 'text-green-600 bg-green-100' };
    case 'cancelled':
      return { text: 'Cancelled', color: 'text-red-600 bg-red-100' };
    case 'completed':
      return { text: 'Completed', color: 'text-gray-600 bg-gray-100' };
    case 'no_show':
      return { text: 'No Show', color: 'text-orange-600 bg-orange-100' };
    default:
      return { text: status, color: 'text-gray-600 bg-gray-100' };
  }
};

export default {
  getAppointmentDetails,
  cancelAppointment,
  formatAppointmentDateTime,
  canCancelAppointment,
  getStatusDisplay,
};
