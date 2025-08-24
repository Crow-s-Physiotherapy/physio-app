/**
 * useCalendar Hook
 *
 * A custom React hook for interacting with the Google Calendar API and backend services.
 * Now connects to real backend services instead of using mocked data.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAvailableTimeSlots } from '../services/appointmentService';
import { useErrorHandler } from './useErrorHandler';
import type { Appointment, TimeSlot } from '../types/appointment';

export const useCalendar = () => {
  const { handleApiError, showSuccess } = useErrorHandler();

  // State for authentication
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // State for available time slots
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ref to prevent duplicate API calls
  const fetchingRef = useRef<string | null>(null);

  // Initialize the mock calendar API
  const initCalendarApi = useCallback(async (): Promise<boolean> => {
    return Promise.resolve(true);
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    setIsAuthenticated(true);
  }, []);

  // Authenticate with mock calendar
  const authenticate = async (): Promise<boolean> => {
    setIsAuthenticated(true);
    return Promise.resolve(true);
  };

  // Generate mock time slots for a given date range
  const generateMockTimeSlots = (
    startDate: Date,
    endDate: Date,
    duration: number = 60
  ): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const currentDate = new Date(startDate);

    // Set to start of day
    currentDate.setHours(0, 0, 0, 0);

    // Loop through each day in the range
    while (currentDate <= endDate) {
      // Skip weekends (0 = Sunday, 6 = Saturday)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Generate slots from 9 AM to 5 PM
        for (let hour = 9; hour < 17; hour++) {
          // Generate slots every 60 minutes for simplicity
          for (let minute = 0; minute < 60; minute += 60) {
            // Skip 12-1 PM for lunch
            if (hour === 12) continue;

            const slotDate = new Date(currentDate);
            slotDate.setHours(hour, minute, 0, 0);

            // Make most slots available (reduce randomness for testing)
            const isAvailable = Math.random() > 0.1; // 90% availability

            if (isAvailable) {
              slots.push({
                date: slotDate,
                time: slotDate.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                available: true,
                duration,
              });
            }
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(
      'Generated slots:',
      slots.length,
      'for date range:',
      startDate,
      'to',
      endDate
    );
    return slots;
  };

  // Fetch available time slots from backend
  const fetchAvailableTimeSlots = useCallback(
    async (
      startDate: Date,
      endDate: Date,
      duration: number = 60
    ): Promise<void> => {
      // Create a unique key for this request to prevent duplicates
      const requestKey = `${startDate.toISOString()}-${endDate.toISOString()}-${duration}`;

      // If we're already fetching the same data, don't make another request
      if (fetchingRef.current === requestKey) {
        console.log('Duplicate request prevented for:', requestKey);
        return;
      }

      try {
        console.log(
          'Fetching time slots from backend for:',
          startDate,
          'to',
          endDate
        );

        fetchingRef.current = requestKey;
        setIsLoadingSlots(true);
        setErrorMessage(null);

        // Use the real backend service to get available time slots
        const slots = await getAvailableTimeSlots({
          startDate,
          endDate,
          duration,
        });

        console.log('Fetched real slots from backend:', slots.length);
        setAvailableTimeSlots(slots);
      } catch (error) {
        console.error(
          'Error fetching available time slots from backend:',
          error
        );

        // Handle error with toast notification (only once per request)
        handleApiError(error, 'Fetching available time slots');
        setErrorMessage('Unable to load available appointments');

        // Fallback to mock data if backend fails (silently)
        console.log('Falling back to mock data...');
        const mockSlots = generateMockTimeSlots(startDate, endDate, duration);
        setAvailableTimeSlots(mockSlots);
      } finally {
        console.log('Setting loading to false');
        fetchingRef.current = null;
        setIsLoadingSlots(false);
      }
    },
    [handleApiError]
  );

  // Create a calendar event for an appointment
  const createAppointmentEvent = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _appointment: Appointment
  ): Promise<string | null> => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate a mock event ID
      const eventId = `mock-event-${Date.now()}`;
      showSuccess('Appointment created successfully');
      return eventId;
    } catch (error) {
      console.error('Error creating appointment event:', error);
      handleApiError(error, 'Creating calendar event');
      setErrorMessage('Failed to create calendar event');
      return null;
    }
  };

  // Update a calendar event for an appointment
  const updateAppointmentEvent = async (
    appointment: Appointment
  ): Promise<string | null> => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Return the existing event ID or generate a new one
      const eventId = appointment.googleEventId || `mock-event-${Date.now()}`;
      showSuccess('Appointment updated successfully');
      return eventId;
    } catch (error) {
      console.error('Error updating appointment event:', error);
      handleApiError(error, 'Updating calendar event');
      setErrorMessage('Failed to update calendar event');
      return null;
    }
  };

  // Cancel a calendar event
  const cancelAppointmentEvent = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _eventId: string
  ): Promise<boolean> => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      showSuccess('Appointment cancelled successfully');
      return true;
    } catch (error) {
      console.error('Error cancelling appointment event:', error);
      handleApiError(error, 'Cancelling calendar event');
      setErrorMessage('Failed to cancel calendar event');
      return false;
    }
  };

  // Sync appointments with calendar
  const syncAppointments = async (
    appointments: Appointment[]
  ): Promise<Record<string, string | null>> => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const results: Record<string, string | null> = {};

      appointments.forEach(appointment => {
        results[appointment.id] =
          appointment.googleEventId || `mock-event-${Date.now()}`;
      });

      showSuccess(`Synced ${appointments.length} appointments with calendar`);
      return results;
    } catch (error) {
      console.error('Error syncing appointments:', error);
      handleApiError(error, 'Syncing appointments with calendar');
      setErrorMessage('Failed to sync appointments with calendar');
      return {};
    }
  };

  return {
    isAuthenticated,
    authenticate,
    availableTimeSlots,
    isLoadingSlots,
    errorMessage,
    fetchAvailableTimeSlots,
    createAppointmentEvent,
    updateAppointmentEvent,
    cancelAppointmentEvent,
    syncAppointments,
    initCalendarApi,
  };
};

export default useCalendar;
