-- =====================================================
-- CLEANUP UNUSED DATABASE OBJECTS
-- =====================================================
-- This script removes unused views, functions, columns, and indexes
-- that were identified during the database consolidation analysis.
-- 
-- Run this AFTER backing up your database and confirming
-- that these objects are not used by your application.
-- =====================================================

-- =====================================================
-- DROP UNUSED VIEWS
-- =====================================================

-- Drop unused views
DROP VIEW IF EXISTS upcoming_appointments;
DROP VIEW IF EXISTS exercise_videos_with_category;

-- =====================================================
-- DROP UNUSED FUNCTIONS
-- =====================================================

-- Drop unused functions (these are not called anywhere in the codebase)
DROP FUNCTION IF EXISTS increment_video_view_count(UUID);
DROP FUNCTION IF EXISTS get_video_statistics();
DROP FUNCTION IF EXISTS search_videos_fulltext(TEXT, UUID, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_recommended_videos(TEXT[], TEXT, UUID, INTEGER);
DROP FUNCTION IF EXISTS get_popular_videos(INTERVAL, INTEGER);
DROP FUNCTION IF EXISTS get_available_slots(DATE, INTEGER);
DROP FUNCTION IF EXISTS validate_appointment_slot();

-- =====================================================
-- DROP UNUSED TRIGGERS
-- =====================================================

-- Drop the appointment validation trigger (validation is done in application layer)
DROP TRIGGER IF EXISTS validate_appointment_slot_trigger ON appointments;

-- =====================================================
-- DROP INVALID INDEXES FIRST
-- =====================================================

-- Drop indexes that reference non-existent user_id columns
DROP INDEX IF EXISTS idx_appointments_user_id;
DROP INDEX IF EXISTS idx_symptom_assessments_user_id;

-- Drop indexes that reference columns we're about to remove
DROP INDEX IF EXISTS idx_exercise_videos_active;
DROP INDEX IF EXISTS idx_video_categories_active;

-- Drop other unused indexes
DROP INDEX IF EXISTS idx_exercise_videos_difficulty; -- Kept the more specific one in consolidated schema

-- =====================================================
-- UPDATE RLS POLICIES FIRST
-- =====================================================

-- Drop old policies that referenced is_active columns
DROP POLICY IF EXISTS "Video categories are viewable by everyone" ON video_categories;
DROP POLICY IF EXISTS "Active exercise videos are viewable by everyone" ON exercise_videos;

-- =====================================================
-- DROP UNUSED COLUMNS
-- =====================================================

-- Remove view_count column from exercise_videos (not used by application)
ALTER TABLE exercise_videos DROP COLUMN IF EXISTS view_count;

-- Remove is_active column from exercise_videos (not used in queries)
ALTER TABLE exercise_videos DROP COLUMN IF EXISTS is_active;

-- Remove is_active column from video_categories (not used in queries)
ALTER TABLE video_categories DROP COLUMN IF EXISTS is_active;

-- =====================================================
-- RECREATE RLS POLICIES
-- =====================================================

-- Recreate policies without is_active filters
CREATE POLICY "Video categories are viewable by everyone" 
    ON video_categories FOR SELECT 
    USING (true);

CREATE POLICY "Exercise videos are viewable by everyone" 
    ON exercise_videos FOR SELECT 
    USING (true);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify that unused objects have been removed
SELECT 'Cleanup completed successfully!' as status;

-- Check remaining views
SELECT 'Remaining views:' as info;
SELECT schemaname, viewname 
FROM pg_views 
WHERE schemaname = 'public' 
ORDER BY viewname;

-- Check remaining functions (excluding built-in ones)
SELECT 'Remaining custom functions:' as info;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    AND routine_name NOT LIKE 'pg_%'
ORDER BY routine_name;

-- Check table columns
SELECT 'Table columns verification:' as info;
SELECT table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('exercise_videos', 'video_categories', 'appointments', 'symptom_assessments', 'donations')
ORDER BY table_name, ordinal_position;