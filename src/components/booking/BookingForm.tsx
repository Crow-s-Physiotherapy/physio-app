/**
 * BookingForm Component
 *
 * Form for collecting patient information during the appointment booking process.
 * Includes validation and error handling.
 *
 * Requirements: 1.2, 6.1
 */

import { useState, type FormEvent, type ChangeEvent } from 'react';
import type { AppointmentFormData } from '../../types/appointment';
import { ButtonWithLoading } from '../common/LoadingStates';
import { useToast } from '../../contexts/ToastContext';
import { generateId } from '../../utils/accessibility';

interface BookingFormProps {
  onSubmit: (data: AppointmentFormData) => void;
  initialData?: Partial<AppointmentFormData>;
  isSubmitting?: boolean;
}

interface FormErrors {
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  notes?: string;
}

const BookingForm: React.FC<BookingFormProps> = ({
  onSubmit,
  initialData = {},
  isSubmitting = false,
}) => {
  const toast = useToast();

  // Generate unique IDs for form fields
  const nameId = generateId('patient-name');
  const emailId = generateId('patient-email');
  const phoneId = generateId('patient-phone');
  const notesId = generateId('notes');

  // Form state
  const [formData, setFormData] = useState<Partial<AppointmentFormData>>({
    patientName: initialData.patientName || '',
    patientEmail: initialData.patientEmail || '',
    patientPhone: initialData.patientPhone || '',
    notes: initialData.notes || '',
    appointmentDate: initialData.appointmentDate || '',
    appointmentTime: initialData.appointmentTime || '',
  });

  // Form errors
  const [errors, setErrors] = useState<FormErrors>({});

  // Handle input changes
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when field is edited
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate name
    if (!formData.patientName?.trim()) {
      newErrors.patientName = 'Name is required';
      isValid = false;
    } else if (formData.patientName.length < 2) {
      newErrors.patientName = 'Name must be at least 2 characters';
      isValid = false;
    } else if (formData.patientName.length > 100) {
      newErrors.patientName = 'Name must be less than 100 characters';
      isValid = false;
    }

    // Validate email
    if (!formData.patientEmail?.trim()) {
      newErrors.patientEmail = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.patientEmail)) {
      newErrors.patientEmail = 'Please enter a valid email address';
      isValid = false;
    }

    // Validate phone (optional)
    if (
      formData.patientPhone &&
      !/^(\+\d{1,3})?[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/.test(
        formData.patientPhone
      )
    ) {
      newErrors.patientPhone = 'Please enter a valid phone number';
      isValid = false;
    }

    // Validate notes (optional)
    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes must be less than 500 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        onSubmit(formData as AppointmentFormData);
      } catch (error) {
        toast.error('Please check your information and try again.');
      }
    } else {
      toast.error('Please correct the errors in the form.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="booking-form space-y-6" noValidate>
      <div className="form-section bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg sm:text-xl font-medium mb-4 sm:mb-6">
          Patient Information
        </h3>

        <div className="space-y-4 sm:space-y-6">
          {/* Patient Name */}
          <div>
            <label
              htmlFor={nameId}
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Full Name{' '}
              <span className="text-red-500" aria-label="required">
                *
              </span>
            </label>
            <input
              id={nameId}
              name="patientName"
              type="text"
              value={formData.patientName}
              onChange={handleChange}
              className={`block w-full rounded-md border px-3 py-3 text-base sm:text-sm shadow-sm transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${
                  errors.patientName
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              disabled={isSubmitting}
              aria-invalid={errors.patientName ? 'true' : 'false'}
              aria-describedby={
                errors.patientName ? `${nameId}-error` : undefined
              }
              autoComplete="name"
              required
            />
            {errors.patientName && (
              <p
                id={`${nameId}-error`}
                className="mt-2 text-sm text-red-600 flex items-start"
                role="alert"
              >
                <svg
                  className="w-4 h-4 text-red-500 mr-1 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {errors.patientName}
              </p>
            )}
          </div>

          {/* Patient Email */}
          <div>
            <label
              htmlFor={emailId}
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address{' '}
              <span className="text-red-500" aria-label="required">
                *
              </span>
            </label>
            <input
              id={emailId}
              name="patientEmail"
              type="email"
              value={formData.patientEmail}
              onChange={handleChange}
              className={`block w-full rounded-md border px-3 py-3 text-base sm:text-sm shadow-sm transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${
                  errors.patientEmail
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              disabled={isSubmitting}
              aria-invalid={errors.patientEmail ? 'true' : 'false'}
              aria-describedby={`${emailId}-help ${errors.patientEmail ? `${emailId}-error` : ''}`}
              autoComplete="email"
              required
            />
            {errors.patientEmail && (
              <p
                id={`${emailId}-error`}
                className="mt-2 text-sm text-red-600 flex items-start"
                role="alert"
              >
                <svg
                  className="w-4 h-4 text-red-500 mr-1 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {errors.patientEmail}
              </p>
            )}
            <p id={`${emailId}-help`} className="mt-2 text-xs text-gray-500">
              Appointment confirmation will be sent to this email address.
            </p>
          </div>

          {/* Patient Phone */}
          <div>
            <label
              htmlFor={phoneId}
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Phone Number{' '}
              <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              id={phoneId}
              name="patientPhone"
              type="tel"
              value={formData.patientPhone}
              onChange={handleChange}
              className={`block w-full rounded-md border px-3 py-3 text-base sm:text-sm shadow-sm transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${
                  errors.patientPhone
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              disabled={isSubmitting}
              aria-invalid={errors.patientPhone ? 'true' : 'false'}
              aria-describedby={
                errors.patientPhone ? `${phoneId}-error` : undefined
              }
              autoComplete="tel"
            />
            {errors.patientPhone && (
              <p
                id={`${phoneId}-error`}
                className="mt-2 text-sm text-red-600 flex items-start"
                role="alert"
              >
                <svg
                  className="w-4 h-4 text-red-500 mr-1 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {errors.patientPhone}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor={notesId}
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Additional Notes{' '}
              <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              id={notesId}
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              className={`block w-full rounded-md border px-3 py-3 text-base sm:text-sm shadow-sm transition-colors resize-vertical
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${
                  errors.notes
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              placeholder="Please share any information that might be helpful for your appointment."
              disabled={isSubmitting}
              aria-invalid={errors.notes ? 'true' : 'false'}
              aria-describedby={errors.notes ? `${notesId}-error` : undefined}
            />
            {errors.notes && (
              <p
                id={`${notesId}-error`}
                className="mt-2 text-sm text-red-600 flex items-start"
                role="alert"
              >
                <svg
                  className="w-4 h-4 text-red-500 mr-1 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {errors.notes}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <ButtonWithLoading
          type="submit"
          isLoading={isSubmitting}
          className="w-full py-3 sm:py-2 px-4 border border-transparent rounded-md shadow-sm text-base sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Continue to Review'}
        </ButtonWithLoading>
      </div>
    </form>
  );
};

export default BookingForm;
