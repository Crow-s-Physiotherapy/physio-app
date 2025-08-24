/**
 * Google Calendar Integration Service
 *
 * This service handles all interactions with the Google Calendar API via Supabase Edge Functions:
 * - Creating calendar events via new-appointment Edge Function
 * - Checking calendar availability via check-availability Edge Function
 * - Error handling for Edge Function responses
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 1.1, 1.3, 1.4, 1.5
 */

import type { Appointment } from '../types/appointment';
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

// Legacy types for backward compatibility
export interface GoogleEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    name?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface GoogleCalendarTimeSlot {
  start: Date;
  end: Date;
}

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
 * Call the new-appointment Edge Function to create a calendar event
 * Requirement: 3.2, 1.3
 */
const callNewAppointmentFunction = async (
  request: NewAppointmentRequest
): Promise<NewAppointmentResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('new-appointment', {
      body: request,
    });

    if (error) {
      throw new EdgeFunctionError(
        error.message || 'Failed to call new-appointment function',
        error.status,
        'new-appointment'
      );
    }

    return data as NewAppointmentResponse;
  } catch (error) {
    console.error('Error calling new-appointment Edge Function:', error);
    if (error instanceof EdgeFunctionError) {
      throw error;
    }
    throw new EdgeFunctionError(
      'Failed to create calendar event',
      500,
      'new-appointment'
    );
  }
};

/**
 * Call the update-appointment Edge Function to update a calendar event
 * Requirement: 3.2, 1.5
 */
const callUpdateAppointmentFunction = async (
  request: UpdateAppointmentRequest
): Promise<UpdateAppointmentResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'update-appointment',
      {
        body: request,
      }
    );

    if (error) {
      throw new EdgeFunctionError(
        error.message || 'Failed to call update-appointment function',
        error.status,
        'update-appointment'
      );
    }

    return data as UpdateAppointmentResponse;
  } catch (error) {
    console.error('Error calling update-appointment Edge Function:', error);
    if (error instanceof EdgeFunctionError) {
      throw error;
    }
    throw new EdgeFunctionError(
      'Failed to update calendar event',
      500,
      'update-appointment'
    );
  }
};

/**
 * Call the cancel-appointment Edge Function to delete a calendar event
 * Requirement: 3.5, 1.6
 */
const callCancelAppointmentFunction = async (
  request: CancelAppointmentRequest
): Promise<CancelAppointmentResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'cancel-appointment',
      {
        body: request,
      }
    );

    if (error) {
      throw new EdgeFunctionError(
        error.message || 'Failed to call cancel-appointment function',
        error.status,
        'cancel-appointment'
      );
    }

    return data as CancelAppointmentResponse;
  } catch (error) {
    console.error('Error calling cancel-appointment Edge Function:', error);
    if (error instanceof EdgeFunctionError) {
      throw error;
    }
    throw new EdgeFunctionError(
      'Failed to cancel calendar event',
      500,
      'cancel-appointment'
    );
  }
};

/**
 * Call the check-availability Edge Function to check calendar availability
 * Requirement: 3.6, 1.1, 1.4
 */
const callCheckAvailabilityFunction = async (
  request: CheckAvailabilityRequest
): Promise<CheckAvailabilityResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'check-availability',
      {
        body: request,
      }
    );

    if (error) {
      throw new EdgeFunctionError(
        error.message || 'Failed to call check-availability function',
        error.status,
        'check-availability'
      );
    }

    return data as CheckAvailabilityResponse;
  } catch (error) {
    console.error('Error calling check-availability Edge Function:', error);
    if (error instanceof EdgeFunctionError) {
      throw error;
    }
    throw new EdgeFunctionError(
      'Failed to check calendar availability',
      500,
      'check-availability'
    );
  }
};

/**
 * Initialize the Google Calendar service (now using Edge Functions)
 * No longer requires client-side authentication
 * Requirement: 3.1
 */
export const initGoogleCalendarApi = async (): Promise<boolean> => {
  // Edge Functions handle authentication server-side
  // No client-side initialization needed
  return true;
};

