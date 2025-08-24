# Product Overview

## Fisio Project - Online Physiotherapy Platform

A comprehensive web application for physiotherapy services that enables patients to book appointments, complete symptom assessments, access exercise resources, and make donations. The platform integrates with Google Calendar for appointment scheduling and provides a complete patient management system with detailed health intake forms.

## Core Features

- **Appointment Booking System**: Full-featured booking with Google Calendar integration, availability checking, and automated calendar invitations. The calendar integrated is the one that belongs to the physiotherapist
- **Symptom Assessment Forms**: Comprehensive patient intake forms that collect detailed symptom information, pain levels, medical history, and treatment goals before appointments
- **Exercise Library**: Digital physiotherapy exercises and resources for patients organized by categories and difficulty levels
- **Donation Platform**: Support system for the physiotherapy practice with Stripe integration
- **Patient Management**: Comprehensive appointment and patient data management with detailed symptom tracking and assessment history

## Target Users

- **Patients**: Book appointments with symptom assessment, access exercise library, view appointment details, cancel appointments
- **Juan Crow Larrea (Physiotherapist)**: Manage appointments, review patient symptom assessments, calendar integration, patient communication

## Key Business Logic

- Working hours: 9:00 AM to 5:00 PM, Monday to Friday
- Appointment durations: 1 hour (60 minutes)
- Double-booking prevention with real-time availability checking
- Automated calendar invitations sent to patients with appointment details and cancellation links
- Comprehensive symptom assessment required during booking process
- Patient data stored securely in database with proper relationships between appointments and assessments

## Symptom Assessment Features

- **Pain Level Assessment**: 1-10 scale with visual feedback and descriptions
- **Body Part Selection**: Interactive grid for selecting affected areas
- **Medical History**: Previous treatments, current medications, and symptom duration
- **Symptom Details**: Primary/secondary symptoms, onset date, triggers, and daily impact
- **Data Integration**: Assessment data linked to appointments and accessible to physiotherapists
- **Professional UX**: Clean calendar events for physiotherapists with database references for detailed patient information