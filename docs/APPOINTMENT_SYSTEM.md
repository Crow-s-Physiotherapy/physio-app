# Appointment Booking System - Backend Logic

This document describes the implementation of the appointment booking system backend logic, covering all the requirements for Task 7.

## Overview

The appointment booking system provides comprehensive backend functionality for managing physiotherapy appointments with the following key features:

- **Appointment Creation**: Full appointment creation with database operations
- **Availability Checking**: Integration with Google Calendar for real-time availability
- **Double-booking Prevention**: Robust validation to prevent scheduling conflicts
- **Appointment Management**: Update and cancellation functionality
- **Email Notifications**: Automated email notifications using EmailJS
- **Calendar Integration**: Two-way sync with Google Calendar

## Requirements Fulfilled

- ✅ **1.1**: Implement appointment creation service with database operations
- ✅ **1.3**: Create availability checking logic that integrates with Google Calendar
- ✅ **1.4**: Build appointment validation to prevent double-booking
- ✅ **1.5**: Implement appointment update and cancellation functionality
- ✅ **1.6**: Add email notification service using EmailJS for booking confirmations

## Architecture

### Core Services

#### 1. Appointment Service (`src/services/appointmentService.ts`)
The main service that orchestrates all appointment-related operations:

```typescript
// Create appointment with Edge Functions (RECOMMENDED)
const appointment = await createAppointmentWithEdgeFunction(
  {
    patientName: 'John Doe',
    patientEmail: 'john@example.com',
    appointmentDate: '2025-08-01',
    appointmentTime: '10:00',
    notes: 'Regular checkup'
  },
  symptomAssessment, // SymptomAssessmentFormData
  60 // duration in minutes
);
```

**Key Functions:**
- `createAppointmentWithEdgeFunction()`: Creates new appointments via Edge Functions (RECOMMENDED)
- `updateAppointmentWithEdgeFunction()`: Updates existing appointments via Edge Functions
- `cancelAppointmentWithEdgeFunction()`: Cancels appointments via Edge Functions
- ~~`createAppointment()`~~: Legacy function (DEPRECATED)
- ~~`updateAppointment()`~~: Legacy function (DEPRECATED)  
- ~~`cancelAppointment()`~~: Legacy function (DEPRECATED)
- `getAvailableTimeSlots()`: Returns available booking slots
- `checkTimeSlotAvailability()`: Validates specific time slot availability
- `validateAppointmentData()`: Comprehensive data validation
- `getUserAppointments()`: Retrieves user's appointments with filtering

#### 2. Google Calendar Integration (`src/services/googleCalendar.ts`)
Handles all Google Calendar API interactions:

```typescript
// Get available time slots
const slots = await getAvailableTimeSlots(startDate, endDate, 60);

// Create calendar event
const eventId = await createCalendarEvent(appointment);

// Update calendar event
await updateCalendarEvent(appointment);
```

**Key Functions:**
- `initGoogleCalendarApi()`: Initialize Google Calendar API
- `authenticateWithGoogle()`: OAuth 2.0 authentication
- `getAvailableTimeSlots()`: Fetch available time slots
- `createCalendarEvent()`: Create calendar events
- `updateCalendarEvent()`: Update calendar events
- `deleteCalendarEvent()`: Delete calendar events
- `syncAppointmentsWithCalendar()`: Two-way synchronization

#### 3. Email Service (`src/services/emailService.ts`)
Manages email notifications using EmailJS:

```typescript
// Send confirmation email
await sendAppointmentConfirmation(appointment);

// Send update notification
await sendAppointmentUpdate(appointment);

// Send cancellation notice
await sendAppointmentCancellation(appointment);
```

**Key Functions:**
- `sendAppointmentConfirmation()`: Booking confirmation emails
- `sendAppointmentUpdate()`: Update notification emails
- `sendAppointmentCancellation()`: Cancellation emails
- `sendAppointmentReminder()`: Reminder emails
- `sendBulkReminders()`: Batch reminder processing

#### 4. Database Service (`src/services/database.ts`)
Provides database operations using Supabase:

```typescript
// Create appointment via Edge Function (NEW APPROACH)
const appointment = await createAppointmentWithEdgeFunction(formData, symptomAssessment, duration);

// Get appointments via Edge Function
const appointments = await getAppointmentsWithEdgeFunction(startDate, endDate);

// Legacy database approach (DEPRECATED)
// const dbAppointment = await appointmentsService.create(appointmentData);
```

### React Hook Integration

#### useCalendar Hook (`src/hooks/useCalendar.ts`)
Provides React components with calendar functionality:

```typescript
const {
  isAuthenticated,
  authenticate,
  availableTimeSlots,
  fetchAvailableTimeSlots,
  createAppointmentEvent,
  updateAppointmentEvent,
  cancelAppointmentEvent
} = useCalendar();
```

## Database Schema

