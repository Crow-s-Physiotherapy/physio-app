# Implementation Plan

-
  1. [x] Analyze current database usage and create consolidated schema
  - Review all Edge Functions and frontend services to identify used tables and
    columns
  - Create new consolidated_schema.sql with only used objects
  - Remove unused views (upcoming_appointments, exercise_videos_with_category)
  - Remove unused functions (increment_video_view_count, get_video_statistics,
    search_videos_fulltext, get_recommended_videos, get_popular_videos,
    get_available_slots, validate_appointment_slot)
  - Remove view_count and is_active columns from exercise_videos table
  - Remove is_active column from video_categories table if not used
  - Remove invalid indexes referencing user_id columns
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3_

-
  2. [x] Update TypeScript types to match cleaned schema
  - Remove user_id references from database types
  - Remove view_count and is_active column references where applicable
  - Update all type definitions to match the new schema structure
  - _Requirements: 2.1, 2.2_

-
  3. [x] Update frontend services to remove references to deleted columns
  - Update videoService.ts to remove view_count and increment_video_view_count
    calls
  - Update database.ts service methods to remove user_id queries
  - Update all service methods that filter by is_active where column is removed
  - Remove any references to unused database functions
  - _Requirements: 2.1, 2.2, 4.1, 4.2_

-
  4. [x] Update Go data-manager scripts for removed columns
  - Update video model in scripts/data-manager/internal/models/video.go to
    remove view_count and is_active fields
  - Update video service in
    scripts/data-manager/internal/services/video_service.go to handle removed
    columns
  - Update any SQL queries in Go scripts that reference removed columns
  - _Requirements: 2.1, 2.2, 4.1, 4.2_

-
  5. [x] Replace existing database schema files with consolidated version
  - Replace supabase/database/schema.sql with new consolidated_schema.sql
  - Remove supabase/database/deploy.sql (functionality merged into consolidated
    schema)
  - Remove supabase/database/video_functions.sql (unused functions removed, used
    ones merged)
  - Update any references to old schema files in documentation
  - _Requirements: 1.1, 1.2, 5.1, 5.2, 5.3_
