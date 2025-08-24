-- =====================================================
-- CONSOLIDATED DATABASE SCHEMA
-- =====================================================
-- This script creates all necessary tables, indexes, RLS policies,
-- and functions for the physiotherapy booking platform.
-- 
-- This consolidated schema contains only the objects that are
-- actively used by the application, with unused objects removed
-- and column inconsistencies fixed.
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLES
-- =====================================================

-- Video Categories Table
-- Stores categories for organizing exercise videos
CREATE TABLE IF NOT EXISTS video_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100), -- Icon name or URL for UI
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise Videos Table  
-- Stores YouTube exercise videos with metadata
CREATE TABLE IF NOT EXISTS exercise_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    youtube_id VARCHAR(20) NOT NULL UNIQUE, -- YouTube video ID (extracted from URL)
    youtube_url VARCHAR(500) NOT NULL,
    category_id UUID NOT NULL REFERENCES video_categories(id) ON DELETE CASCADE,
    duration INTEGER, -- duration in seconds
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    equipment_required TEXT[], -- array of equipment needed
    body_parts TEXT[], -- array of body parts targeted
    tags TEXT[], -- array of searchable tags
    thumbnail_url VARCHAR(500), -- YouTube thumbnail URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments Table
-- Stores appointment bookings with Google Calendar integration
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_name VARCHAR(255) NOT NULL,
    patient_email VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(50),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER DEFAULT 60 CHECK (duration > 0 AND duration <= 480), -- duration in minutes, max 8 hours
    status VARCHAR(20) CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')) DEFAULT 'scheduled',
    google_event_id VARCHAR(255) UNIQUE, -- Google Calendar event ID
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
);

-- Symptom Assessments Table
-- Stores detailed patient symptom assessments
CREATE TABLE IF NOT EXISTS symptom_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_email VARCHAR(255) NOT NULL,
    pain_level INTEGER CHECK (pain_level >= 1 AND pain_level <= 10) NOT NULL,
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Structured symptom data as JSONB for flexibility and performance
    symptoms JSONB NOT NULL DEFAULT '{}',
    
    -- Quick access fields (also stored in symptoms JSONB)
    primary_symptom VARCHAR(255),
    pain_locations TEXT[], -- array of affected body parts
    symptom_duration VARCHAR(50),
    daily_impact VARCHAR(20) CHECK (daily_impact IN ('minimal', 'moderate', 'significant', 'severe')),
    
    -- Treatment history
    previous_treatments TEXT,
    current_medications TEXT,
    
    -- Assessment notes
    additional_notes TEXT,
    recommendations TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_email ON appointments(patient_email);
CREATE INDEX IF NOT EXISTS idx_appointments_google_event ON appointments(google_event_id) WHERE google_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);

