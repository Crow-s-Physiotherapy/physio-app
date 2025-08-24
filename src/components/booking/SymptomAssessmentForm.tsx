import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import type { SymptomAssessmentFormData } from '../../types/assessment';
import { BODY_PARTS } from '../../types/assessment';
import { symptomAssessmentSchema } from '../../utils/validation';
import { DatePicker } from '../ui/DatePicker';

interface SymptomAssessmentFormProps {
  onSubmit: (data: SymptomAssessmentFormData) => void;
  onBack?: () => void;
  initialData?: Partial<SymptomAssessmentFormData>;
  isLoading?: boolean;
}

export const SymptomAssessmentForm: React.FC<SymptomAssessmentFormProps> = ({
  onSubmit,
  onBack,
  initialData,
  isLoading = false,
}) => {
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>(
    initialData?.painLocation || []
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SymptomAssessmentFormData>({
    resolver: yupResolver(symptomAssessmentSchema) as any,
    defaultValues: {
      patientName: initialData?.patientName || '',
      patientEmail: initialData?.patientEmail || '',
      painLevel: initialData?.painLevel || 5,
      painLocation: initialData?.painLocation || [],
      symptomDuration: initialData?.symptomDuration || '',
      previousTreatments: initialData?.previousTreatments || '',
      currentMedications: initialData?.currentMedications || '',
      primarySymptom: initialData?.primarySymptom || '',
      dailyImpact: initialData?.dailyImpact || 'moderate',
      additionalNotes: initialData?.additionalNotes || '',
      secondarySymptoms: initialData?.secondarySymptoms || [],
      onsetDate: initialData?.onsetDate || '',
      triggerEvents: initialData?.triggerEvents || [],
      worseningFactors: initialData?.worseningFactors || [],
      relievingFactors: initialData?.relievingFactors || [],
    },
  });

  const painLevel = watch('painLevel');

  const handleBodyPartToggle = (bodyPart: string) => {
    const updated = selectedBodyParts.includes(bodyPart)
      ? selectedBodyParts.filter(part => part !== bodyPart)
      : [...selectedBodyParts, bodyPart];

    setSelectedBodyParts(updated);
    setValue('painLocation', updated);
  };

  const getPainLevelColor = (level: number) => {
    if (level <= 3) return 'text-green-600';
    if (level <= 6) return 'text-yellow-600';
    if (level <= 8) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPainLevelDescription = (level: number) => {
    if (level <= 2) return 'Mild discomfort';
    if (level <= 4) return 'Moderate pain';
    if (level <= 6) return 'Significant pain';
    if (level <= 8) return 'Severe pain';
    return 'Extreme pain';
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Symptom Assessment
          </h2>
          <p className="text-gray-600">
            Please provide detailed information about your symptoms to help us
            prepare for your appointment.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Patient Information - Hidden fields that use passed data */}
          <input type="hidden" {...register('patientName')} />
          <input type="hidden" {...register('patientEmail')} />

          {/* Pain Assessment */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pain Assessment
            </h3>

            {/* Pain Level Slider */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Pain Level * (1 = No pain, 10 = Worst pain imaginable)
              </label>
              <div className="px-3">
                <Controller
                  name="painLevel"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="range"
                      min="1"
                      max="10"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  )}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                  <span>6</span>
                  <span>7</span>
                  <span>8</span>
                  <span>9</span>
                  <span>10</span>
                </div>
                <div className="text-center mt-2">
                  <span
                    className={`text-2xl font-bold ${getPainLevelColor(painLevel)}`}
                  >
                    {painLevel}
                  </span>
                  <span className={`ml-2 ${getPainLevelColor(painLevel)}`}>
                    {getPainLevelDescription(painLevel)}
                  </span>
                </div>
              </div>
              {errors.painLevel && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.painLevel.message}
                </p>
              )}
            </div>

            {/* Pain Location */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Pain Location * (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {BODY_PARTS.map(bodyPart => (
                  <button
                    key={bodyPart}
                    type="button"
                    onClick={() => handleBodyPartToggle(bodyPart)}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors cursor-pointer ${
                      selectedBodyParts.includes(bodyPart)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {bodyPart}
                  </button>
                ))}
              </div>
              {errors.painLocation && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.painLocation.message}
                </p>
              )}
            </div>
          </div>

          {/* Symptom Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Symptom Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Symptom *
                </label>
                <input
                  {...register('primarySymptom')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Lower back pain, Neck stiffness"
                />
                {errors.primarySymptom && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.primarySymptom.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptom Duration *
                </label>
                <select
                  {...register('symptomDuration')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select duration</option>
                  <option value="less-than-1-week">Less than 1 week</option>
                  <option value="1-2-weeks">1-2 weeks</option>
                  <option value="2-4-weeks">2-4 weeks</option>
                  <option value="1-3-months">1-3 months</option>
                  <option value="3-6-months">3-6 months</option>
                  <option value="6-12-months">6-12 months</option>
                  <option value="more-than-1-year">More than 1 year</option>
                </select>
                {errors.symptomDuration && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.symptomDuration.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  When did symptoms start?
                </label>
                <Controller
                  name="onsetDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      selectedDate={field.value ? new Date(field.value) : null}
                      onDateSelect={date =>
                        field.onChange(date.toISOString().split('T')[0])
                      }
                      minDate={new Date(new Date().getFullYear() - 10, 0, 1)} // Allow dates up to 10 years ago
                      maxDate={new Date()}
                      placeholder="Select when symptoms started"
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Impact *
                </label>
                <select
                  {...register('dailyImpact')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="minimal">Minimal - Barely noticeable</option>
                  <option value="moderate">Moderate - Some limitation</option>
                  <option value="significant">
                    Significant - Major limitation
                  </option>
                  <option value="severe">
                    Severe - Unable to perform activities
                  </option>
                </select>
                {errors.dailyImpact && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.dailyImpact.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Medical History */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Medical History
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Previous Treatments *
                </label>
                <textarea
                  {...register('previousTreatments')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Please describe any previous treatments, therapies, or interventions you've tried for this condition..."
                />
                {errors.previousTreatments && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.previousTreatments.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Medications *
                </label>
                <textarea
                  {...register('currentMedications')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Please list all current medications, supplements, or pain relievers you're taking (or write 'None' if not applicable)..."
                />
                {errors.currentMedications && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.currentMedications.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Additional Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                {...register('additionalNotes')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional information you'd like to share about your condition, concerns, or goals for treatment..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                disabled={isLoading}
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
                Back
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold cursor-pointer"
            >
              {isLoading ? (
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
                  Submitting...
                </>
              ) : (
                <>
                  Continue to Confirmation
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
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SymptomAssessmentForm;
