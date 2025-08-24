// Symptom assessment-related type definitions

export interface SymptomAssessment {
  id: string;
  appointmentId?: string;
  patientName: string;
  patientEmail: string;
  painLevel: number; // 1-10 scale
  painLocation: string[];
  symptomDuration: string;
  previousTreatments: string;
  currentMedications: string;
  additionalNotes: string;
  symptoms: SymptomDetails;
  assessmentDate: Date;
  recommendations?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SymptomDetails {
  primarySymptom: string;
  secondarySymptoms: string[];
  onsetDate?: Date;
  triggerEvents?: string[];
  worseningFactors?: string[];
  relievingFactors?: string[];
  dailyImpact: 'minimal' | 'moderate' | 'significant' | 'severe';
}

// Form data types for symptom assessment
export interface SymptomAssessmentFormData {
  patientName: string;
  patientEmail: string;
  painLevel: number;
  painLocation: string[];
  symptomDuration: string;
  previousTreatments: string;
  currentMedications: string;
  additionalNotes: string;
  primarySymptom: string;
  secondarySymptoms: string[];
  onsetDate?: string;
  triggerEvents: string[];
  worseningFactors: string[];
  relievingFactors: string[];
  dailyImpact: 'minimal' | 'moderate' | 'significant' | 'severe';
}

// API response types
export interface SymptomAssessmentResponse {
  assessment: SymptomAssessment;
  success: boolean;
  message?: string;
}

export interface AssessmentsListResponse {
  assessments: SymptomAssessment[];
  total: number;
  page: number;
  limit: number;
}

// Utility types
export type PainLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type DailyImpact = SymptomDetails['dailyImpact'];

export interface AssessmentFilters {
  patientEmail?: string;
  painLevelMin?: number;
  painLevelMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  primarySymptom?: string;
}

// Common body parts for pain location
export const BODY_PARTS = [
  'Head/Neck',
  'Shoulders',
  'Upper Back',
  'Lower Back',
  'Arms',
  'Elbows',
  'Wrists/Hands',
  'Chest',
  'Abdomen',
  'Hips',
  'Thighs',
  'Knees',
  'Calves',
  'Ankles/Feet',
] as const;

export type BodyPart = (typeof BODY_PARTS)[number];
