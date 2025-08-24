# Database Refactoring Design Document

## Overview

This design outlines the refactoring of the current database schema to create a single, clean SQL script that contains only the tables, indexes, functions, and policies that are actively used by the application. The refactoring will eliminate unused database objects, fix inconsistencies between schema and TypeScript types, and improve maintainability.

## Current State Analysis

### Tables Currently Used
Based on code analysis, the following tables are actively used:

1. **appointments** - Used in Edge Functions (new-appointment, get-appointment, cancel-appointment)
2. **symptom_assessments** - Used in Edge Functions and frontend services
3. **exercise_videos** - Used extensively in frontend video services
4. **video_categories** - Used in frontend video services
5. **donations** - Used in frontend donation services

### Objects to Remove

#### Unused Views
- `upcoming_appointments` - No references found in codebase
- `exercise_videos_with_category` - No references found in codebase

#### Unused Functions
- `increment_video_view_count()` - Not needed (removing view_count column)
- `get_video_statistics()` - Not called anywhere
- `search_videos_fulltext()` - Not called anywhere  
- `get_recommended_videos()` - Not called anywhere
- `get_popular_videos()` - Not called anywhere
- `get_available_slots()` - Not called anywhere
- `validate_appointment_slot()` - Trigger function not needed (validation done in application)

#### Functions to Keep
- `update_updated_at_column()` - Used by triggers
- `extract_youtube_id()` - Used by trigger
- `set_youtube_id()` - Used by trigger

### Schema Inconsistencies to Fix

#### Missing Columns
The TypeScript types reference `user_id` columns that don't exist in the database schema:
- `appointments.user_id` - Referenced in types but not in schema
- `symptom_assessments.user_id` - Referenced in types but not in schema

#### Invalid Indexes
Several indexes reference non-existent columns:
- `idx_appointments_user_id` - References non-existent user_id column
- `idx_symptom_assessments_user_id` - References non-existent user_id column

## Architecture

### Single Schema File Structure
The refactored schema will be organized into clear sections:

1. **Extensions** - Required PostgreSQL extensions
2. **Tables** - Only the 5 actively used tables
3. **Indexes** - Only indexes on existing columns
4. **Functions** - Only functions that are actually called
5. **Triggers** - Only triggers for functions that exist
6. **Row Level Security** - Policies for data protection
7. **Initial Data** - Default video categories

### File Organization
- **Current**: Multiple files (schema.sql, deploy.sql, video_functions.sql)
- **New**: Single consolidated file (consolidated_schema.sql)

## Components and Interfaces

### Table Definitions

#### Core Tables (With Column Cleanup)
All 5 core tables will be retained but with column cleanup:
- `video_categories` - Remove `is_active` column if not needed
- `exercise_videos` - Remove `view_count` and `is_active` columns
- `appointments` - No changes
- `symptom_assessments` - No changes  
- `donations` - No changes

#### Column Consistency Fix
Multiple column cleanup tasks:
1. Remove `user_id` references from TypeScript types (uses `patient_email` for identification)
2. Remove invalid indexes that reference `user_id`
3. Update any service methods that incorrectly reference `user_id`
4. Remove `view_count` column from `exercise_videos` table
5. Remove `is_active` columns from tables where not needed
6. Update all code references to removed columns

### Functions to Retain

#### Essential Functions
1. **update_updated_at_column()** - Trigger function for timestamp updates
2. **extract_youtube_id()** - Extracts YouTube ID from URL
3. **set_youtube_id()** - Trigger function for auto-populating YouTube ID

#### Functions to Remove
All other functions will be removed as they're not called by the application.

### Indexes Optimization

#### Valid Indexes to Keep
Only indexes that reference existing columns and provide performance benefits:
- Appointment indexes (date, time, status, email, google_event_id)
- Symptom assessment indexes (patient_email, date, appointment_id, symptoms JSONB)
- Exercise video indexes (category, active status, youtube_id, body_parts, tags)
- Video category indexes (active status, sort_order)
- Donation indexes (status, created_at, donor_email, stripe_payment_intent_id)

#### Invalid Indexes to Remove
- Any index referencing `user_id` columns
- Indexes on unused functions or views

## Data Models

### Data Model Changes
Core tables are being retained but with column changes:

1. **TypeScript Types**: Remove `user_id`, `view_count`, and `is_active` references where applicable
2. **Service Methods**: Update methods that query removed columns
3. **Go Scripts**: Update data-manager scripts that insert/update video data to handle removed columns

### Migration Strategy
This refactoring is primarily about removing unused objects, so:
1. **Data Preservation**: All existing data remains intact
2. **Zero Downtime**: Changes don't affect running application
3. **Rollback Safe**: Can easily revert by re-adding removed objects if needed

## Error Handling

### Migration Safety
1. **Backup Strategy**: Full database backup before applying changes
2. **Validation**: Test queries to ensure all used functionality still works
3. **Rollback Plan**: Keep removed objects in separate file for quick restoration

### Application Compatibility
1. **API Compatibility**: All Edge Functions continue to work unchanged
2. **Frontend Compatibility**: All service methods continue to work unchanged
3. **Type Safety**: Fix TypeScript type inconsistencies to prevent runtime errors

## Testing Strategy

Testing will be handled manually by the developer after implementation.

## Implementation Approach

### Phase 1: Schema Consolidation
1. Create consolidated schema file with only used objects
2. Remove unused columns (`view_count`, `is_active` where not needed)
3. Remove unused functions and views

### Phase 2: Code Updates
1. Update TypeScript types to remove `user_id` and removed column references
2. Update service methods to remove references to removed columns
3. Update queries that filter by `is_active` where column is removed
4. Update Go scripts in `scripts/data-manager` to handle removed columns

### Phase 3: Deployment
1. Apply consolidated schema
2. Deploy updated code
3. Manual testing by developer