### Appointments Table
```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_email VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(50) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER DEFAULT 60,
    status VARCHAR(20) CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')) DEFAULT 'scheduled',
    google_event_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Indexes
- `idx_appointments_user_id`: Fast user appointment lookups
- `idx_appointments_date`: Date-based queries
- `idx_appointments_status`: Status filtering
- `idx_appointments_google_event_id`: Calendar integration
- `idx_appointments_duration`: Duration-based filtering

## Validation Rules

### Business Rules
- **Working Hours**: 9:00 AM to 5:00 PM
- **Working Days**: Monday to Friday only
- **Duration Limits**: 15 to 180 minutes
- **Future Booking**: Appointments must be in the future
- **No Double-booking**: Prevents scheduling conflicts

### Data Validation
- **Required Fields**: Patient name, email, date, time
- **Email Format**: Valid email address format
- **Phone Format**: Optional but validated if provided
- **Date Format**: ISO date strings for forms
- **Time Format**: 24-hour time format

## Error Handling

### Graceful Degradation
The system is designed to handle failures gracefully:

1. **Calendar Sync Failures**: Appointments are still created in the database
2. **Email Failures**: Appointments proceed without blocking
3. **Authentication Issues**: Clear error messages and retry mechanisms
4. **Network Issues**: Proper error handling and user feedback

### Error Types
```typescript
// Validation errors
throw new Error('Appointment validation failed: Invalid email address');

// Availability errors
throw new Error('The selected time slot is not available');

// Authorization errors
throw new Error('Unauthorized to update this appointment');

// System errors
throw new Error('Failed to retrieve appointments. Please try again.');
```

## Testing

### Comprehensive Test Coverage
- **Unit Tests**: All service functions tested
- **Integration Tests**: Database and API interactions
- **Validation Tests**: All business rules covered
- **Error Handling Tests**: Failure scenarios tested

### Test Files
- `src/services/__tests__/appointmentService.test.ts`: Main service tests
- `src/services/__tests__/googleCalendar.test.ts`: Calendar integration tests
- `src/hooks/__tests__/useCalendar.test.tsx`: React hook tests

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --run src/services/__tests__/appointmentService.test.ts

# Run tests in watch mode
npm test -- --watch
```

## Configuration

### Environment Variables
```env
# Google Calendar API
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_API_KEY=your_google_api_key

# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
VITE_EMAILJS_TEMPLATE_ID_CONFIRMATION=confirmation_template_id
VITE_EMAILJS_TEMPLATE_ID_UPDATE=update_template_id
VITE_EMAILJS_TEMPLATE_ID_CANCELLATION=cancellation_template_id
VITE_EMAILJS_TEMPLATE_ID_REMINDER=reminder_template_id

# Supabase Database
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Usage Examples

### Creating an Appointment
```typescript
import { createAppointmentWithEdgeFunction } from './services/appointmentService';

const newAppointment = await createAppointmentWithEdgeFunction(
  {
    patientName: 'John Doe',
    patientEmail: 'john@example.com',
    patientPhone: '+1234567890',
    appointmentDate: '2025-08-01',
    appointmentTime: '10:00',
    notes: 'Regular checkup'
  },
  symptomAssessment, // SymptomAssessmentFormData
  60 // duration in minutes
);
```

### Checking Availability
```typescript
import { getAvailableTimeSlots } from './services/appointmentService';

const availableSlots = await getAvailableTimeSlots({
  startDate: new Date('2025-08-01'),
  endDate: new Date('2025-08-07'),
  duration: 60
});
```

### Updating an Appointment
```typescript
import { updateAppointmentWithEdgeFunction } from './services/appointmentService';

const updatedAppointment = await updateAppointmentWithEdgeFunction(
  'google-event-id-123', // eventId from Google Calendar
  {
    patientName: 'John Doe',
    patientEmail: 'john@example.com',
    appointmentDate: '2025-08-02',
    appointmentTime: '14:00',
    notes: 'Rescheduled appointment'
  },
  updatedSymptomAssessment, // Optional SymptomAssessmentFormData
  60 // duration in minutes
);
```

### Cancelling an Appointment
```typescript
import { cancelAppointmentWithEdgeFunction } from './services/appointmentService';

await cancelAppointmentWithEdgeFunction('google-event-id-123');
```

## Performance Considerations

### Database Optimization
- Proper indexing for fast queries
- Efficient date range queries
- Connection pooling via Supabase

### Calendar API Optimization
- Batch operations where possible
- Caching of availability data
- Rate limiting compliance

### Email Service Optimization
- Asynchronous email sending
- Bulk operations for reminders
- Graceful failure handling

## Security

### Data Protection
- Input validation and sanitization
- SQL injection prevention via Supabase
- Secure API key management

### Authorization
- User-based appointment access control
- Ownership verification for updates/cancellations
- Secure OAuth 2.0 implementation

## Migration

### Database Migration
Run the migration script to update existing installations:

```sql
-- Run the migration
\i supabase/database/migrations/001_add_appointment_fields.sql
```

This adds the required `duration` and `google_event_id` columns and updates the status constraints.

## Monitoring and Logging

### Error Logging
- Comprehensive error logging for debugging
- Calendar sync failure tracking
- Email delivery monitoring

### Performance Monitoring
- Database query performance
- API response times
- User experience metrics

## Future Enhancements

### Potential Improvements
1. **Recurring Appointments**: Support for recurring appointment patterns
2. **Waitlist Management**: Automatic booking from waitlists
3. **SMS Notifications**: Additional notification channels
4. **Advanced Scheduling**: Multi-therapist scheduling
5. **Analytics Dashboard**: Appointment analytics and reporting

## Conclusion

The appointment booking system provides a robust, scalable solution for managing physiotherapy appointments with comprehensive validation, calendar integration, and email notifications. The system is designed for reliability, performance, and ease of use while maintaining data integrity and security.