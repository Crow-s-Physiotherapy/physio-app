import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as appointmentService from '../../services/appointmentService';
import { useErrorHandler } from '../useErrorHandler';
import type { Appointment, AppointmentFormData } from '../../types/appointment';
import type { SymptomAssessmentFormData } from '../../types/assessment';

// Query keys for React Query
export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (filters: string) => [...appointmentKeys.lists(), { filters }] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
  availability: () => [...appointmentKeys.all, 'availability'] as const,
  availabilityRange: (start: Date, end: Date) =>
    [
      ...appointmentKeys.availability(),
      { start: start.toISOString(), end: end.toISOString() },
    ] as const,
};

// Hook for getting available time slots
export function useAvailableTimeSlots(
  startDate: Date,
  endDate: Date,
  duration: number = 60,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: appointmentKeys.availabilityRange(startDate, endDate),
    queryFn: () =>
      appointmentService.getAvailableTimeSlots({
        startDate,
        endDate,
        duration,
      }),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// Hook for getting appointments in a date range
export function useAppointments(
  startDate: Date,
  endDate: Date,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: appointmentKeys.list(
      `${startDate.toISOString()}-${endDate.toISOString()}`
    ),
    queryFn: () =>
      appointmentService.getAppointmentsWithEdgeFunction(startDate, endDate),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
}

// Hook for creating appointments
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { handleApiError, showSuccess } = useErrorHandler();

  return useMutation({
    mutationFn: async ({
      formData,
      symptomAssessment,
      duration = 60,
    }: {
      formData: AppointmentFormData;
      symptomAssessment: SymptomAssessmentFormData;
      duration?: number;
    }) => {
      return appointmentService.createAppointmentWithEdgeFunction(
        formData,
        symptomAssessment,
        duration
      );
    },
    retry: false, // Explicitly disable retries for appointment creation to prevent double-booking
    onSuccess: () => {
      // Invalidate and refetch appointment-related queries
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });

      showSuccess('Appointment booked successfully!');
    },
    onError: (error: Error) => {
      console.error('Failed to create appointment:', error);
      handleApiError(error, 'Creating appointment');
    },
  });
}

// Hook for updating appointments
export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  const { handleApiError, showSuccess } = useErrorHandler();

  return useMutation({
    mutationFn: async ({
      eventId,
      formData,
      symptomAssessment,
      duration = 60,
    }: {
      eventId: string;
      formData: AppointmentFormData;
      symptomAssessment?: SymptomAssessmentFormData;
      duration?: number;
    }) => {
      return appointmentService.updateAppointmentWithEdgeFunction(
        eventId,
        formData,
        symptomAssessment,
        duration
      );
    },
    retry: false, // Explicitly disable retries for appointment updates to prevent conflicts
    onSuccess: (appointment, variables) => {
      // Update the specific appointment in the cache
      queryClient.setQueryData(
        appointmentKeys.detail(variables.eventId),
        appointment
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.availability(),
      });

      showSuccess('Appointment updated successfully!');
    },
    onError: (error: Error) => {
      console.error('Failed to update appointment:', error);
      handleApiError(error, 'Updating appointment');
    },
  });
}

// Hook for cancelling appointments
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  const { handleApiError, showSuccess } = useErrorHandler();

  return useMutation({
    mutationFn: async ({
      eventId,
    }: {
      eventId: string;
      appointmentDetails?: Appointment;
    }) => {
      return appointmentService.cancelAppointmentWithEdgeFunction(eventId);
    },
    retry: false, // Explicitly disable retries for appointment cancellation to prevent conflicts
    onSuccess: (_, variables) => {
      // Remove the appointment from cache
      queryClient.removeQueries({
        queryKey: appointmentKeys.detail(variables.eventId),
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.availability(),
      });

      showSuccess('Appointment cancelled successfully.');
    },
    onError: (error: Error) => {
      console.error('Failed to cancel appointment:', error);
      handleApiError(error, 'Cancelling appointment');
    },
  });
}

// Hook for validating appointment data
export function useValidateAppointment() {
  return useMutation({
    mutationFn: async ({
      formData,
      duration = 60,
    }: {
      formData: AppointmentFormData;
      duration?: number;
    }) => {
      return appointmentService.validateAppointmentData(formData, duration);
    },
  });
}
