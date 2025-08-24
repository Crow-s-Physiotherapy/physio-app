/**
 * Appointment Service
 *
 * This service handles all appointment-related operations including:
 * - Creating appointments with database operations
 * - Checking availability with Google Calendar integration
 * - Validating appointments to prevent double-booking
 * - Updating and cancelling appointments
 * - Email notifications for booking confirmations
 *
 * Requirements: 1.1, 1.3, 1.4, 1.5, 1.6
 */

// Services
import * as appointmentEdgeService from './appointmentEdgeService';
import { AppError } from '../utils/errorHandling';
import type {
  Appointment,
  AppointmentFormData,
  TimeSlot,
} from '../types/appointment';
import type { SymptomAssessmentFormData } from '../types/assessment';
// Note: Database types removed as appointments are now managed via Edge Functions

export interface CreateAppointmentRequest {
  userId: string; // Kept for backward compatibility
  formData: AppointmentFormData;
  symptomAssessment: SymptomAssessmentFormData;
  duration?: number;
}

export interface UpdateAppointmentRequest {
  appointmentId: string; // Legacy - use eventId with Edge Functions
  updates: Partial<AppointmentFormData>;
  symptomAssessment?: SymptomAssessmentFormData;
  userId: string; // Legacy - not used in Edge Functions
}

export interface AvailabilityRequest {
  startDate: Date;
  endDate: Date;
  duration?: number;
  excludeAppointmentId?: string;
}

export interface AppointmentValidationResult {
  isValid: boolean;
  errors: string[];
  conflicts?: Appointment[];
}

/**
 * Create a new appointment with full validation and calendar integration
 * This is a legacy function - use createAppointmentWithEdgeFunction for new implementations
 * Requirement: 1.1, 1.3, 1.4
 * @deprecated Use createAppointmentWithEdgeFunction instead
 */
export const createAppointment = async (
  request: CreateAppointmentRequest
): Promise<Appointment> => {
  const { formData, symptomAssessment, duration = 60 } = request;

  // Redirect to Edge Function implementation
  return await createAppointmentWithEdgeFunction(
    formData,
    symptomAssessment,
    duration
  );
};

/**
 * Create a new appointment using Edge Functions (bypassing local database)
 * This is the preferred method for new appointments as it stores data directly in Google Calendar
 * Requirement: 1.1, 1.3, 2.4, 3.2, 3.8
 */
