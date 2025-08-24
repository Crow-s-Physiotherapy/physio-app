import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAppointmentDetails,
  cancelAppointment,
  formatAppointmentDateTime,
  canCancelAppointment,
  type AppointmentDetails,
} from '../services/appointmentDetailsService';
import { useToast } from '../contexts/ToastContext';

const CancelAppointmentPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [appointment, setAppointment] = useState<AppointmentDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) {
        const errorMessage = 'No appointment ID provided';
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const appointmentData = await getAppointmentDetails(appointmentId);
        setAppointment(appointmentData);

        // Check if appointment can be cancelled
        if (!canCancelAppointment(appointmentData)) {
          if (appointmentData.status === 'cancelled') {
            const errorMessage = 'This appointment is already cancelled';
            setError(errorMessage);
            toast.error(errorMessage);
          } else {
            const errorMessage =
              'This appointment cannot be cancelled (it may be in the past)';
            setError(errorMessage);
            toast.error(errorMessage);
          }
        }
      } catch (err) {
        console.error('Error fetching appointment:', err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to load appointment details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId]);

  const handleCancel = async () => {
    if (!appointment || !appointmentId) return;

    try {
      setCancelling(true);
      setError(null);

      await cancelAppointment(appointmentId, reason || 'Cancelled by patient');
      setCancelled(true);

      // Update local appointment state
      setAppointment({
        ...appointment,
        status: 'cancelled',
      });
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to cancel appointment';
      toast.error(errorMessage);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Cannot Cancel Appointment
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Go Home
            </button>
            {appointmentId && (
              <button
                onClick={() => navigate(`/appointment/${appointmentId}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-gray-400 text-5xl mb-4">📅</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Appointment Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The appointment you're trying to cancel doesn't exist.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-green-500 text-5xl mb-4">✅</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Appointment Cancelled
          </h1>
          <p className="text-gray-600 mb-4">
            Your appointment has been successfully cancelled. You should receive
            a calendar update shortly.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
            <h3 className="font-medium text-gray-900 mb-2">
              Cancelled Appointment:
            </h3>
            <p className="text-sm text-gray-600">
              {formatAppointmentDateTime(
                appointment.appointmentDate,
                appointment.appointmentTime
              )}
            </p>
            <p className="text-sm text-gray-600">
              Patient: {appointment.patientName}
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go Home
            </button>
            <button
              onClick={() => navigate('/booking')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Book New Appointment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Cancel Appointment
            </h1>
            <p className="text-gray-600">
              Are you sure you want to cancel this appointment?
            </p>
          </div>

          {/* Appointment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">
              Appointment Details:
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date & Time:</span>
                <span className="text-gray-900">
                  {formatAppointmentDateTime(
                    appointment.appointmentDate,
                    appointment.appointmentTime
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="text-gray-900">
                  {appointment.duration} minutes
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Patient:</span>
                <span className="text-gray-900">{appointment.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="text-gray-900">
                  {appointment.patientEmail}
                </span>
              </div>
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="mb-6">
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Reason for cancellation (optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Please let us know why you're cancelling (optional)..."
              disabled={cancelling}
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-yellow-400 mr-3">⚠️</div>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">
                  Please note:
                </h4>
                <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                  <li>This action cannot be undone</li>
                  <li>You will receive a calendar update</li>
                  <li>Please provide at least 24 hours notice when possible</li>
                  <li>You can book a new appointment at any time</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate(`/appointment/${appointmentId}`)}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={cancelling}
            >
              Keep Appointment
            </button>

            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Appointment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelAppointmentPage;