/**
 * Check if the service is ready (always true for Edge Functions)
 * Requirement: 3.1
 */
export const isAuthenticated = (): boolean => {
  // Edge Functions handle authentication server-side
  return true;
};

/**
 * Legacy authentication function (no longer needed with Edge Functions)
 * Requirement: 3.1
 */
export const authenticateWithGoogle = async (): Promise<boolean> => {
  // Edge Functions handle authentication server-side
  return true;
};

/**
 * Get available time slots from Google Calendar via Edge Function
 * Requirement: 3.3, 1.1, 1.4
 *
 * @param startDate - The start date to check availability
 * @param endDate - The end date to check availability
 * @param duration - The duration of each appointment in minutes
 * @returns Array of available time slots
 */
export const getAvailableTimeSlots = async (
  startDate: Date,
  endDate: Date,
  duration: number = 60
): Promise<GoogleCalendarTimeSlot[]> => {
  try {
    // Check availability for the entire date range using Edge Function
    const availabilityResponse = await callCheckAvailabilityFunction({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });

    if (availabilityResponse.error) {
      throw new EdgeFunctionError(availabilityResponse.error);
    }

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

    // Filter out busy time slots using the response from Edge Function
    const busyPeriods = availabilityResponse.busyTimes || [];
    const availableTimeSlots = allTimeSlots.filter(slot => {
      return !isSlotBusy(slot, busyPeriods);
    });

    return availableTimeSlots;
  } catch (error) {
    console.error('Error getting available time slots:', error);
    handleCalendarError(error);
    return [];
  }
};

/**
 * Get appointments from Google Calendar via Edge Function
 * This function uses the check-availability Edge Function which also returns appointment details
 * Requirement: 3.9, 1.1, 1.4
 *
 * @param startDate - The start date to get appointments from
 * @param endDate - The end date to get appointments to
 * @returns Array of appointment data
 */
export const getAppointments = async (
  startDate: Date,
  endDate: Date
): Promise<AppointmentData[]> => {
  try {
    // Use check-availability Edge Function to get appointment details
    const availabilityResponse = await callCheckAvailabilityFunction({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });

    if (availabilityResponse.error) {
      throw new EdgeFunctionError(availabilityResponse.error);
    }

    // Extract appointment data from busy times
    const appointments: AppointmentData[] = [];
    const busyTimes = availabilityResponse.busyTimes || [];

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
          createdAt: busyTime.appointmentData.createdAt,
        });
      }
    }

    return appointments;
  } catch (error) {
    console.error('Error getting appointments:', error);
    handleCalendarError(error);
    return [];
  }
};

/**
 * Generate all possible time slots within working hours
 */
