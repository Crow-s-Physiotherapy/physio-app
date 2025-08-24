/**
 * Appointment Edge Service
 *
 * This service handles appointment operations using Supabase Edge Functions:
 * - Creating appointments with symptom assessment data via new-appointment Edge Function
 * - Checking availability and retrieving appointments via check-availability Edge Function
 * - Updating appointments via update-appointment Edge Function
 * - Cancelling appointments via cancel-appointment Edge Function
 *
 * Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 2.4, 3.2, 3.8, 3.9
 */

import { supabase } from '../lib/supabase';
import type {
  NewAppointmentRequest,
  NewAppointmentResponse,
  CheckAvailabilityRequest,
  CheckAvailabilityResponse,
  UpdateAppointmentRequest,
  UpdateAppointmentResponse,
  CancelAppointmentRequest,
  CancelAppointmentResponse,
  AppointmentData,
} from '../types/edgeFunctions';
import type { SymptomAssessmentFormData } from '../types/assessment';
import type {
  Appointment,
  AppointmentFormData,
  TimeSlot,
} from '../types/appointment';

// Edge Function error handling
export class EdgeFunctionError extends Error {
  constructor(
    message: string,
    public status?: number,
    public functionName?: string
  ) {
    super(message);
    this.name = 'EdgeFunctionError';
  }
}

/**
 * Create a new appointment using the new-appointment Edge Function
 * Requirement: 1.3, 2.4, 3.2, 3.8
 */
export const createAppointmentWithEdgeFunction = async (
  formData: AppointmentFormData,
  symptomAssessment: SymptomAssessmentFormData,
  duration: number = 60
): Promise<AppointmentData> => {
  console.log(
    '⚡ appointmentEdgeService.createAppointmentWithEdgeFunction called'
  );
  try {
    // Calculate end time based on appointment duration
    const startTime = new Date(
      `${formData.appointmentDate}T${formData.appointmentTime}`
    );
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    // Prepare request for Edge Function
    const request: NewAppointmentRequest = {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      patientName: formData.patientName,
      patientEmail: formData.patientEmail,
      symptomAssessment: symptomAssessment,
    };

    // Call the Edge Function
    console.log('🚀 Invoking new-appointment Edge Function...');
    const { data, error } = await supabase.functions.invoke('new-appointment', {
      body: request,
    });

    if (error) {
      throw new EdgeFunctionError(
        error.message || 'Failed to create appointment',
        error.status,
        'new-appointment'
      );
    }

    const response = data as NewAppointmentResponse;

    if (!response.success) {
      throw new EdgeFunctionError(
        response.error || 'Failed to create appointment'
      );
    }

    if (!response.eventId || !response.appointmentDetails) {
      throw new EdgeFunctionError(
        'Incomplete response from appointment service'
      );
    }

    return response.appointmentDetails;
  } catch (error) {
    console.error('Error creating appointment with Edge Function:', error);
    if (error instanceof EdgeFunctionError) {
      throw error;
    }
    throw new EdgeFunctionError(
      'Failed to create appointment',
      500,
      'new-appointment'
    );
  }
};

/**
 * Check availability and get appointments using the check-availability Edge Function
 * Requirement: 1.1, 1.4, 3.6, 3.9
 */
