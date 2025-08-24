/**
 * BookingLayout Component
 *
 * Responsive layout wrapper for the appointment booking process.
 * Provides consistent styling and responsive design for all booking steps.
 *
 * Requirements: 6.1
 */

import React, { type ReactNode } from 'react';

interface BookingLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const BookingLayout: React.FC<BookingLayoutProps> = ({
  children,
  title = 'Book Your Appointment',
  subtitle = 'Schedule a physiotherapy session at your preferred time.',
}) => {
  return (
    <div className="booking-layout bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-lg text-gray-600">{subtitle}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 md:p-8">{children}</div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Need help? Contact us at{' '}
            <a
              href="mailto:matasanosphysio@gmail.com"
              className="text-blue-600 hover:text-blue-800"
            >
              matasanosphysio@gmail.com
            </a>{' '}
            or call{' '}
            <a
              href="tel:+61416214955"
              className="text-blue-600 hover:text-blue-800"
            >
              (+61) 416 214 955
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingLayout;
