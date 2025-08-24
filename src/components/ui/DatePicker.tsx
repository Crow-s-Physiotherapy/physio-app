import React, { useState, useEffect, useRef } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';

interface DatePickerProps {
  selectedDate?: Date | null;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateSelect,
  minDate = new Date(new Date().getFullYear() - 50, 0, 1), // Default to 50 years ago
  maxDate,
  className = '',
  placeholder = 'Select a date',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) return selectedDate;
    // If maxDate is set (like for symptom onset), start a few months back
    if (maxDate) {
      const defaultMonth = new Date();
      defaultMonth.setMonth(defaultMonth.getMonth() - 3); // Start 3 months ago
      return defaultMonth;
    }
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Get the first day of the week for the month (to show previous month's trailing days)
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay());

  // Get the last day of the week for the month (to show next month's leading days)
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
    setIsOpen(false);
  };

  const isDateDisabled = (date: Date) => {
    // Normalize dates to compare only year, month, day
    const checkDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const minDateNormalized = new Date(
      minDate.getFullYear(),
      minDate.getMonth(),
      minDate.getDate()
    );

    if (checkDate < minDateNormalized) return true;

    if (maxDate) {
      const maxDateNormalized = new Date(
        maxDate.getFullYear(),
        maxDate.getMonth(),
        maxDate.getDate()
      );
      if (checkDate > maxDateNormalized) return true;
    }

    return false;
  };

  const getDayClasses = (date: Date) => {
    const baseClasses =
      'w-10 h-10 flex items-center justify-center text-sm rounded-lg transition-all duration-200';

    if (isDateDisabled(date)) {
      return `${baseClasses} text-gray-300 cursor-not-allowed`;
    }

    if (!isSameMonth(date, currentMonth)) {
      return `${baseClasses} text-gray-400 hover:bg-gray-100 cursor-pointer`;
    }

    if (selectedDate && isSameDay(date, selectedDate)) {
      return `${baseClasses} bg-blue-600 text-white shadow-lg cursor-pointer`;
    }

    if (isToday(date)) {
      return `${baseClasses} bg-blue-100 text-blue-600 font-semibold hover:bg-blue-200 cursor-pointer`;
    }

    return `${baseClasses} text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer`;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
            {selectedDate
              ? format(selectedDate, 'EEEE, MMMM d, yyyy')
              : placeholder}
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[320px]"
          onClick={e => e.stopPropagation()}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <svg
                className="w-5 h-5 text-gray-600"
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
            </button>

            <h3 className="text-lg font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>

            <button
              type="button"
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <svg
                className="w-5 h-5 text-gray-600"
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

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div
                key={day}
                className="w-10 h-8 flex items-center justify-center text-xs font-medium text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map(date => (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => !isDateDisabled(date) && handleDateClick(date)}
                disabled={isDateDisabled(date)}
                className={getDayClasses(date)}
              >
                {format(date, 'd')}
              </button>
            ))}
          </div>

          {/* Close Button */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