export const createAppointmentWithEdgeFunction = async (
  formData: AppointmentFormData,
  symptomAssessment: SymptomAssessmentFormData,
  duration: number = 60
): Promise<Appointment> => {
  console.log('🔧 appointmentService.createAppointmentWithEdgeFunction called');
  try {
    // Step 1: Validate the appointment data
    const validation = await validateAppointmentData(formData, duration);
    if (!validation.isValid) {
      throw new AppError(
        `Appointment validation failed: ${validation.errors.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      );
    }

    // Step 2: Create appointment using Edge Function
    console.log('🌐 Calling Edge Function...');
    const appointmentData =
      await appointmentEdgeService.createAppointmentWithEdgeFunction(
        formData,
        symptomAssessment,
        duration
      );
    console.log('🌐 Edge Function completed successfully');

    // Step 3: Convert to Appointment type
    const appointment =
      appointmentEdgeService.convertAppointmentDataToAppointment(
        appointmentData
      );

    return appointment;
  } catch (error) {
    console.error('Error creating appointment with Edge Function:', error);

    // Convert to AppError if it's not already
    if (error instanceof AppError) {
      throw error;
    }

    // Handle specific error types
    if (error instanceof Error) {
      if (
        error.message.includes('conflict') ||
        error.message.includes('unavailable')
      ) {
        throw new AppError(
          'This time slot is no longer available. Please select a different time.',
          409,
          'CALENDAR_CONFLICT'
        );
      }

      if (
        error.message.includes('calendar') ||
        error.message.includes('Calendar')
      ) {
        throw new AppError(
          'Unable to access calendar. Please try again.',
          503,
          'CALENDAR_ERROR'
        );
      }
    }

    throw new AppError(
      'Failed to create appointment. Please try again.',
      500,
      'APPOINTMENT_CREATION_ERROR'
    );
  }
};

/**
 * Update an existing appointment
 * This is a legacy function - use updateAppointmentWithEdgeFunction for new implementations
 * Requirement: 1.5
 * @deprecated Use updateAppointmentWithEdgeFunction instead
 */
export const updateAppointment = async (
  request: UpdateAppointmentRequest
): Promise<Appointment> => {
  // For Edge Function implementation, we need the eventId instead of appointmentId
  // This is a compatibility layer - in practice, callers should use the Edge Function directly
  console.log('updateAppointment called with request:', request);
  throw new Error(
    'updateAppointment is deprecated. Use updateAppointmentWithEdgeFunction with eventId instead.'
  );
};

/**
 * Update an appointment using Edge Functions
 * Requirement: 1.5, 3.2
 */
export const updateAppointmentWithEdgeFunction = async (
  eventId: string,
  formData: AppointmentFormData,
  symptomAssessment?: SymptomAssessmentFormData,
  duration: number = 60
): Promise<Appointment> => {
  try {
    // Step 1: Validate the appointment data
    const validation = await validateAppointmentData(formData, duration);
    if (!validation.isValid) {
      throw new Error(
        `Appointment validation failed: ${validation.errors.join(', ')}`
      );
    }

    // Step 2: Update appointment using Edge Function
    const appointmentData =
      await appointmentEdgeService.updateAppointmentWithEdgeFunction(
        eventId,
        formData,
        symptomAssessment,
        duration
      );

    // Step 3: Convert to Appointment type
    const appointment =
      appointmentEdgeService.convertAppointmentDataToAppointment(
        appointmentData
      );

    return appointment;
  } catch (error) {
    console.error('Error updating appointment with Edge Function:', error);
    throw error;
  }
};

/**
 * Cancel an appointment using Edge Functions
 * Requirement: 1.6, 3.5
 */
export const cancelAppointmentWithEdgeFunction = async (
  eventId: string
): Promise<void> => {
  try {
    // Step 1: Cancel appointment using Edge Function
    await appointmentEdgeService.cancelAppointmentWithEdgeFunction(eventId);
  } catch (error) {
    console.error('Error cancelling appointment with Edge Function:', error);
    throw error;
  }
};

/**
 * Get appointments using Edge Functions
 * Requirement: 1.1, 3.9
 */
export const getAppointmentsWithEdgeFunction = async (
  startDate: Date,
  endDate: Date
): Promise<Appointment[]> => {
  try {
    const availabilityData =
      await appointmentEdgeService.checkAvailabilityWithEdgeFunction(
        startDate,
        endDate
      );

    return availabilityData.appointments.map(appointmentData =>
      appointmentEdgeService.convertAppointmentDataToAppointment(
        appointmentData
      )
    );
  } catch (error) {
    console.error('Error getting appointments with Edge Function:', error);
    throw new Error('Failed to retrieve appointments. Please try again.');
  }
};

/**
 * Cancel an appointment
 * This is a legacy function - use cancelAppointmentWithEdgeFunction for new implementations
 * Requirement: 1.5
 * @deprecated Use cancelAppointmentWithEdgeFunction instead
 */
export const cancelAppointment = async (
  appointmentId: string,
  userId: string
): Promise<void> => {
  // For Edge Function implementation, we need the eventId instead of appointmentId
  // This is a compatibility layer - in practice, callers should use the Edge Function directly
  console.log(
    'cancelAppointment called with appointmentId:',
    appointmentId,
    'userId:',
    userId
  );
  throw new Error(
    'cancelAppointment is deprecated. Use cancelAppointmentWithEdgeFunction with eventId instead.'
  );
};

/**
 * Get available time slots for appointment booking using Edge Functions
 * Requirement: 1.3, 1.4
 */
export const getAvailableTimeSlots = async (
  request: AvailabilityRequest
): Promise<TimeSlot[]> => {
  const { startDate, endDate, duration = 60 } = request;

  try {
    // Use the Edge Function service to get available time slots
    return await appointmentEdgeService.getAvailableTimeSlotsWithEdgeFunction(
      startDate,
      endDate,
      duration
    );
  } catch (error) {
    console.error('Error getting available time slots:', error);
    throw new Error(
      'Failed to retrieve available time slots. Please try again.'
    );
  }
};

/**
 * Validate appointment data
 * Requirement: 1.4
 */
export const validateAppointmentData = async (
  formData: AppointmentFormData,
  duration: number = 60
): Promise<AppointmentValidationResult> => {
  const errors: string[] = [];

  // Basic field validation
  if (!formData.patientName?.trim()) {
    errors.push('Patient name is required');
  }

  if (!formData.patientEmail?.trim()) {
    errors.push('Patient email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.patientEmail)) {
    errors.push('Please enter a valid email address');
  }

  if (!formData.appointmentDate) {
    errors.push('Appointment date is required');
  }

  if (!formData.appointmentTime) {
    errors.push('Appointment time is required');
  }

  // Date and time validation
  if (formData.appointmentDate && formData.appointmentTime) {
    const appointmentDateTime = new Date(
      `${formData.appointmentDate}T${formData.appointmentTime}`
    );
    const now = new Date();

    if (appointmentDateTime <= now) {
      errors.push('Appointment must be scheduled for a future date and time');
    }

    // Check if it's within business hours (9 AM to 5 PM, Monday to Friday)
    const dayOfWeek = appointmentDateTime.getDay();
    const hour = appointmentDateTime.getHours();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      errors.push('Appointments can only be scheduled on weekdays');
    }

    if (hour < 9 || hour >= 17) {
      errors.push(
        'Appointments can only be scheduled between 9:00 AM and 5:00 PM'
      );
    }

    // Check if appointment end time is within business hours
    const endTime = new Date(
      appointmentDateTime.getTime() + duration * 60 * 1000
    );
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();

    if (endHour > 17 || (endHour === 17 && endMinute > 0)) {
      errors.push(
        `Appointment duration (${duration} minutes) extends beyond business hours`
      );
    }
  }

  // Duration validation
  if (duration < 15 || duration > 180) {
    errors.push('Appointment duration must be between 15 and 180 minutes');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get appointments for a user with optional filtering
 * This is a legacy function - use getAppointmentsWithEdgeFunction for new implementations
 * Requirement: 1.1
 * @deprecated Use getAppointmentsWithEdgeFunction instead
 */
export const getUserAppointments = async (
  filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<Appointment[]> => {
  // Redirect to Edge Function implementation
  const startDate = filters?.startDate || new Date();
  const endDate =
    filters?.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

  let appointments = await getAppointmentsWithEdgeFunction(startDate, endDate);

  // Filter by status if provided
  if (filters?.status) {
    appointments = appointments.filter(apt => apt.status === filters.status);
  }

  return appointments;
};

// Note: convertDbAppointmentToAppointment function removed as appointments are now managed via Edge Functions

export default {
  createAppointmentWithEdgeFunction,
  updateAppointmentWithEdgeFunction,
  cancelAppointmentWithEdgeFunction,
  getAvailableTimeSlots,
  getAppointmentsWithEdgeFunction,
  validateAppointmentData,
};
