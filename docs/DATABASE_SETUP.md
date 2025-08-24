# Database Setup Guide

This guide will help you set up the Supabase database for the Physiotherapy Platform.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project in your Supabase dashboard

## Setup Steps

### 1. Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following values:
   - Project URL
   - Anon public key

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Update the Supabase configuration:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 3. Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/database/consolidated_schema.sql`
4. Click "Run" to create all tables and indexes

### 4. Set Up Row Level Security

1. In the SQL Editor, copy and paste the contents of `supabase/database/rls-policies.sql`
2. Click "Run" to create all RLS policies

### 5. Verify Setup

The application includes database helper functions to verify the setup:

```typescript
import { databaseHelpers } from './src/services/database'

// Test connection
const connectionTest = await databaseHelpers.testConnection()
console.log(connectionTest)

// Check health status
const healthStatus = await databaseHelpers.getHealthStatus()
console.log(healthStatus)
```

## Database Schema Overview

### Tables

1. **video_categories** - Categories for organizing exercise videos
2. **exercise_videos** - Exercise videos with YouTube links and metadata
3. **appointments** - Patient appointment bookings
4. **symptom_assessments** - Patient symptom assessment forms
5. **donations** - Donation records with payment tracking

### Key Features

- **UUID Primary Keys** - All tables use UUID for better security and scalability
- **Row Level Security** - Comprehensive RLS policies for data protection
- **Automatic Timestamps** - Created/updated timestamps with triggers
- **Flexible JSON Storage** - JSONB fields for complex data structures
- **Performance Indexes** - Optimized indexes for common queries

## Security Considerations

- All tables have Row Level Security enabled
- User-specific data (appointments, assessments) is isolated by user_id
- Public data (videos, categories) has read-only access for anonymous users
- Donations have privacy controls for anonymous donations

## CRUD Operations

The application provides comprehensive CRUD services for all tables:

- ~~`appointmentsService`~~ - **REMOVED** - Appointments are now managed via Edge Functions with Google Calendar
- `symptomAssessmentsService` - Assessment management
- `videoCategoriesService` - Category management
- `exerciseVideosService` - Video management with search capabilities
- `donationsService` - Donation tracking with statistics

## Sample Data

Use the database initialization utility to populate sample data:

```typescript
import { initializeDatabase } from './src/utils/database-init'

await initializeDatabase()
```

## Troubleshooting

### Connection Issues
- Verify environment variables are correctly set
- Check Supabase project status in dashboard
- Ensure API keys have correct permissions

### RLS Policy Issues
- Verify user authentication status
- Check policy conditions match your use case
- Test with different user roles (authenticated, anonymous)

### Performance Issues
- Review query patterns and add indexes as needed
- Use select() to limit returned columns
- Implement pagination for large datasets

## Development Tools

The application includes helpful development utilities:

- Database connection testing
- Health status monitoring
- Sample data initialization
- Database clearing (for testing)

For more information, refer to the [Supabase Documentation](https://supabase.com/docs).