export const checkAvailabilityWithEdgeFunction = async (
  startDate: Date,
  endDate: Date
): Promise<{
  available: boolean;
  appointments: AppointmentData[];
  busyTimes: Array<{
    start: string;
    end: string;
    eventId?: string;
    summary?: string;
  }>;
}> => {
  try {
    // Prepare request for Edge Function
    const request: CheckAvailabilityRequest = {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke(
      'check-availability',
      {
        body: request,
      }
    );

    if (error) {
      throw new EdgeFunctionError(
        error.message || 'Failed to check availability',
        error.status,
        'check-availability'
      );
    }

    const response = data as CheckAvailabilityResponse;

    if (response.error) {
      throw new EdgeFunctionError(response.error);
    }

    // Extract appointment data from busy times
    const appointments: AppointmentData[] = [];
    const busyTimes = response.busyTimes || [];

    for (const busyTime of busyTimes) {
      if (busyTime.eventId && busyTime.appointmentData) {
        appointments.push({
          eventId: busyTime.eventId,
          patientName: busyTime.appointmentData.patientName,
          patientEmail: busyTime.appointmentData.patientEmail,
          startTime: busyTime.start,
          endTime: busyTime.end,
          status: busyTime.appointmentData.status,
          symptomAssessment: busyTime.appointmentData.symptomAssessment,
          meetLink: busyTime.appointmentData.meetLink || '',
          createdAt: busyTime.appointmentData.createdAt,
        });
      }
    }

    return {
      available: response.available,
      appointments,
      busyTimes: busyTimes.map(bt => ({
        start: bt.start,
        end: bt.end,
        ...(bt.eventId && { eventId: bt.eventId }),
        ...(bt.summary && { summary: bt.summary }),
      })),
    };
  } catch (error) {
    console.error('Error checking availability with Edge Function:', error);
    if (error instanceof EdgeFunctionError) {
      throw error;
    }
    throw new EdgeFunctionError(
      'Failed to check availability',
      500,
      'check-availability'
    );
  }
};

/**
 * Update an appointment using the update-appointment Edge Function
 * Requirement: 1.5, 3.2
 */
export const updateAppointmentWithEdgeFunction = async (
  eventId: string,
  formData: AppointmentFormData,
  symptomAssessment?: SymptomAssessmentFormData,
  duration: number = 60
): Promise<AppointmentData> => {
  try {
    // Calculate end time based on appointment duration
    const startTime = new Date(
      `${formData.appointmentDate}T${formData.appointmentTime}`
    );
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    // Prepare request for Edge Function
    const request: UpdateAppointmentRequest = {
      eventId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      patientName: formData.patientName,
      patientEmail: formData.patientEmail,
      symptomAssessment: symptomAssessment!,
    };

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke(
      'update-appointment',
      {
        body: request,
      }
    );

    if (error) {
      throw new EdgeFunctionError(
        error.message || 'Failed to update appointment',
        error.status,
        'update-appointment'
      );
    }

    const response = data as UpdateAppointmentResponse;

    if (!response.success) {
      throw new EdgeFunctionError(
        response.error || 'Failed to update appointment'
      );
    }

    if (!response.appointmentDetails) {
      throw new EdgeFunctionError(
        'Incomplete response from appointment service'
      );
    }

    return response.appointmentDetails;
  } catch (error) {
    console.error('Error updating appointment with Edge Function:', error);
    if (error instanceof EdgeFunctionError) {
      throw error;
    }
    throw new EdgeFunctionError(
      'Failed to update appointment',
      500,
      'update-appointment'
    );
  }
};

/**
 * Cancel an appointment using the cancel-appointment Edge Function
 * Requirement: 1.6, 3.5
 */
export const cancelAppointmentWithEdgeFunction = async (
  eventId: string
): Promise<boolean> => {
  try {
    // Prepare request for Edge Function
    const request: CancelAppointmentRequest = {
      eventId,
    };

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke(
      'cancel-appointment',
      {
        body: request,
      }
    );

    if (error) {
      throw new EdgeFunctionError(
        error.message || 'Failed to cancel appointment',
        error.status,
        'cancel-appointment'
      );
    }

    const response = data as CancelAppointmentResponse;

    if (!response.success) {
      throw new EdgeFunctionError(
        response.error || 'Failed to cancel appointment'
      );
    }

    return true;
  } catch (error) {
    console.error('Error cancelling appointment with Edge Function:', error);
    if (error instanceof EdgeFunctionError) {
      throw error;
    }
    throw new EdgeFunctionError(
      'Failed to cancel appointment',
      500,
      'cancel-appointment'
    );
  }
};

/**
 * Get available time slots using Edge Functions
 * Requirement: 1.1, 1.4
 */
export const getAvailableTimeSlotsWithEdgeFunction = async (
  startDate: Date,
  endDate: Date,
  duration: number = 60
): Promise<TimeSlot[]> => {
  try {
    // Get availability data from Edge Function
    const availabilityData = await checkAvailabilityWithEdgeFunction(
      startDate,
      endDate
    );

    // Get working hours (9 AM to 5 PM by default)
    const workingHours = {
      startHour: 9,
      endHour: 17,
    };

    // Generate all possible time slots within working hours
    const allTimeSlots = generateTimeSlots(
      startDate,
      endDate,
      duration,
      workingHours
    );

    // Filter out busy time slots
    const availableTimeSlots = allTimeSlots.filter(slot => {
      return !isSlotBusy(slot, availabilityData.busyTimes);
    });

    // Convert to TimeSlot format
    return availableTimeSlots.map(slot => ({
      date: slot.start,
      time: slot.start.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      available: true,
      duration,
    }));
  } catch (error) {
    console.error(
      'Error getting available time slots with Edge Function:',
      error
    );
    throw new Error(
      'Failed to retrieve available time slots. Please try again.'
    );
  }
};

/**
 * Generate all possible time slots within working hours
 */
const generateTimeSlots = (
  startDate: Date,
  endDate: Date,
  duration: number,
  workingHours: { startHour: number; endHour: number }
): Array<{ start: Date; end: Date }> => {
  const slots: Array<{ start: Date; end: Date }> = [];
  const currentDate = new Date(startDate);

  // Set to the start of the day
  currentDate.setHours(0, 0, 0, 0);

  // Loop through each day
  while (currentDate <= endDate) {
    // Skip weekends (0 = Sunday, 6 = Saturday)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Start at the working hours start time
      const dayStart = new Date(currentDate);
      dayStart.setHours(workingHours.startHour, 0, 0, 0);

      // End at the working hours end time
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(workingHours.endHour, 0, 0, 0);

      // Generate slots for the day
      const slotStart = new Date(dayStart);

      while (slotStart < dayEnd) {
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotStart.getMinutes() + duration);

        // Only add the slot if it ends before or at the working day end
        if (slotEnd <= dayEnd) {
          slots.push({
            start: new Date(slotStart),
            end: new Date(slotEnd),
          });
        }

        // Move to the next slot
        slotStart.setMinutes(slotStart.getMinutes() + duration);
      }
    }

    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
};