export const generateTimeSlots = (
  startDate: Date,
  endDate: Date,
  duration: number,
  workingHours: { startHour: number; endHour: number }
): GoogleCalendarTimeSlot[] => {
  const slots: GoogleCalendarTimeSlot[] = [];
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
 * Check if a time slot overlaps with any busy periods from Edge Function response
 * Requirement: 1.4
 */
export const isSlotBusy = (
  slot: GoogleCalendarTimeSlot,
  busyPeriods: Array<{
    start: string;
    end: string;
    eventId?: string;
    summary?: string;
    appointmentData?: any;
  }>
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
 * Check availability for a specific time slot using Edge Function
 * Requirement: 1.1, 1.4
 *
 * @param startTime - The start time to check
 * @param endTime - The end time to check
 * @returns True if the time slot is available
 */
export const checkTimeSlotAvailability = async (
  startTime: Date,
  endTime: Date
): Promise<boolean> => {
  try {
    const response = await callCheckAvailabilityFunction({
      start: startTime.toISOString(),
      end: endTime.toISOString(),
    });

    if (response.error) {
      console.error('Error checking time slot availability:', response.error);
      return false;
    }

    return response.available;
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    return false;
  }
};

/**
 * Create a calendar event for an appointment via Edge Function
 * Requirement: 3.2, 1.3
 *
 * @param appointment - The appointment to create an event for
 * @param symptomAssessment - The symptom assessment data
 * @returns The created event ID
 */
export const createCalendarEvent = async (
  appointment: Appointment,
  symptomAssessment?: SymptomAssessmentFormData
): Promise<string> => {
  try {
    // Calculate end time based on appointment duration
    const startTime = new Date(appointment.appointmentDate);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + appointment.duration);

    // Create default symptom assessment if not provided
    const defaultSymptomAssessment: SymptomAssessmentFormData = {
      patientName: appointment.patientName,
      patientEmail: appointment.patientEmail,
      painLevel: 5,
      painLocation: [],
      symptomDuration: '',
      previousTreatments: '',
      currentMedications: '',
      additionalNotes: appointment.notes || '',
      primarySymptom: '',
      secondarySymptoms: [],
      triggerEvents: [],
      worseningFactors: [],
      relievingFactors: [],
      dailyImpact: 'moderate',
    };

    // Prepare request for Edge Function
    const request: NewAppointmentRequest = {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      patientName: appointment.patientName,
      patientEmail: appointment.patientEmail,
      symptomAssessment: symptomAssessment || defaultSymptomAssessment,
    };

    // Call the Edge Function
    const response = await callNewAppointmentFunction(request);

    if (!response.success) {
      throw new EdgeFunctionError(
        response.error || 'Failed to create calendar event'
      );
    }

    if (!response.eventId) {
      throw new EdgeFunctionError('No event ID returned from calendar service');
    }

    return response.eventId;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    handleCalendarError(error);
    throw error;
  }
};

/**
 * Update a calendar event for an appointment via Edge Function
 * Requirement: 3.2, 3.3, 1.5
 *
 * @param appointment - The appointment with updated details
 * @param symptomAssessment - The updated symptom assessment data
 * @returns The updated event ID
 */
export const updateCalendarEvent = async (
  appointment: Appointment,
  symptomAssessment?: SymptomAssessmentFormData
): Promise<string> => {
  try {
    if (!appointment.googleEventId) {
      throw new Error('No Google Calendar event ID provided');
    }

    // Calculate end time based on appointment duration
    const startTime = new Date(appointment.appointmentDate);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + appointment.duration);

    // Prepare request for Edge Function
    const request: UpdateAppointmentRequest = {
      eventId: appointment.googleEventId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      patientName: appointment.patientName,
      patientEmail: appointment.patientEmail,
      symptomAssessment: symptomAssessment!,
    };

    // Call the Edge Function
    const response = await callUpdateAppointmentFunction(request);

    if (!response.success) {
      throw new EdgeFunctionError(
        response.error || 'Failed to update calendar event'
      );
    }

    // Return the same event ID since we're updating, not creating
    return appointment.googleEventId;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    handleCalendarError(error);
    throw error;
  }
};

/**
 * Delete a calendar event for an appointment via Edge Function
 * Requirement: 3.5, 1.6
 *
 * @param eventId - The Google Calendar event ID to delete
 * @returns True if successful, false otherwise
 */
export const deleteCalendarEvent = async (
  eventId: string
): Promise<boolean> => {
  try {
    if (!eventId || eventId.trim().length === 0) {
      throw new Error('Invalid event ID provided');
    }

    // Prepare request for Edge Function
    const request: CancelAppointmentRequest = {
      eventId: eventId.trim(),
    };

    // Call the Edge Function
    const response = await callCancelAppointmentFunction(request);

    if (!response.success) {
      throw new EdgeFunctionError(
        response.error || 'Failed to delete calendar event'
      );
    }

    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    handleCalendarError(error);
    return false;
  }
};

/**
 * Sync appointments with Google Calendar using Edge Functions
 * This function ensures that all appointments are properly synced with Google Calendar
 * Requirement: 3.3, 1.3, 1.5
 *
 * @param appointments - The appointments to sync
 * @param symptomAssessments - Optional symptom assessments for each appointment
 * @returns Object with success status and results
 */
