// Validation utilities and schemas

import * as yup from 'yup';
import { API_CONFIG } from './constants';
import { BODY_PARTS } from '../types/assessment';
import { EQUIPMENT_TYPES, EXERCISE_BODY_PARTS } from '../types/video';
import { SUPPORTED_CURRENCIES } from '../types/donation';

/**
 * Validates that all required environment variables are present
 */
export const validateEnvironmentConfig = (): void => {
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);

  if (missingVars.length > 0) {
    console.warn('Missing environment variables:', missingVars.join(', '));
    console.warn(
      'Please check your .env file and ensure all required variables are set.'
    );
  }
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format (basic validation)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Validates YouTube URL format
 */
export const isValidYouTubeUrl = (url: string): boolean => {
  const youtubeRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
  return youtubeRegex.test(url);
};

// YouTube ID extraction moved to videoService.ts to avoid duplication

/**
 * Validates that API configuration is properly set
 */
export const validateApiConfig = (): boolean => {
  const { supabase } = API_CONFIG;

  if (!supabase.url || !supabase.anonKey) {
    console.error('Supabase configuration is incomplete');
    return false;
  }

  return true;
};

// Yup validation schemas

// Appointment booking validation schema
export const appointmentBookingSchema = yup.object({
  patientName: yup
    .string()
    .required('Patient name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  patientEmail: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  patientPhone: yup
    .string()
    .optional()
    .test('phone', 'Please enter a valid phone number', value => {
      if (!value) return true; // Optional field
      return isValidPhone(value);
    }),
  appointmentDate: yup
    .string()
    .required('Appointment date is required')
    .test('future-date', 'Appointment must be in the future', value => {
      if (!value) return false;
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }),
  appointmentTime: yup
    .string()
    .required('Appointment time is required')
    .matches(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Please enter a valid time format (HH:MM)'
    ),
  notes: yup
    .string()
    .optional()
    .max(500, 'Notes must be less than 500 characters'),
});

// Symptom assessment validation schema
export const symptomAssessmentSchema = yup.object({
  patientName: yup
    .string()
    .required('Patient name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  patientEmail: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  painLevel: yup
    .number()
    .required('Pain level is required')
    .min(1, 'Pain level must be between 1 and 10')
    .max(10, 'Pain level must be between 1 and 10')
    .integer('Pain level must be a whole number'),
  painLocation: yup
    .array()
    .of(yup.string().oneOf(BODY_PARTS, 'Invalid body part selected'))
    .min(1, 'Please select at least one pain location')
    .required('Pain location is required'),
  symptomDuration: yup
    .string()
    .required('Symptom duration is required')
    .max(100, 'Duration description must be less than 100 characters'),
  previousTreatments: yup
    .string()
    .required('Previous treatments information is required')
    .max(500, 'Previous treatments must be less than 500 characters'),
  currentMedications: yup
    .string()
    .required('Current medications information is required')
    .max(500, 'Current medications must be less than 500 characters'),
  additionalNotes: yup
    .string()
    .optional()
    .max(1000, 'Additional notes must be less than 1000 characters'),
  primarySymptom: yup
    .string()
    .required('Primary symptom is required')
    .max(200, 'Primary symptom must be less than 200 characters'),
  secondarySymptoms: yup
    .array()
    .of(yup.string().max(200, 'Each symptom must be less than 200 characters'))
    .optional(),
  onsetDate: yup
    .string()
    .optional()
    .test('valid-date', 'Please enter a valid date', value => {
      if (!value) return true;
      const date = new Date(value);
      return !isNaN(date.getTime()) && date <= new Date();
    }),
  triggerEvents: yup
    .array()
    .of(
      yup
        .string()
        .max(200, 'Each trigger event must be less than 200 characters')
    )
    .optional(),
  worseningFactors: yup
    .array()
    .of(yup.string().max(200, 'Each factor must be less than 200 characters'))
    .optional(),
  relievingFactors: yup
    .array()
    .of(yup.string().max(200, 'Each factor must be less than 200 characters'))
    .optional(),
  dailyImpact: yup
    .string()
    .required('Daily impact assessment is required')
    .oneOf(
      ['minimal', 'moderate', 'significant', 'severe'],
      'Please select a valid impact level'
    ),
});

// Exercise video validation schema
export const exerciseVideoSchema = yup.object({
  title: yup
    .string()
    .required('Video title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: yup
    .string()
    .required('Video description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  youtubeUrl: yup
    .string()
    .required('YouTube URL is required')
    .test('youtube-url', 'Please enter a valid YouTube URL', isValidYouTubeUrl),
  categoryId: yup.string().required('Video category is required'),
  difficulty: yup
    .string()
    .required('Difficulty level is required')
    .oneOf(
      ['beginner', 'intermediate', 'advanced'],
      'Please select a valid difficulty level'
    ),
  duration: yup
    .number()
    .required('Video duration is required')
    .min(1, 'Duration must be at least 1 minute')
    .max(120, 'Duration must be less than 120 minutes')
    .integer('Duration must be a whole number'),
  equipmentRequired: yup
    .array()
    .of(yup.string().oneOf(EQUIPMENT_TYPES, 'Invalid equipment type'))
    .optional(),
  bodyParts: yup
    .array()
    .of(yup.string().oneOf(EXERCISE_BODY_PARTS, 'Invalid body part'))
    .min(1, 'Please select at least one body part')
    .required('Body parts are required'),
  tags: yup
    .array()
    .of(yup.string().max(50, 'Each tag must be less than 50 characters'))
    .optional(),
  isActive: yup.boolean().required('Active status is required'),
});

// Video category validation schema
export const videoCategorySchema = yup.object({
  name: yup
    .string()
    .required('Category name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  description: yup
    .string()
    .required('Category description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  icon: yup
    .string()
    .optional()
    .max(100, 'Icon name must be less than 100 characters'),
});

// Donation validation schema
export const donationSchema = yup.object({
  donorName: yup
    .string()
    .optional()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  donorEmail: yup
    .string()
    .optional()
    .email('Please enter a valid email address'),
  amount: yup
    .number()
    .required('Donation amount is required')
    .min(1, 'Minimum donation amount is $1')
    .max(10000, 'Maximum donation amount is $10,000')
    .test('decimal', 'Amount must have at most 2 decimal places', value => {
      if (!value) return false;
      return Number(value.toFixed(2)) === value;
    }),
  currency: yup
    .string()
    .required('Currency is required')
    .oneOf(SUPPORTED_CURRENCIES, 'Unsupported currency'),
  donationType: yup
    .string()
    .required('Donation type is required')
    .oneOf(['one_time', 'monthly'], 'Invalid donation type'),
  message: yup
    .string()
    .optional()
    .max(500, 'Message must be less than 500 characters'),
  isAnonymous: yup.boolean().required('Anonymous preference is required'),
});

// Contact form validation schema
export const contactFormSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  subject: yup
    .string()
    .required('Subject is required')
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),
  message: yup
    .string()
    .required('Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters'),
});

// Search validation schema
export const searchSchema = yup.object({
  query: yup
    .string()
    .optional()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must be less than 100 characters'),
  category: yup.string().optional(),
  difficulty: yup
    .string()
    .optional()
    .oneOf(
      ['beginner', 'intermediate', 'advanced'],
      'Invalid difficulty level'
    ),
  bodyPart: yup
    .string()
    .optional()
    .oneOf(EXERCISE_BODY_PARTS, 'Invalid body part'),
  equipment: yup
    .string()
    .optional()
    .oneOf(EQUIPMENT_TYPES, 'Invalid equipment type'),
});

// Export all schemas for easy access
export const validationSchemas = {
  appointmentBooking: appointmentBookingSchema,
  symptomAssessment: symptomAssessmentSchema,
  exerciseVideo: exerciseVideoSchema,
  videoCategory: videoCategorySchema,
  donation: donationSchema,
  contactForm: contactFormSchema,
  search: searchSchema,
};
