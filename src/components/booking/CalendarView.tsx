/**
 * CalendarView Component
 *
 * Displays a calendar with available appointment slots.
 * Allows users to select a date and view available time slots.
 *
 * Requirements: 1.1, 6.1
 */

import React, { useState, useEffect } from 'react';
import { useCalendar } from '../../hooks/useCalendar';
import {
  announceToScreenReader,
  handleKeyboardNavigation,
} from '../../utils/accessibility';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { InlineLoading } from '../common/LoadingStates';
import { useToast } from '../../contexts/ToastContext';

// Simple date formatting functions for development
const format = (date: Date, formatStr: string): string => {
  const options: Intl.DateTimeFormatOptions = {};

  if (formatStr.includes('MMMM')) {
    options.month = 'long';
  }

  if (formatStr.includes('yyyy')) {
    options.year = 'numeric';
  }

  if (formatStr.includes('d')) {
    options.day = 'numeric';
  }

  return new Intl.DateTimeFormat('en-US', options).format(date);
};

const startOfMonth = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setDate(1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const endOfMonth = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + 1);
  newDate.setDate(0);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

const eachDayOfInterval = ({
  start,
  end,
}: {
  start: Date;
  end: Date;
}): Date[] => {
  const days: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
};

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

interface CalendarViewProps {
  onDateSelected: (date: Date) => void;
  selectedDate: Date | null;
  duration?: number;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  onDateSelected,
  selectedDate,
  duration = 60,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const toast = useToast();

  const {
    fetchAvailableTimeSlots,
    availableTimeSlots,
    isLoadingSlots,
    errorMessage,
  } = useCalendar();

  // Fetch available dates for the current month
  useEffect(() => {
    const fetchAvailableDates = async () => {
      setIsLoading(true);
      try {
        // Get the start and end of the current month
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);

        // Fetch available time slots for the entire month
        await fetchAvailableTimeSlots(monthStart, monthEnd, duration);
      } catch (error) {
        console.error('Error fetching available dates:', error);
        toast.error('Failed to load available dates. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableDates();
  }, [currentMonth, fetchAvailableTimeSlots, duration]);

  // Process available time slots when they change
  useEffect(() => {
    // Extract unique dates from available time slots
    const dates = availableTimeSlots.map(slot => {
      const date = new Date(slot.date);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    });

    // Remove duplicates
    const uniqueDates = Array.from(
      new Set(dates.map(date => date.toISOString()))
    ).map(dateStr => new Date(dateStr));

    setAvailableDates(uniqueDates);
  }, [availableTimeSlots]);

  // Generate days for the current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Handle month navigation
  const goToPreviousMonth = () => {
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    setCurrentMonth(previousMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };

  // Check if a date is available for booking
  const isDateAvailable = (date: Date): boolean => {
    // Weekends are not available
    if (isWeekend(date)) return false;

    // Check if the date is in the available dates list
    return availableDates.some(availableDate => isSameDay(availableDate, date));
  };

  // Check if a date is in the past
  const isDateInPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Handle date selection
  const handleDateClick = (date: Date) => {
    if (!isDateInPast(date) && isDateAvailable(date)) {
      onDateSelected(date);
      announceToScreenReader(`Selected ${format(date, 'MMMM d, yyyy')}`);
    }
  };

  // Handle keyboard navigation for date selection
  const handleDateKeyDown = (event: React.KeyboardEvent, date: Date) => {
    handleKeyboardNavigation(
      event.nativeEvent,
      () => handleDateClick(date),
      () => handleDateClick(date)
    );
  };

  return (
    <div
      className="calendar-view"
      role="application"
      aria-label="Appointment calendar"
    >
      <div className="calendar-header flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <div className="flex items-center gap-2 order-2 sm:order-1">
          <button
            onClick={goToPreviousMonth}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={`Go to previous month, ${format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1), 'MMMM yyyy')}`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="sr-only">Previous month</span>
          </button>
          <button
            onClick={goToNextMonth}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={`Go to next month, ${format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1), 'MMMM yyyy')}`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="sr-only">Next month</span>
          </button>
        </div>
        <h2
          className="text-xl sm:text-2xl font-semibold text-center order-1 sm:order-2"
          id="calendar-month-year"
        >
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="order-3 sm:order-3 w-20"></div>{' '}
        {/* Spacer for alignment */}
      </div>

      <ErrorDisplay
        error={errorMessage}
        onRetry={() =>
          fetchAvailableTimeSlots(
            currentMonth,
            endOfMonth(currentMonth),
            duration
          )
        }
        title="Unable to load available appointments"
        className="mb-4"
      />

      <div
        className="calendar-grid"
        role="grid"
        aria-labelledby="calendar-month-year"
      >
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2" role="row">
          {[
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ].map(day => (
            <div
              key={day}
              className="text-center font-medium py-2 text-sm sm:text-base"
              role="columnheader"
              aria-label={day}
            >
              <span className="hidden sm:inline">{day.slice(0, 3)}</span>
              <span className="sm:hidden">{day.slice(0, 1)}</span>
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1" role="grid">
          {daysInMonth.map(day => {
            const isAvailable = isDateAvailable(day);
            const isPast = isDateInPast(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isDisabled =
              isPast || !isAvailable || isLoading || isLoadingSlots;

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                onKeyDown={e => handleDateKeyDown(e, day)}
                disabled={isDisabled}
                role="gridcell"
                tabIndex={isDisabled ? -1 : 0}
                className={`
                  py-2 sm:py-3 rounded-md text-center transition min-h-[44px] text-sm sm:text-base font-medium
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                  ${isSelected ? 'bg-blue-500 text-white shadow-md' : ''}
                  ${isAvailable && !isPast && !isSelected ? 'bg-blue-100 hover:bg-blue-200 text-blue-800' : ''}
                  ${isPast ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                  ${!isAvailable && !isPast ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                `}
                aria-label={`${format(day, 'MMMM d, yyyy')}${isSelected ? ', selected' : ''}${isAvailable && !isPast ? ', available for booking' : ', not available'}`}
                aria-pressed={isSelected ? 'true' : 'false'}
                aria-disabled={isDisabled}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>

      {(isLoading || isLoadingSlots) && (
        <InlineLoading message="Loading available dates..." />
      )}
    </div>
  );
};

export default CalendarView;
