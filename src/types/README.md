# Type Definitions Documentation

This directory contains all TypeScript type definitions for the Online Physiotherapy Platform.

## Overview

The type system is organized into several modules, each focusing on a specific domain of the application:

- **appointment.ts** - Appointment booking and management types
- **assessment.ts** - Symptom assessment and patient evaluation types
- **video.ts** - Exercise video library and categorization types
- **donation.ts** - Donation system and payment processing types
- **api.ts** - Common API response types and utilities
- **database.ts** - Supabase database schema types (auto-generated)

## Core Interfaces

### Appointment System

- `Appointment` - Main appointment entity with patient details and scheduling
- `AppointmentFormData` - Form data structure for booking appointments
- `TimeSlot` - Available time slot representation
- `AvailabilityResponse` - Calendar availability data structure

### Symptom Assessment

- `SymptomAssessment` - Complete patient symptom evaluation
- `SymptomDetails` - Detailed symptom information and impact assessment
- `SymptomAssessmentFormData` - Form data for patient assessments
- `BODY_PARTS` - Predefined body parts for pain location selection

### Exercise Video Library

- `ExerciseVideo` - Video entity with metadata and categorization
- `VideoCategory` - Video categorization system
- `ExerciseVideoFormData` - Form data for video management
- `YouTubeVideoInfo` - YouTube API integration types
- `EQUIPMENT_TYPES` - Predefined equipment categories
- `EXERCISE_BODY_PARTS` - Body parts for exercise targeting

### Donation System

- `Donation` - Donation entity with payment tracking
- `DonationFormData` - Form data for donation processing
- `PaymentFormData` - Extended form data with payment method details
- `DonationCampaign` - Campaign management for fundraising goals
- `DONATION_AMOUNTS` - Predefined donation amount options

### API Utilities

- `ApiResponse<T>` - Generic API response wrapper
- `PaginatedResponse<T>` - Paginated data responses
- `LoadingState` - Async operation state management
- `ValidationError` - Form validation error structure
- `CalendarEvent` - Calendar integration types

## Validation Schemas

All forms are validated using Yup schemas defined in `src/utils/validation.ts`:

- `appointmentBookingSchema` - Validates appointment booking forms
- `symptomAssessmentSchema` - Validates symptom assessment forms
- `exerciseVideoSchema` - Validates video management forms
- `donationSchema` - Validates donation forms
- `contactFormSchema` - Validates contact forms
- `searchSchema` - Validates search parameters

## Constants and Configuration

Application-wide constants are defined in `src/utils/constants.ts`:

- `APP_CONFIG` - Application metadata and URLs
- `API_CONFIG` - Third-party service configuration
- `APPOINTMENT_CONFIG` - Appointment booking settings
- `VIDEO_CONFIG` - Video library configuration
- `DONATION_CONFIG` - Donation system settings
- `PAIN_LEVELS` - Pain assessment scale descriptions
- `VALIDATION_LIMITS` - Form validation constraints
- `ERROR_MESSAGES` - Standardized error messages
- `SUCCESS_MESSAGES` - Standardized success messages

## Usage Examples

### Appointment Booking

```typescript
import { Appointment, AppointmentFormData } from '../types';
import { appointmentBookingSchema } from '../utils/validation';

const formData: AppointmentFormData = {
  patientName: 'John Doe',
  patientEmail: 'john@example.com',
  appointmentDate: '2024-01-15',
  appointmentTime: '14:00',
};

// Validate form data
await appointmentBookingSchema.validate(formData);
```

### Symptom Assessment

```typescript
import { SymptomAssessment, BODY_PARTS } from '../types';

const assessment: SymptomAssessment = {
  painLevel: 7,
  painLocation: [BODY_PARTS[2]], // 'Upper Back'
  dailyImpact: 'significant',
  // ... other fields
};
```

### Video Management

```typescript
import { ExerciseVideo, EQUIPMENT_TYPES } from '../types';

const video: ExerciseVideo = {
  title: 'Lower Back Stretches',
  difficulty: 'beginner',
  equipmentRequired: [EQUIPMENT_TYPES[0]], // 'None'
  bodyParts: ['Back', 'Core'],
  // ... other fields
};
```

## Type Safety Features

- **Strict typing** - All interfaces use specific types rather than `any`
- **Union types** - Status fields use literal union types for type safety
- **Optional fields** - Clearly marked with `?` operator
- **Array validation** - Proper typing for array fields with constraints
- **Enum-like constants** - Using `as const` for immutable constant arrays
- **Generic types** - Reusable generic interfaces for API responses
- **Utility types** - Helper types for common patterns (Optional, RequiredFields, etc.)

## Integration with External Services

The type system includes integration types for:

- **Supabase** - Database operations and real-time subscriptions
- **Google Calendar API** - Calendar event management
- **YouTube Data API** - Video metadata and embedding
- **Stripe** - Payment processing and webhooks
- **EmailJS** - Email notification templates

## Validation and Error Handling

- **Yup schemas** - Comprehensive form validation with custom error messages
- **Type guards** - Runtime type checking utilities
- **Error boundaries** - Structured error handling types
- **API error mapping** - Consistent error response structure

This type system provides a solid foundation for type-safe development while maintaining flexibility for future enhancements.
