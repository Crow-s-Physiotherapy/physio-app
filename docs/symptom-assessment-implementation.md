# Symptom Assessment Implementation Documentation

## Overview

The symptom assessment feature has been successfully implemented as part of the appointment booking flow. This comprehensive system collects detailed patient information before appointments, providing physiotherapists with valuable insights for treatment preparation.

## Architecture

### Data Flow
1. **Patient Booking** → Completes appointment details
2. **Symptom Assessment** → Fills comprehensive health intake form
3. **Database Storage** → Assessment linked to appointment via foreign key
4. **Calendar Integration** → Clean event created with database references
5. **Patient Notification** → Calendar invitation with appointment and cancellation links

### Database Schema

#### Appointments Table
```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_name VARCHAR(255) NOT NULL,
    patient_email VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(50),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER DEFAULT 60,
    status VARCHAR(20) DEFAULT 'scheduled',
    google_event_id VARCHAR(255) UNIQUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Symptom Assessments Table
```sql
CREATE TABLE symptom_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_email VARCHAR(255) NOT NULL,
    pain_level INTEGER CHECK (pain_level >= 1 AND pain_level <= 10) NOT NULL,
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    symptoms JSONB NOT NULL DEFAULT '{}',
    primary_symptom VARCHAR(255),
    pain_locations TEXT[],
    symptom_duration VARCHAR(50),
    daily_impact VARCHAR(20),
    previous_treatments TEXT,
    current_medications TEXT,
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Implementation Components

### 1. Symptom Assessment Form (`src/components/booking/SymptomAssessmentForm.tsx`)

**Features:**
- Interactive pain level slider (1-10 scale) with color-coded feedback
- Body part selection grid with toggle functionality
- Comprehensive medical history collection
- Form validation using Yup schema
- Responsive design for mobile and desktop

**Key Form Fields:**
- Patient information (name, email)
- Pain assessment (level, location, duration)
- Symptom details (primary/secondary, onset, triggers)
- Medical history (treatments, medications)
- Daily impact assessment
- Additional notes

### 2. Database Services

#### Assessment Service (`src/services/assessmentService.ts`)
- CRUD operations for symptom assessments
- Data validation and transformation
- Assessment summary generation
- Patient history retrieval

#### Edge Functions
- **`new-appointment`**: Creates appointment and linked assessment
- **`get-appointment`**: Retrieves appointment with assessment data
- **`cancel-appointment`**: Handles appointment cancellation

### 3. Booking Flow Integration

**Updated Booking Steps:**
1. Date Selection
2. Time Selection  
3. Patient Details
4. **Symptom Assessment** ← New step
5. Confirmation
6. Success

### 4. Calendar Integration

**Google Calendar Features:**
- Patient added as attendee with automatic invitation
- Clean event description with database references
- Appointment details and cancellation links included
- Professional appearance for physiotherapist

**Calendar Event Format:**
```
Subject: Physiotherapy - [Patient Name]

Description:
Patient: [Name]
Email: [Email]
Phone: [Phone]

Appointment ID: [UUID]
Assessment ID: [UUID]

📋 View Details: [URL]
❌ Cancel Appointment: [URL]

For questions, please contact the clinic directly.
```

## API Endpoints

### Create Appointment with Assessment
```typescript
POST /functions/v1/new-appointment
{
  "startTime": "2025-07-29T11:00:00.000Z",
  "endTime": "2025-07-29T12:00:00.000Z",
  "patientName": "John Doe",
  "patientEmail": "john@example.com",
  "patientPhone": "+1234567890",
  "symptomAssessment": {
    "painLevel": 6,
    "painLocation": ["Lower Back"],
    "primarySymptom": "Lower back pain",
    "symptomDuration": "2-4-weeks",
    "dailyImpact": "moderate",
    "previousTreatments": "Physical therapy",
    "currentMedications": "Ibuprofen",
    "additionalNotes": "Pain worse in mornings"
  }
}
```

### Get Appointment Details
```typescript
POST /functions/v1/get-appointment
{
  "appointmentId": "uuid-here"
}
```

### Cancel Appointment
```typescript
POST /functions/v1/cancel-appointment
{
  "appointmentId": "uuid-here",
  "reason": "Schedule conflict"
}
```

## User Experience

### Patient Journey
1. **Booking**: Selects date/time and enters basic details
2. **Assessment**: Completes comprehensive symptom form
3. **Confirmation**: Reviews all information before submitting
4. **Notification**: Receives calendar invitation with appointment details
5. **Management**: Can view details or cancel via provided links

### Physiotherapist Experience
1. **Calendar Event**: Clean, professional appointment in Google Calendar
2. **Patient Preparation**: Access to detailed symptom information via appointment ID
3. **Treatment Planning**: Comprehensive patient history and current symptoms
4. **Professional Workflow**: Seamless integration with existing calendar system

## Security & Privacy

### Data Protection
- Row Level Security (RLS) policies on all tables
- Service role access for Edge Functions only
- Patient data encrypted in transit and at rest
- HIPAA-compliant data handling practices

### Access Control
- Appointments and assessments managed via service role only
- No direct database access from frontend
- Secure Edge Function authentication
- Proper error handling without data exposure

## Performance Optimizations

### Database
- Proper indexes on frequently queried fields
- GIN indexes for JSONB symptom data
- Foreign key relationships for data integrity
- Efficient query patterns in Edge Functions

### Frontend
- Form validation with immediate feedback
- Optimistic UI updates
- Proper loading states and error handling
- Mobile-responsive design

## Testing & Quality Assurance

### Validation
- Form field validation with Yup schemas
- Database constraint validation
- API input/output validation
- Error boundary implementation

### Error Handling
- Graceful degradation for failed operations
- User-friendly error messages
- Comprehensive logging for debugging
- Fallback mechanisms for data retrieval

## Deployment Notes

### Environment Variables Required
- `SUPABASE_URL`: Database connection
- `SUPABASE_SERVICE_ROLE_KEY`: Service authentication
- `GOOGLE_CLIENT_ID`: Calendar API access
- `GOOGLE_CLIENT_SECRET`: Calendar API secret
- `GOOGLE_REFRESH_TOKEN`: Long-lived calendar access
- `SITE_URL`: Base URL for appointment links

### Database Migration
Run the deployment script to create all necessary tables, indexes, and policies:
```sql
-- Execute supabase/database/consolidated_schema.sql in Supabase SQL Editor
```

## Future Enhancements

### Potential Improvements
- Assessment templates for different conditions
- Progress tracking across multiple appointments
- Integration with electronic health records
- Advanced analytics and reporting
- Multi-language support for forms
- Automated follow-up assessments

### Scalability Considerations
- Assessment data archiving strategy
- Performance monitoring for large datasets
- Caching strategies for frequently accessed data
- Load balancing for high-traffic periods

## Conclusion

The symptom assessment implementation successfully transforms the basic appointment booking system into a comprehensive patient intake platform. The solution provides:

- **Professional patient experience** with comprehensive health intake
- **Valuable clinical data** for physiotherapists
- **Seamless workflow integration** with existing calendar systems
- **Scalable architecture** for future enhancements
- **Security-first approach** for sensitive health data

The implementation follows healthcare industry best practices while maintaining ease of use for both patients and practitioners.