/**
 * Check if a time slot overlaps with any busy periods
 */
const isSlotBusy = (
  slot: { start: Date; end: Date },
  busyPeriods: Array<{ start: string; end: string }>
): boolean => {
  if (!busyPeriods || busyPeriods.length === 0) {
    return false;
  }

  return busyPeriods.some(busyPeriod => {
    const busyStart = new Date(busyPeriod.start);
    const busyEnd = new Date(busyPeriod.end);

    // Check for overlap
    return (
      (slot.start >= busyStart && slot.start < busyEnd) || // Slot start is within busy period
      (slot.end > busyStart && slot.end <= busyEnd) || // Slot end is within busy period
      (slot.start <= busyStart && slot.end >= busyEnd) // Slot completely contains busy period
    );
  });
};

/**
 * Convert AppointmentData to Appointment type for compatibility
 */
export const convertAppointmentDataToAppointment = (
  appointmentData: AppointmentData,
  id?: string
): Appointment => {
  const appointment: Appointment = {
    id: id || appointmentData.eventId,
    patientName: appointmentData.patientName,
    patientEmail: appointmentData.patientEmail,
    patientPhone: '', // Not stored in Google Calendar
    appointmentDate: new Date(appointmentData.startTime),
    appointmentTime: new Date(appointmentData.startTime).toTimeString().split(' ')[0] || '00:00:00',
    duration: Math.round(
      (new Date(appointmentData.endTime).getTime() -
        new Date(appointmentData.startTime).getTime()) /
        (1000 * 60)
    ),
    status: appointmentData.status,
    googleEventId: appointmentData.eventId,
    notes: appointmentData.symptomAssessment.additionalNotes,
    createdAt: new Date(appointmentData.createdAt),
    updatedAt: new Date(), // Not tracked in Google Calendar
  };

  if (appointmentData.meetLink) {
    appointment.meetLink = appointmentData.meetLink;
  }

  return appointment;
};

export default {
  createAppointmentWithEdgeFunction,
  checkAvailabilityWithEdgeFunction,
  updateAppointmentWithEdgeFunction,
  cancelAppointmentWithEdgeFunction,
  getAvailableTimeSlotsWithEdgeFunction,
  convertAppointmentDataToAppointment,
};
