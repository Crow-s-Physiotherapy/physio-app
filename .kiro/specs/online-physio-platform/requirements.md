# Requirements Document

## Introduction

This document outlines the requirements for an MVP online physiotherapy platform that enables a physiotherapist to manage appointments and provide educational content to patients. The platform will integrate donation functionality, appointment booking with symptom assessment, and categorized exercise videos from YouTube, all while maintaining seamless calendar synchronization using a free backend solution.

## Requirements

### Requirement 1: Appointment Booking System

**User Story:** As a patient, I want to book physiotherapy sessions based on the therapist's availability, so that I can receive timely treatment for my condition.

#### Acceptance Criteria

1. WHEN a patient views the booking page THEN the system SHALL display available time slots from the physiotherapist's Google Calendar
2. WHEN a patient selects a time slot THEN the system SHALL require completion of a symptom assessment form
3. WHEN a patient submits the booking form THEN the system SHALL create the appointment directly in Google Calendar with automatic calendar invitations and Google Meet link
5. WHEN an appointment is booked THEN the system SHALL store all appointment data including symptom assessment in the Google Calendar event description

### Requirement 2: Symptom Assessment Form

**User Story:** As a physiotherapist, I want patients to complete a detailed symptom assessment before their appointment, so that I can prepare effectively and provide targeted treatment.

#### Acceptance Criteria

1. WHEN a patient books an appointment THEN the system SHALL present a comprehensive symptom assessment form
2. WHEN the form is displayed THEN the system SHALL include fields for pain level, location, duration, and previous treatments
3. WHEN a patient submits the form THEN the system SHALL validate all required fields are completed
4. WHEN the form is submitted THEN the system SHALL store the assessment information in the Google Calendar event description
5. WHEN the physiotherapist views appointments in Google Calendar THEN the system SHALL display associated symptom assessments in the event details

### Requirement 3: Google Calendar Integration

**User Story:** As a physiotherapist, I want the platform to sync with my Google Calendar automatically, so that I can manage my availability without double-booking conflicts.

#### Acceptance Criteria


1. WHEN appointments are booked THEN the system SHALL create events directly in Google Calendar with all appointment details in the event description and Google Meet link for remote sessions
3. WHEN the physiotherapist updates availability in Google Calendar THEN the system SHALL reflect changes in real-time
4. IF there are calendar conflicts THEN the system SHALL prevent double-booking by checking Google Calendar availability
5. WHEN appointments are cancelled THEN the system SHALL remove events directly from Google Calendar
6. WHEN the system needs to check availability THEN the system SHALL use Google Calendar freebusy API via Supabase Edge Functions
7. WHEN Google API tokens expire THEN the system SHALL automatically refresh access tokens using stored refresh tokens
8. WHEN Edge Functions handle Google Calendar operations THEN the system SHALL never expose sensitive tokens in logs or responses
9. WHEN retrieving appointment data THEN the system SHALL read appointment details from Google Calendar events
10. WHEN appointments are created THEN the system SHALL automatically generate Google Meet links for remote physiotherapy sessions
11. WHEN patients receive calendar invitations THEN the system SHALL include the Google Meet link for easy access to the session

### Requirement 4: Exercise Video Library

**User Story:** As a patient, I want to access categorized exercise videos, so that I can continue my rehabilitation between sessions and learn proper techniques.

#### Acceptance Criteria

1. WHEN a user visits the exercise library THEN the system SHALL display videos organized by body part and condition categories
2. WHEN a user selects a category THEN the system SHALL show relevant YouTube videos with descriptions
3. WHEN videos are displayed THEN the system SHALL include difficulty level, duration, and equipment requirements
4. WHEN the physiotherapist adds new videos THEN the system SHALL allow categorization and custom descriptions
5. IF a YouTube video becomes unavailable THEN the system SHALL handle broken links gracefully

### Requirement 5: Donation System

**User Story:** As a supporter, I want to donate to the physiotherapist's project, so that I can help them continue providing valuable services to the community.

#### Acceptance Criteria

1. WHEN a visitor accesses the donation page THEN the system SHALL display donation options and project information
2. WHEN a user selects a donation amount THEN the system SHALL provide secure payment processing
3. WHEN a donation is completed THEN the system SHALL send confirmation emails to both donor and physiotherapist
4. WHEN a user books an appointment THEN the system SHALL display him an option to donate.

### Requirement 6: Mobile Responsiveness and Accessibility

**User Story:** As a user with different devices and abilities, I want the platform to be accessible and functional across all devices, so that I can use the service regardless of my technical setup or physical limitations.

#### Acceptance Criteria

1. WHEN users access the platform on mobile devices THEN the system SHALL provide a fully responsive interface
2. WHEN users with disabilities access the platform THEN the system SHALL meet WCAG 2.1 AA accessibility standards
3. WHEN the platform loads THEN the system SHALL achieve good performance scores on mobile and desktop
4. IF users have slow internet connections THEN the system SHALL provide optimized loading where possible
5. WHEN users navigate the platform THEN the system SHALL support keyboard navigation and screen readers
