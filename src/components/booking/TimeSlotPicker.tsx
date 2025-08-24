/**
 * TimeSlotPicker Component
 *
 * Displays available time slots for a selected date.
 * Allows users to select a time slot for their appointment.
 *
 * Requirements: 1.1, 6.1
 */

import React, { useState, useEffect } from 'react';
import {
  announceToScreenReader,
  handleKeyboardNavigation,
} from '../../utils/accessibility';
import { useToast } from '../../contexts/ToastContext';
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
import { useCalendar } from '../../hooks/useCalendar';
import type { TimeSlot } from '../../types/appointment';

interface TimeSlotPickerProps {
  selectedDate: Date | null;
  onTimeSlotSelected: (timeSlot: TimeSlot) => void;
  selectedTimeSlot: TimeSlot | null;
  duration?: number;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedDate,
  onTimeSlotSelected,
  selectedTimeSlot,
  duration = 60,
}) => {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [morningSlots, setMorningSlots] = useState<TimeSlot[]>([]);
  const [afternoonSlots, setAfternoonSlots] = useState<TimeSlot[]>([]);
  const toast = useToast();

  const { fetchAvailableTimeSlots, availableTimeSlots, isLoadingSlots } =
    useCalendar();

  // Fetch available time slots when the selected date changes
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedDate) return;

      try {
        // Create start and end of the selected date
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch available time slots for the selected date
        await fetchAvailableTimeSlots(startOfDay, endOfDay, duration);
      } catch (error) {
        console.error('Error fetching time slots:', error);
        toast.error('Failed to load available time slots. Please try again.');
      }
    };

    fetchTimeSlots();
  }, [selectedDate, fetchAvailableTimeSlots, duration]);

  // Update available slots when availableTimeSlots changes
  useEffect(() => {
    if (!selectedDate) return;

    // Filter slots for the selected date
    const slotsForSelectedDate = availableTimeSlots.filter(slot => {
      const slotDate = new Date(slot.date);
      return (
        slotDate.getDate() === selectedDate.getDate() &&
        slotDate.getMonth() === selectedDate.getMonth() &&
        slotDate.getFullYear() === selectedDate.getFullYear()
      );
    });

    setAvailableSlots(slotsForSelectedDate);

    // Separate slots into morning and afternoon
    const morning = slotsForSelectedDate.filter(slot => {
      const slotDate = new Date(slot.date);
      return slotDate.getHours() < 12;
    });

    const afternoon = slotsForSelectedDate.filter(slot => {
      const slotDate = new Date(slot.date);
      return slotDate.getHours() >= 12;
    });

    setMorningSlots(morning);
    setAfternoonSlots(afternoon);
  }, [availableTimeSlots, selectedDate]);

  // Handle time slot selection
  const handleTimeSlotClick = (timeSlot: TimeSlot) => {
    onTimeSlotSelected(timeSlot);
    announceToScreenReader(
      `Selected time slot ${formatTimeDisplay(timeSlot.date)}`
    );
  };

  // Handle keyboard navigation for time slots
  const handleTimeSlotKeyDown = (
    event: React.KeyboardEvent,
    timeSlot: TimeSlot
  ) => {
    handleKeyboardNavigation(
      event.nativeEvent,
      () => handleTimeSlotClick(timeSlot),
      () => handleTimeSlotClick(timeSlot)
    );
  };

  // Format time for display
  const formatTimeDisplay = (date: Date): string => {
    return format(date, 'h:mm a');
  };

  // If no date is selected, show a message
  if (!selectedDate) {
    return (
      <div
        className="time-slot-picker p-4 bg-gray-50 rounded-md"
        role="region"
        aria-label="Time slot selection"
      >
        <p className="text-center text-gray-500">
          Please select a date to view available time slots.
        </p>
      </div>
    );
  }

  return (
    <div
      className="time-slot-picker"
      role="region"
      aria-label="Time slot selection"
    >
      <h3
        className="text-lg sm:text-xl font-medium mb-4"
        id="time-slots-heading"
      >
        Available Times for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
      </h3>

      {isLoadingSlots ? (
        <div
          className="loading-indicator text-center py-4"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-center">
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
            <span>Loading available time slots...</span>
          </div>
        </div>
      ) : availableSlots.length === 0 ? (
        <div
          className="no-slots-message bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded"
          role="alert"
        >
          <p>
            No available time slots for this date. Please select another date.
          </p>
        </div>
      ) : (
        <div
          className="time-slots-container"
          aria-labelledby="time-slots-heading"
        >
          {/* Morning slots */}
          {morningSlots.length > 0 && (
            <div className="morning-slots mb-6">
              <h4
                className="text-md font-medium mb-3"
                id="morning-slots-heading"
              >
                Morning
              </h4>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2"
                role="group"
                aria-labelledby="morning-slots-heading"
              >
                {morningSlots.map(slot => {
                  const isSelected =
                    selectedTimeSlot &&
                    slot.date.getTime() === selectedTimeSlot.date.getTime();
                  return (
                    <button
                      key={slot.date.toISOString()}
                      onClick={() => handleTimeSlotClick(slot)}
                      onKeyDown={e => handleTimeSlotKeyDown(e, slot)}
                      className={`
                        py-3 px-3 rounded-md text-center transition min-h-[44px] font-medium text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                        ${
                          isSelected
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                        }
                      `}
                      aria-pressed={isSelected ? 'true' : 'false'}
                      aria-label={`${formatTimeDisplay(slot.date)} morning appointment${isSelected ? ', selected' : ''}`}
                    >
                      {formatTimeDisplay(slot.date)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Afternoon slots */}
          {afternoonSlots.length > 0 && (
            <div className="afternoon-slots">
              <h4
                className="text-md font-medium mb-3"
                id="afternoon-slots-heading"
              >
                Afternoon
              </h4>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2"
                role="group"
                aria-labelledby="afternoon-slots-heading"
              >
                {afternoonSlots.map(slot => {
                  const isSelected =
                    selectedTimeSlot &&
                    slot.date.getTime() === selectedTimeSlot.date.getTime();
                  return (
                    <button
                      key={slot.date.toISOString()}
                      onClick={() => handleTimeSlotClick(slot)}
                      onKeyDown={e => handleTimeSlotKeyDown(e, slot)}
                      className={`
                        py-3 px-3 rounded-md text-center transition min-h-[44px] font-medium text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                        ${
                          isSelected
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                        }
                      `}
                      aria-pressed={isSelected ? 'true' : 'false'}
                      aria-label={`${formatTimeDisplay(slot.date)} afternoon appointment${isSelected ? ', selected' : ''}`}
                    >
                      {formatTimeDisplay(slot.date)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedTimeSlot && (
        <div
          className="selected-time-info mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <div>
              <p className="font-medium">
                Selected Time: {formatTimeDisplay(selectedTimeSlot.date)}
              </p>
              <p className="text-sm mt-1">
                Duration: {selectedTimeSlot.duration} minutes
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotPicker;