-- Symptom assessments indexes
CREATE INDEX IF NOT EXISTS idx_symptom_assessments_patient_email ON symptom_assessments(patient_email);
CREATE INDEX IF NOT EXISTS idx_symptom_assessments_date ON symptom_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_symptom_assessments_appointment ON symptom_assessments(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_symptom_assessments_pain_level ON symptom_assessments(pain_level);
CREATE INDEX IF NOT EXISTS idx_symptom_assessments_symptoms_gin ON symptom_assessments USING GIN (symptoms);

-- Exercise videos indexes
CREATE INDEX IF NOT EXISTS idx_exercise_videos_category ON exercise_videos(category_id);
CREATE INDEX IF NOT EXISTS idx_exercise_videos_difficulty ON exercise_videos(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_exercise_videos_youtube_id ON exercise_videos(youtube_id);
CREATE INDEX IF NOT EXISTS idx_exercise_videos_body_parts_gin ON exercise_videos USING GIN (body_parts);
CREATE INDEX IF NOT EXISTS idx_exercise_videos_tags_gin ON exercise_videos USING GIN (tags);

-- Video categories indexes
CREATE INDEX IF NOT EXISTS idx_video_categories_sort_order ON video_categories(sort_order);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

-- Function to extract YouTube video ID from URL
CREATE OR REPLACE FUNCTION extract_youtube_id(youtube_url TEXT)
RETURNS TEXT AS $
BEGIN
    -- Extract video ID from various YouTube URL formats
    RETURN CASE
        WHEN youtube_url ~ 'youtube\.com/watch\?v=([a-zA-Z0-9_-]+)' THEN
            (regexp_match(youtube_url, 'youtube\.com/watch\?v=([a-zA-Z0-9_-]+)'))[1]
        WHEN youtube_url ~ 'youtu\.be/([a-zA-Z0-9_-]+)' THEN
            (regexp_match(youtube_url, 'youtu\.be/([a-zA-Z0-9_-]+)'))[1]
        WHEN youtube_url ~ 'youtube\.com/embed/([a-zA-Z0-9_-]+)' THEN
            (regexp_match(youtube_url, 'youtube\.com/embed/([a-zA-Z0-9_-]+)'))[1]
        ELSE NULL
    END;
END;
$ language 'plpgsql';

-- Function to auto-populate YouTube ID when URL is inserted/updated
CREATE OR REPLACE FUNCTION set_youtube_id()
RETURNS TRIGGER AS $
BEGIN
    NEW.youtube_id = extract_youtube_id(NEW.youtube_url);
    IF NEW.youtube_id IS NULL THEN
        RAISE EXCEPTION 'Invalid YouTube URL format';
    END IF;
    RETURN NEW;
END;
$ language 'plpgsql';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at triggers for all tables
CREATE TRIGGER update_video_categories_updated_at 
    BEFORE UPDATE ON video_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_videos_updated_at 
    BEFORE UPDATE ON exercise_videos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_symptom_assessments_updated_at 
    BEFORE UPDATE ON symptom_assessments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- YouTube ID extraction trigger
CREATE TRIGGER set_youtube_id_trigger
    BEFORE INSERT OR UPDATE ON exercise_videos
    FOR EACH ROW EXECUTE FUNCTION set_youtube_id();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_assessments ENABLE ROW LEVEL SECURITY;

-- Video Categories Policies (Public read, admin write)
CREATE POLICY "Video categories are viewable by everyone" 
    ON video_categories FOR SELECT 
    USING (true);

CREATE POLICY "Only service role can manage video categories" 
    ON video_categories FOR ALL 
    USING (auth.role() = 'service_role');

-- Exercise Videos Policies (Public read, admin write)
CREATE POLICY "Exercise videos are viewable by everyone" 
    ON exercise_videos FOR SELECT 
    USING (true);

CREATE POLICY "Only service role can manage exercise videos" 
    ON exercise_videos FOR ALL 
    USING (auth.role() = 'service_role');

-- Appointments Policies (Service role only - managed via Edge Functions)
CREATE POLICY "Only service role can manage appointments" 
    ON appointments FOR ALL 
    USING (auth.role() = 'service_role');

-- Symptom Assessments Policies (Service role only - managed via Edge Functions)
CREATE POLICY "Only service role can manage symptom assessments" 
    ON symptom_assessments FOR ALL 
    USING (auth.role() = 'service_role');


-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Insert default video categories
INSERT INTO video_categories (name, description, icon, sort_order) VALUES
    ('Back & Spine', 'Exercises for back pain, spinal alignment, and core strengthening', 'back', 1),
    ('Neck & Shoulders', 'Stretches and strengthening for neck pain and shoulder tension', 'shoulders', 2),
    ('Knee & Hip', 'Lower body exercises for knee pain, hip mobility, and leg strength', 'legs', 3),
    ('Arms & Wrists', 'Upper extremity exercises for arm, elbow, and wrist conditions', 'arms', 4),
    ('Balance & Coordination', 'Exercises to improve balance, coordination, and fall prevention', 'balance', 5),
    ('General Fitness', 'Overall fitness and conditioning exercises for health maintenance', 'fitness', 6)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE appointments IS 'Stores patient appointment bookings with Google Calendar integration';
COMMENT ON TABLE symptom_assessments IS 'Detailed patient symptom assessments for appointment preparation';
COMMENT ON TABLE exercise_videos IS 'YouTube exercise videos organized by categories for patient education';
COMMENT ON TABLE video_categories IS 'Categories for organizing exercise videos by body part or condition';
COMMENT ON TAB IS 'Donation transactions processed through Stripe payment system';

COMMENT ON COLUMN appointments.google_event_id IS 'Google Calendar event ID for calendar synchronization';
COMMENT ON COLUMN symptom_assessments.symptoms IS 'JSONB field containing flexible symptom data structure';
COMMENT ON COLUMN exercise_videos.youtube_id IS 'YouTube video ID extracted from URL for embedding';
-- =====================================================
-- SCHEMA CONSOLIDATION COMPLETE
-- =====================================================

SELECT 'Consolidated database schema deployed successfully!' as status;