/**
 * BookingConfirmation Component
 *
 * Displays appointment details for confirmation before booking.
 * Shows a summary of the selected date, time, and patient information.
 *
 * Requirements: 1.1, 1.6
 */

import React from 'react';
import type { AppointmentFormData, TimeSlot } from '../../types/appointment';

// Simple date formatting function for development
const format = (date: Date, formatStr: string): string => {
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

interface BookingConfirmationProps {
  formData: AppointmentFormData;
  selectedTimeSlot: TimeSlot;
  onConfirm: () => void;
  onEdit: () => void;
  isSubmitting: boolean;
  meetLink?: string; // Google Meet link for remote session
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  formData,
  selectedTimeSlot,
  onConfirm,
  onEdit,
  isSubmitting,
  meetLink,
}) => {
  // Format date and time for display
  const formatDate = (date: Date): string => {
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const formatTime = (date: Date): string => {
    return format(date, 'h:mm a');
  };

  // Calculate end time based on duration
  const calculateEndTime = (date: Date, durationMinutes: number): string => {
    const endTime = new Date(date);
    endTime.setMinutes(endTime.getMinutes() + durationMinutes);
    return formatTime(endTime);
  };

  return (
    <div className="booking-confirmation bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Confirm Your Appointment
      </h2>

      <div className="appointment-details space-y-6">
        <div className="date-time-details bg-blue-50 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Date & Time</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Date:</p>
              <p className="font-medium">{formatDate(selectedTimeSlot.date)}</p>
            </div>
            <div>
              <p className="text-gray-600">Time:</p>
              <p className="font-medium">
                {formatTime(selectedTimeSlot.date)} -{' '}
                {calculateEndTime(
                  selectedTimeSlot.date,
                  selectedTimeSlot.duration
                )}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-gray-600">Duration:</p>
            <p className="font-medium">{selectedTimeSlot.duration} minutes</p>
          </div>
        </div>

        <div className="patient-details bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Name:</p>
              <p className="font-medium">{formData.patientName}</p>
            </div>
            <div>
              <p className="text-gray-600">Email:</p>
              <p className="font-medium">{formData.patientEmail}</p>
            </div>
          </div>
          {formData.patientPhone && (
            <div className="mt-2">
              <p className="text-gray-600">Phone:</p>
              <p className="font-medium">{formData.patientPhone}</p>
            </div>
          )}
        </div>

        {formData.notes && (
          <div className="notes bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-2">Additional Notes</h3>
            <p>{formData.notes}</p>
          </div>
        )}

        {meetLink && (
          <div className="meet-link bg-green-50 p-4 rounded-md border border-green-200">
            <h3 className="text-lg font-medium mb-2 text-green-800">
              📹 Video Session Details
            </h3>
            <p className="text-green-700 mb-3">
              Your appointment will be conducted via Google Meet. The video link
              will be available in your calendar invitation.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                🔗 Join Video Session
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(meetLink)}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                📋 Copy Link
              </button>
            </div>
            <p className="text-sm text-green-600 mt-2">
              💡 Tip: Test your camera and microphone before the appointment
            </p>
          </div>
        )}

        <div className="appointment-policies bg-yellow-50 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Appointment Policies</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Please arrive 10 minutes before your scheduled appointment time.
            </li>
            <li>Cancellations must be made at least 24 hours in advance.</li>
            <li>
              A confirmation email will be sent to your provided email address.
            </li>
            <li>Please bring any relevant medical records or referrals.</li>
          </ul>
        </div>
      </div>

      <div className="action-buttons flex flex-col sm:flex-row justify-between mt-8 space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          onClick={onEdit}
          disabled={isSubmitting}
          className="w-full sm:w-1/2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Edit Details
        </button>
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="w-full sm:w-1/2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {isSubmitting ? 'Confirming...' : 'Confirm Appointment'}
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
