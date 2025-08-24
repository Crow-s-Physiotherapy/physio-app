/**
 * AppointmentBooking Component
 *
 * Main component for the appointment booking process.
 * Integrates CalendarView, TimeSlotPicker, BookingForm, and BookingConfirmation components.
 * Manages the multi-step booking flow with validation and error handling.
 *
 * Requirements: 1.1, 1.2, 1.6, 6.1
 */

import { useState, Fragment } from 'react';
import CalendarView from './CalendarView';
import TimeSlotPicker from './TimeSlotPicker';
import BookingForm from './BookingForm';
import BookingConfirmation from './BookingConfirmation';
import type { AppointmentFormData, TimeSlot } from '../../types/appointment';

// Simple date formatting function for development
const format = (date: Date, formatStr: string): string => {
  if (formatStr === 'yyyy-MM-dd') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  if (formatStr === 'HH:mm') {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  const options: Intl.DateTimeFormatOptions = {};

  if (formatStr.includes('EEEE')) {
    options.weekday = 'long';
  }

  if (formatStr.includes('MMMM')) {
    options.month = 'long';
  }

  if (formatStr.includes('d')) {
    options.day = 'numeric';
  }

  if (formatStr.includes('yyyy')) {
    options.year = 'numeric';
  }

  if (formatStr.includes('h:mm a')) {
    options.hour = 'numeric';
    options.minute = '2-digit';
    options.hour12 = true;
  }

  return new Intl.DateTimeFormat('en-US', options).format(date);
};
import { createAppointmentWithEdgeFunction } from '../../services/appointmentService';
import type { SymptomAssessmentFormData } from '../../types/assessment';
import { useToast } from '../../contexts/ToastContext';

// Booking steps
enum BookingStep {
  SELECT_DATE,
  SELECT_TIME,
  ENTER_DETAILS,
  CONFIRM_BOOKING,
  BOOKING_COMPLETE,
}

interface AppointmentBookingProps {
  userId?: string; // Made optional since it's not used in the current implementation
  duration?: number;
  onBookingComplete?: (appointmentId: string) => void;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({
  duration = 60,
  onBookingComplete,
}) => {
  const toast = useToast();
  // State for the booking process
  const [currentStep, setCurrentStep] = useState<BookingStep>(
    BookingStep.SELECT_DATE
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [formData, setFormData] = useState<AppointmentFormData>({
    patientName: '',
    patientEmail: '',
    appointmentDate: '',
    appointmentTime: '',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [, setError] = useState<string | undefined>(undefined);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [meetLink, setMeetLink] = useState<string | undefined>(undefined);

  // Handle date selection
  const handleDateSelected = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setCurrentStep(BookingStep.SELECT_TIME);
  };

  // Handle time slot selection
  const handleTimeSlotSelected = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);

    // Update form data with selected date and time
    const dateString = format(timeSlot.date, 'yyyy-MM-dd');
    const timeString = format(timeSlot.date, 'HH:mm');

    setFormData(prev => ({
      ...prev,
      appointmentDate: dateString,
      appointmentTime: timeString,
    }));

    setCurrentStep(BookingStep.ENTER_DETAILS);
  };

  // Handle form submission
  const handleFormSubmit = (data: AppointmentFormData) => {
    setFormData({
      ...data,
      appointmentDate: formData.appointmentDate,
      appointmentTime: formData.appointmentTime,
    });
    setCurrentStep(BookingStep.CONFIRM_BOOKING);
  };

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!selectedTimeSlot) return;

    setIsSubmitting(true);
    setError(undefined);

    try {
      // Create a basic symptom assessment for now
      // In a real implementation, this would come from a symptom assessment form
      const symptomAssessment: SymptomAssessmentFormData = {
        patientName: formData.patientName,
        patientEmail: formData.patientEmail,
        painLevel: 5,
        painLocation: [],
        symptomDuration: '',
        previousTreatments: '',
        currentMedications: '',
        additionalNotes: formData.notes || '',
        primarySymptom: '',
        secondarySymptoms: [],
        onsetDate: '',
        triggerEvents: [],
        worseningFactors: [],
        relievingFactors: [],
        dailyImpact: 'moderate' as const,
      };

      // Create the appointment using the Edge Function service
      const appointment = await createAppointmentWithEdgeFunction(
        formData,
        symptomAssessment,
        selectedTimeSlot.duration
      );

      setAppointmentId(appointment.id);
      setMeetLink(appointment.meetLink);
      setCurrentStep(BookingStep.BOOKING_COMPLETE);

      // Call the onBookingComplete callback if provided
      if (onBookingComplete) {
        onBookingComplete(appointment.id);
      }
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
    setCurrentStep(BookingStep.ENTER_DETAILS);
  };

  // Handle restart booking process
  const handleRestartBooking = () => {
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setFormData({
      patientName: '',
      patientEmail: '',
      appointmentDate: '',
      appointmentTime: '',
    });
    setError(undefined);
    setAppointmentId(null);
    setMeetLink(undefined);
    setCurrentStep(BookingStep.SELECT_DATE);
  };

  // Render the current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case BookingStep.SELECT_DATE:
        return (
          <div className="select-date-step">
            <h2 className="text-xl font-semibold mb-4">
              Select Appointment Date
            </h2>
            <CalendarView
              onDateSelected={handleDateSelected}
              selectedDate={selectedDate}
              duration={duration}
            />
          </div>
        );

      case BookingStep.SELECT_TIME:
        return (
          <div className="select-time-step">
            <h2 className="text-xl font-semibold mb-4">
              Select Appointment Time
            </h2>
            <TimeSlotPicker
              selectedDate={selectedDate}
              onTimeSlotSelected={handleTimeSlotSelected}
              selectedTimeSlot={selectedTimeSlot}
              duration={duration}
            />
            <div className="mt-6">
              <button
                onClick={() => setCurrentStep(BookingStep.SELECT_DATE)}
                className="text-blue-600 hover:text-blue-800"
              >
                &larr; Back to Calendar
              </button>
            </div>
          </div>
        );

      case BookingStep.ENTER_DETAILS:
        return (
          <div className="enter-details-step">
            <h2 className="text-xl font-semibold mb-4">Enter Your Details</h2>
            {selectedTimeSlot && (
              <div className="selected-time-info mb-6 p-3 bg-blue-50 rounded-md">
                <p>
                  <strong>Selected Date:</strong>{' '}
                  {format(selectedTimeSlot.date, 'EEEE, MMMM d, yyyy')}
                </p>
                <p>
                  <strong>Selected Time:</strong>{' '}
                  {format(selectedTimeSlot.date, 'h:mm a')}
                </p>
              </div>
            )}
            <BookingForm
              onSubmit={handleFormSubmit}
              initialData={formData}
              isSubmitting={isSubmitting}
            />
            <div className="mt-6">
              <button
                onClick={() => setCurrentStep(BookingStep.SELECT_TIME)}
                className="text-blue-600 hover:text-blue-800"
              >
                &larr; Back to Time Selection
              </button>
            </div>
          </div>
        );

      case BookingStep.CONFIRM_BOOKING:
        return (
          <div className="confirm-booking-step">
            {selectedTimeSlot && (
              <BookingConfirmation
                formData={formData}
                selectedTimeSlot={selectedTimeSlot}
                onConfirm={handleConfirmBooking}
                onEdit={handleEditDetails}
                isSubmitting={isSubmitting}
                meetLink={meetLink || ''}
              />
            )}
          </div>
        );

      case BookingStep.BOOKING_COMPLETE:
        return (
          <div className="booking-complete-step bg-white rounded-lg shadow-md p-6 text-center">
            <div className="success-icon mb-4">
              <svg
                className="h-16 w-16 text-green-500 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2">
              Appointment Confirmed!
            </h2>
            <p className="text-gray-600 mb-6">
              Your appointment has been successfully booked. A confirmation
              email has been sent to {formData.patientEmail}.
            </p>
            <div className="appointment-details bg-gray-50 p-4 rounded-md text-left mb-6">
              <h3 className="text-lg font-medium mb-2">Appointment Details</h3>
              {selectedTimeSlot && (
                <>
                  <p>
                    <strong>Date:</strong>{' '}
                    {format(selectedTimeSlot.date, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p>
                    <strong>Time:</strong>{' '}
                    {format(selectedTimeSlot.date, 'h:mm a')}
                  </p>
                  <p>
                    <strong>Duration:</strong> {selectedTimeSlot.duration}{' '}
                    minutes
                  </p>
                </>
              )}
              <p>
                <strong>Patient:</strong> {formData.patientName}
              </p>
              {appointmentId && (
                <p>
                  <strong>Appointment ID:</strong> {appointmentId}
                </p>
              )}
              {meetLink && (
                <div className="meet-link-info mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800 font-medium mb-2">
                    📹 Video Session Ready
                  </p>
                  <p className="text-green-700 text-sm mb-3">
                    Your appointment will be conducted via Google Meet. The link
                    has been included in your calendar invitation.
                  </p>
                  <a
                    href={meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    🔗 Join Video Session
                  </a>
                </div>
              )}
            </div>
            <div className="action-buttons">
              <button
                onClick={handleRestartBooking}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Book Another Appointment
              </button>
            </div>
          </div>
        );
    }
  };

  // Render progress indicator
  const renderProgressIndicator = () => {
    const steps = [
      { name: 'Date', step: BookingStep.SELECT_DATE },
      { name: 'Time', step: BookingStep.SELECT_TIME },
      { name: 'Details', step: BookingStep.ENTER_DETAILS },
      { name: 'Confirm', step: BookingStep.CONFIRM_BOOKING },
    ];

    return (
      <div className="booking-progress mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <Fragment key={step.name}>
              {/* Step indicator */}
              <div className="step-indicator flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= step.step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="text-xs mt-1">{step.name}</div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    currentStep > step.step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="appointment-booking max-w-3xl mx-auto">
      {currentStep !== BookingStep.BOOKING_COMPLETE &&
        renderProgressIndicator()}
      {renderCurrentStep()}
    </div>
  );
};

export default AppointmentBooking;
