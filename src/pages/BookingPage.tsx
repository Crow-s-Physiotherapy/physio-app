/**
 * BookingPage Component
 *
 * Main page for the appointment booking system.
 * Integrates all booking components with backend services.
 *
 * Requirements: 1.1, 1.2, 1.6, 6.1
 */

import React, { useState, useEffect } from 'react';
import { SymptomAssessmentForm } from '../components/booking/SymptomAssessmentForm';
import { useCalendar } from '../hooks/useCalendar';
import { createAppointmentWithEdgeFunction } from '../services/appointmentService';
import type { AppointmentFormData, TimeSlot } from '../types/appointment';
import type { SymptomAssessmentFormData } from '../types/assessment';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';

const BookingPage = () => {
  const toast = useToast();

  // Helper function to format time slot as a time window (e.g., "9:00 - 10:00 AM")
  const formatTimeWindow = (timeSlot: TimeSlot): string => {
    const startTime = new Date(timeSlot.date);
    const endTime = new Date(
      startTime.getTime() + timeSlot.duration * 60 * 1000
    );

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    const startFormatted = formatTime(startTime);
    const endFormatted = formatTime(endTime);

    // If both times have the same AM/PM, only show it once at the end
    const startParts = startFormatted.split(' ');
    const endParts = endFormatted.split(' ');

    if (startParts[1] === endParts[1]) {
      // Same AM/PM period
      return `${startParts[0]} - ${endFormatted}`;
    } else {
      // Different AM/PM periods
      return `${startFormatted} - ${endFormatted}`;
    }
  };

  // State for the booking process
  const [step, setStep] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [formData, setFormData] = useState<AppointmentFormData>({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
  });
  const [symptomAssessment, setSymptomAssessment] =
    useState<SymptomAssessmentFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  // Get calendar functionality from the useCalendar hook
  const {
    isAuthenticated,
    authenticate,
    availableTimeSlots,
    isLoadingSlots,
    fetchAvailableTimeSlots,
    initCalendarApi,
  } = useCalendar();

  // Initialize calendar API
  useEffect(() => {
    const initCalendar = async () => {
      try {
        await initCalendarApi();
      } catch (error) {
        console.error('Error initializing calendar:', error);
        toast.error('Failed to initialize calendar. Please try again.');
      }
    };

    initCalendar();
  }, [initCalendarApi]);

  // Fetch available dates for the selected month
  useEffect(() => {
    if (isAuthenticated) {
      const fetchDates = async () => {
        try {
          const startOfMonth = new Date(
            selectedMonth.getFullYear(),
            selectedMonth.getMonth(),
            1
          );
          const endOfMonth = new Date(
            selectedMonth.getFullYear(),
            selectedMonth.getMonth() + 1,
            0
          );

          await fetchAvailableTimeSlots(startOfMonth, endOfMonth, 60);
        } catch (error) {
          console.error('Error fetching available dates:', error);
          toast.error('Failed to fetch available dates. Please try again.');
        }
      };

      fetchDates();
    }
  }, [selectedMonth, fetchAvailableTimeSlots, isAuthenticated]);

  // Extract available dates from time slots (only show future dates)
  const availableDates = React.useMemo(() => {
    // Only show dates if we're on step 1 (date selection)
    if (step !== 1) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today for comparison

    const dates = availableTimeSlots
      .map(slot => {
        const date = new Date(slot.date);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      })
      .filter(date => date >= today); // Only include today and future dates

    // Remove duplicates
    return Array.from(new Set(dates.map(date => date.toISOString()))).map(
      dateStr => new Date(dateStr)
    );
  }, [availableTimeSlots, step]);

  // Filter time slots for the selected date (client-side filtering)
  const selectedDateTimeSlots = React.useMemo(() => {
    if (!selectedDate || step !== 2) return [];

    const now = new Date();

    return availableTimeSlots.filter(slot => {
      // Check if slot is for the selected date
      const slotDate = new Date(slot.date);
      const isSameDate =
        slotDate.getDate() === selectedDate.getDate() &&
        slotDate.getMonth() === selectedDate.getMonth() &&
        slotDate.getFullYear() === selectedDate.getFullYear();

      // Filter out past time slots
      return isSameDate && slotDate > now;
    });
  }, [selectedDate, availableTimeSlots, step]);

  // No need for date-specific API calls - we'll filter monthly data client-side

  // Handle authentication with Google Calendar
  const handleAuthenticate = async () => {
    try {
      setError(null);
      await authenticate();
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error(
        'Failed to authenticate with Google Calendar. Please try again.'
      );
    }
  };

  // Handle date selection
  const handleDateSelected = (date: Date) => {
    setSelectedDate(date);
    setStep(2);
  };

  // Handle time slot selection
  const handleTimeSlotSelected = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);

    // Update form data with selected date and time
    const dateString = timeSlot.date.toISOString().split('T')[0];
    const timeString = timeSlot.date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    setFormData({
      ...formData,
      appointmentDate: dateString || '',
      appointmentTime: timeString,
    });

    setStep(3);
  };

  // Handle form submission
  const handleFormSubmit = (data: AppointmentFormData) => {
    // Preserve the appointment date and time from the selected time slot
    const updatedFormData = {
      ...data,
      appointmentDate: formData.appointmentDate,
      appointmentTime: formData.appointmentTime,
    };

    setFormData(updatedFormData);
    setStep(4); // Move to symptom assessment
  };

  // Handle symptom assessment submission
  const handleSymptomAssessmentSubmit = (data: SymptomAssessmentFormData) => {
    // Ensure patient info matches
    const assessmentData = {
      ...data,
      patientName: formData.patientName,
      patientEmail: formData.patientEmail,
    };

    setSymptomAssessment(assessmentData);
    setStep(5); // Move to confirmation
  };

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!selectedTimeSlot) return;

    console.log('🚀 Starting appointment booking process...');
    setIsSubmitting(true);
    setError(null);

    try {
      // Use the collected symptom assessment data
      if (!symptomAssessment) {
        throw new Error('Symptom assessment is required');
      }

      // Create the appointment using the Edge Function service
      console.log('📞 Calling createAppointmentWithEdgeFunction...');
      const appointment = await createAppointmentWithEdgeFunction(
        formData,
        symptomAssessment,
        selectedTimeSlot.duration
      );
      console.log('✅ Appointment created successfully:', appointment.id);

      setAppointmentId(appointment.id);
      setStep(6); // Move to success step
    } catch (err) {
      console.error('Error creating appointment:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to book appointment. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit details
  const handleEditDetails = () => {
    setStep(3);
  };

  // Handle edit symptom assessment
  const handleEditAssessment = () => {
    setStep(4);
  };

  // Handle restart booking process
  const handleRestartBooking = () => {
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setFormData({
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      appointmentDate: '',
      appointmentTime: '',
      notes: '',
    });
    setSymptomAssessment(null);
    setError(null);
    setAppointmentId(null);
    setStep(1);
  };

  // Render authentication prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Calendar Access Required
            </h2>
            <p className="text-gray-600 mb-8">
              To book an appointment, we need to access the physiotherapist's
              calendar to show available time slots.
            </p>
            <button
              onClick={handleAuthenticate}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold cursor-pointer"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              Connect to Calendar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Note: Hooks have been moved to the top of the component to avoid conditional usage

  // Render date selection step
  const renderDateSelection = () => {
    // Month selector
    const prevMonth = () => {
      const newMonth = new Date(selectedMonth);
      newMonth.setMonth(newMonth.getMonth() - 1);
      setSelectedMonth(newMonth);
    };

    const nextMonth = () => {
      const newMonth = new Date(selectedMonth);
      newMonth.setMonth(newMonth.getMonth() + 1);
      setSelectedMonth(newMonth);
    };

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Choose Your Date
            </h2>
            <p className="text-gray-600">
              Select an available date for your physiotherapy appointment
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={prevMonth}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous
              </button>
              <h3 className="text-xl font-bold text-gray-900">
                {format(selectedMonth, 'MMMM yyyy')}
              </h3>
              <button
                onClick={nextMonth}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                Next
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {isLoadingSlots ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-500 bg-blue-100">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading available dates...
                </div>
              </div>
            ) : availableDates.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Available Dates
                </h3>
                <p className="text-gray-600">
                  No available dates for this month. Please try another month.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableDates.map(date => (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateSelected(date)}
                    className="group p-4 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-center transition-all duration-200 hover:shadow-md cursor-pointer"
                  >
                    <div className="text-sm text-gray-500 group-hover:text-blue-600">
                      {format(date, 'EEE')}
                    </div>
                    <div className="text-lg font-bold text-gray-900 group-hover:text-blue-700">
                      {format(date, 'd')}
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-blue-600">
                      {format(date, 'MMM')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render time selection step
  const renderTimeSelection = () => {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Choose Your Time
            </h2>
            <p className="text-gray-600">
              Select an available time slot for your appointment
            </p>
          </div>

          {selectedDate && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-8 border border-green-100">
              <div className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm text-green-600 font-medium">
                  Selected Date:
                </span>
                <span className="ml-2 font-bold text-green-800">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-6">
            {isLoadingSlots ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-500 bg-blue-100">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading available time slots...
                </div>
              </div>
            ) : selectedDateTimeSlots.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Available Times
                </h3>
                <p className="text-gray-600 mb-4">
                  No available time slots for this date. Please select another
                  date.
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Choose Different Date
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  {selectedDateTimeSlots.map(slot => (
                    <button
                      key={slot.date.toISOString()}
                      onClick={() => handleTimeSlotSelected(slot)}
                      className={`group p-4 rounded-lg text-center transition-all duration-200 font-medium cursor-pointer ${
                        selectedTimeSlot &&
                        slot.date.getTime() === selectedTimeSlot.date.getTime()
                          ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                          : 'bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-900 hover:shadow-md'
                      }`}
                    >
                      <div className="text-lg font-bold">
                        {formatTimeWindow(slot)}
                      </div>
                      <div className="text-sm opacity-75 mt-1">
                        {slot.duration} minutes
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Back to Date Selection
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render patient details form - simplified since details will be in assessment
  const renderPatientForm = () => {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Basic Information
            </h2>
            <p className="text-gray-600">
              We'll collect detailed information in the next step
            </p>
          </div>

          {selectedTimeSlot && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8 border border-blue-100">
              <div className="flex items-center mb-3">
                <svg
                  className="w-5 h-5 text-blue-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">
                  Selected Appointment
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold text-gray-900">
                    {format(selectedTimeSlot.date, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-semibold text-gray-900">
                    {formatTimeWindow(selectedTimeSlot)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={e => {
              e.preventDefault();
              handleFormSubmit(formData);
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="patientName"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="patientName"
                  name="patientName"
                  type="text"
                  required
                  value={formData.patientName || ''}
                  onChange={e =>
                    setFormData({ ...formData, patientName: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label
                  htmlFor="patientEmail"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="patientEmail"
                  name="patientEmail"
                  type="email"
                  required
                  value={formData.patientEmail || ''}
                  onChange={e =>
                    setFormData({ ...formData, patientEmail: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="patientPhone"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Phone Number
              </label>
              <input
                id="patientPhone"
                name="patientPhone"
                type="tel"
                value={formData.patientPhone || ''}
                onChange={e =>
                  setFormData({ ...formData, patientPhone: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your phone number (optional)"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Time Selection
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold cursor-pointer"
              >
                Continue to Assessment
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render booking confirmation step
  const renderBookingConfirmation = () => {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Confirm Your Appointment
            </h2>
            <p className="text-gray-600">
              Please review your appointment details before confirming
            </p>
          </div>

          <div className="space-y-6">
            {/* Date & Time */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
              <div className="flex items-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">
                  Appointment Details
                </h3>
              </div>
              {selectedTimeSlot && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Date</p>
                    <p className="text-lg font-bold text-gray-900">
                      {format(selectedTimeSlot.date, 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Time</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatTimeWindow(selectedTimeSlot)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">
                      Duration
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedTimeSlot.duration} minutes
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Patient Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <svg
                  className="w-6 h-6 text-gray-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">
                  Patient Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">
                    {formData.patientName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">
                    {formData.patientEmail}
                  </p>
                </div>
                {formData.patientPhone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">
                      {formData.patientPhone}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Symptom Assessment Summary */}
            {symptomAssessment && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
                <div className="flex items-center mb-4">
                  <svg
                    className="w-6 h-6 text-green-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Symptom Assessment
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-green-600 font-medium">
                      Pain Level
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {symptomAssessment.painLevel}/10
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">
                      Primary Symptom
                    </p>
                    <p className="font-semibold text-gray-900">
                      {symptomAssessment.primarySymptom}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">
                      Duration
                    </p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {symptomAssessment.symptomDuration.replace(/-/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">
                      Daily Impact
                    </p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {symptomAssessment.dailyImpact}
                    </p>
                  </div>
                </div>
                {symptomAssessment.painLocation.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-green-600 font-medium">
                      Pain Location
                    </p>
                    <p className="font-semibold text-gray-900">
                      {symptomAssessment.painLocation.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Important Information */}
            <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
              <div className="flex items-center mb-4">
                <svg
                  className="w-6 h-6 text-yellow-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">
                  Important Information
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <svg
                    className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Please arrive 10 minutes before your scheduled appointment
                  time
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Cancellations must be made at least 24 hours in advance
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  A confirmation email will be sent to your provided email
                  address
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Please bring any relevant medical records or referrals
                </li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                onClick={handleEditDetails}
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Details
              </button>
              <button
                onClick={handleEditAssessment}
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Assessment
              </button>
            </div>
            <button
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Confirming...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Confirm Appointment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render booking success step
  const renderBookingSuccess = () => {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Appointment Confirmed!
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Your appointment has been successfully booked. A confirmation email
            has been sent to{' '}
            <span className="font-semibold text-blue-600">
              {formData.patientEmail}
            </span>
            .
          </p>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-8 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Appointment Summary
            </h3>
            {selectedTimeSlot && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-green-600 font-medium">Date</p>
                  <p className="font-bold text-gray-900">
                    {format(selectedTimeSlot.date, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Time</p>
                  <p className="font-bold text-gray-900">
                    {formatTimeWindow(selectedTimeSlot)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Duration</p>
                  <p className="font-bold text-gray-900">
                    {selectedTimeSlot.duration} minutes
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Patient</p>
                  <p className="font-bold text-gray-900">
                    {formData.patientName}
                  </p>
                </div>
                {formData.patientPhone && (
                  <div>
                    <p className="text-sm text-green-600 font-medium">Phone</p>
                    <p className="font-bold text-gray-900">
                      {formData.patientPhone}
                    </p>
                  </div>
                )}
                {appointmentId && (
                  <div>
                    <p className="text-sm text-green-600 font-medium">
                      Appointment ID
                    </p>
                    <p className="font-bold text-gray-900">{appointmentId}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h4 className="font-semibold text-gray-900 mb-3">What's Next?</h4>
            <ul className="text-left space-y-2 text-gray-700">
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Check your email for the confirmation and calendar invitation
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Arrive 10 minutes early for your appointment
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Bring any relevant medical records or referrals
              </li>
            </ul>
          </div>

          <button
            onClick={handleRestartBooking}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold cursor-pointer"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Book Another Appointment
          </button>
        </div>
      </div>
    );
  };

  // Render symptom assessment form
  const renderSymptomAssessmentForm = () => {
    return (
      <SymptomAssessmentForm
        onSubmit={handleSymptomAssessmentSubmit}
        onBack={() => setStep(3)}
        initialData={{
          patientName: formData.patientName,
          patientEmail: formData.patientEmail,
          additionalNotes: formData.notes || '',
          ...symptomAssessment,
        }}
        isLoading={false}
      />
    );
  };

  // Render progress indicator with clickable steps
  const renderProgressIndicator = () => {
    const steps = [
      {
        name: 'Date',
        step: 1,
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      },
      {
        name: 'Time',
        step: 2,
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        name: 'Details',
        step: 3,
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      },
      {
        name: 'Assessment',
        step: 4,
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      { name: 'Confirm', step: 5, icon: 'M5 13l4 4L19 7' },
    ];

    return (
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.name}>
                {/* Step indicator */}
                <div
                  className={`flex flex-col items-center ${step > s.step ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    // Only allow going back to previous steps, not forward
                    if (step > s.step) {
                      setStep(s.step);
                    }
                  }}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                      step >= s.step
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-400'
                    } ${step > s.step ? 'hover:bg-blue-700' : ''}`}
                  >
                    {step > s.step ? (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={s.icon}
                        />
                      </svg>
                    )}
                  </div>
                  <div
                    className={`text-sm mt-2 font-medium ${step >= s.step ? 'text-blue-600' : 'text-gray-500'}`}
                  >
                    {s.name}
                  </div>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${
                        step > s.step ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render the current step
  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return renderDateSelection();
      case 2:
        return renderTimeSelection();
      case 3:
        return renderPatientForm();
      case 4:
        return renderSymptomAssessmentForm();
      case 5:
        return renderBookingConfirmation();
      case 6:
        return renderBookingSuccess();
      default:
        return renderDateSelection();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {step < 6 && renderProgressIndicator()}
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default BookingPage;
