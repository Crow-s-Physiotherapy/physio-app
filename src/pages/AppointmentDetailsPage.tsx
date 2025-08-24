import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAppointmentDetails,
  formatAppointmentDateTime,
  canCancelAppointment,
  getStatusDisplay,
  type AppointmentDetails,
} from '../services/appointmentDetailsService';
import { useToast } from '../contexts/ToastContext';

const AppointmentDetailsPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [appointment, setAppointment] = useState<AppointmentDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleCancelClick = () => {
    if (appointment) {
      navigate(`/cancel/${appointment.id}`);
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
            Error Loading Appointment
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
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

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-gray-400 text-5xl mb-4">📅</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Appointment Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The appointment you're looking for doesn't exist or may have been
            removed.
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

  const statusDisplay = getStatusDisplay(appointment.status);
  const canCancel = canCancelAppointment(appointment);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Appointment Details
              </h1>
              <p className="text-gray-600 mt-1">
                Appointment ID: {appointment.id}
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.color}`}
            >
              {statusDisplay.text}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appointment Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Appointment Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date & Time
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatAppointmentDateTime(
                    appointment.appointmentDate,
                    appointment.appointmentTime
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Duration
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {appointment.duration} minutes
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Patient Name
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {appointment.patientName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {appointment.patientEmail}
                </p>
              </div>

              {appointment.patientPhone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {appointment.patientPhone}
                  </p>
                </div>
              )}

              {appointment.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {appointment.notes}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Created
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(appointment.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Symptom Assessment */}
          {appointment.symptomAssessment && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Symptom Assessment
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pain Level
                  </label>
                  <div className="mt-1 flex items-center">
                    <span className="text-2xl font-bold text-red-600">
                      {appointment.symptomAssessment.painLevel}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">/10</span>
                  </div>
                </div>

                {appointment.symptomAssessment.primarySymptom && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Primary Symptom
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {appointment.symptomAssessment.primarySymptom}
                    </p>
                  </div>
                )}

                {appointment.symptomAssessment.painLocations &&
                  appointment.symptomAssessment.painLocations.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Pain Locations
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {appointment.symptomAssessment.painLocations.join(', ')}
                      </p>
                    </div>
                  )}

                {appointment.symptomAssessment.symptomDuration && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Duration
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {appointment.symptomAssessment.symptomDuration.replace(
                        /-/g,
                        ' '
                      )}
                    </p>
                  </div>
                )}

                {appointment.symptomAssessment.dailyImpact && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Daily Impact
                    </label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {appointment.symptomAssessment.dailyImpact}
                    </p>
                  </div>
                )}

                {appointment.symptomAssessment.previousTreatments && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Previous Treatments
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {appointment.symptomAssessment.previousTreatments}
                    </p>
                  </div>
                )}

                {appointment.symptomAssessment.currentMedications && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Current Medications
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {appointment.symptomAssessment.currentMedications}
                    </p>
                  </div>
                )}

                {appointment.symptomAssessment.additionalNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Additional Notes
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {appointment.symptomAssessment.additionalNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Home
            </button>

            {canCancel && (
              <button
                onClick={handleCancelClick}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Cancel Appointment
              </button>
            )}

            {appointment.status === 'cancelled' && (
              <div className="flex items-center text-red-600">
                <span className="text-sm">
                  This appointment has been cancelled
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsPage;