export const syncAppointmentsWithCalendar = async (
  appointments: Appointment[],
  symptomAssessments?: Record<string, SymptomAssessmentFormData>
): Promise<{ success: boolean; results: Record<string, string | null> }> => {
  try {
    const results: Record<string, string | null> = {};

    // Process each appointment
    for (const appointment of appointments) {
      try {
        // Skip cancelled appointments
        if (appointment.status === 'cancelled') {
          // If it has a Google event ID, delete it
          if (appointment.googleEventId) {
            await deleteCalendarEvent(appointment.googleEventId);
            results[appointment.id] = null;
          }
          continue;
        }

        // Get symptom assessment for this appointment
        const symptomAssessment = symptomAssessments?.[appointment.id];

        // Update or create event
        if (appointment.googleEventId) {
          // Update existing event
          const eventId = await updateCalendarEvent(
            appointment,
            symptomAssessment
          );
          results[appointment.id] = eventId;
        } else {
          // Create new event
          const eventId = await createCalendarEvent(
            appointment,
            symptomAssessment
          );
          results[appointment.id] = eventId;
        }
      } catch (appointmentError) {
        console.error(
          `Error syncing appointment ${appointment.id}:`,
          appointmentError
        );
        results[appointment.id] = null;
      }
    }

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error('Error syncing appointments with calendar:', error);
    handleCalendarError(error);
    return {
      success: false,
      results: {},
    };
  }
};

/**
 * Get events from Google Calendar via Edge Function
 * Uses the check-availability Edge Function which returns appointment details
 * Requirement: 3.3, 3.9
 *
 * @param startDate - The start date to get events from
 * @param endDate - The end date to get events to
 * @returns Array of Google Calendar events
 */
export const getCalendarEvents = async (
  startDate: Date,
  endDate: Date
): Promise<GoogleEvent[]> => {
  try {
    // Get appointments using the check-availability Edge Function
    const appointments = await getAppointments(startDate, endDate);

    // Convert appointment data to GoogleEvent format
    const events: GoogleEvent[] = appointments.map(appointment => ({
      id: appointment.eventId,
      summary: `Physiotherapy Appointment - ${appointment.patientName}`,
      description: `Patient: ${appointment.patientName}\nEmail: ${appointment.patientEmail}\nSymptom Assessment: ${JSON.stringify(appointment.symptomAssessment, null, 2)}`,
      start: {
        dateTime: appointment.startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: appointment.endTime,
        timeZone: 'UTC',
      },
      attendees: [
        {
          email: appointment.patientEmail,
          name: appointment.patientName,
        },
      ],
    }));

    return events;
  } catch (error) {
    console.error('Error getting calendar events:', error);
    handleCalendarError(error);
    return [];
  }
};

/**
 * Handle calendar API errors from Edge Functions
 * Requirement: 3.4, 1.4, 1.5
 *
 * @param error - The error to handle
 */
export const handleCalendarError = (error: any): void => {
  // Handle Edge Function specific errors
  if (error instanceof EdgeFunctionError) {
    // Re-throw Edge Function errors as they already have proper messages
    throw error;
  }

  // Handle Supabase function invocation errors
  if (error.message?.includes('Failed to call')) {
    throw new Error(
      'Calendar service is temporarily unavailable. Please try again later.'
    );
  }

  // Check for specific HTTP status codes from Edge Functions
  if (error.status === 401) {
    throw new Error('Calendar authentication failed. Please contact support.');
  } else if (error.status === 403) {
    throw new Error(
      'Insufficient calendar permissions. Please contact support.'
    );
  } else if (error.status === 404) {
    throw new Error('Calendar service not found. Please contact support.');
  } else if (error.status === 409) {
    throw new Error(
      'Calendar conflict detected. The time slot may no longer be available.'
    );
  } else if (error.status === 429) {
    throw new Error('Too many requests. Please wait a moment and try again.');
  } else if (error.status >= 500) {
    throw new Error('Calendar service error. Please try again later.');
  } else {
    // Generic error
    throw new Error(
      `Calendar operation failed: ${error.message || 'Unknown error'}`
    );
  }
};

export default {
  initGoogleCalendarApi,
  authenticateWithGoogle,
  isAuthenticated,
  getAvailableTimeSlots,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  syncAppointmentsWithCalendar,
  getCalendarEvents,
  getAppointments,
  handleCalendarError,
  checkTimeSlotAvailability,
};
