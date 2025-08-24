# Google Calendar Integration - Supabase Edge Functions

This directory contains Supabase Edge Functions for integrating with Google Calendar API to manage physiotherapy appointments.

## Functions

### 1. `new-appointment`
Creates a new appointment in the physiotherapist's Google Calendar.

**Endpoint:** `POST /functions/v1/new-appointment`

**Request Body:**
```json
{
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T11:00:00.000Z",
  "summary": "Physiotherapy Session - John Doe",
  "description": "Initial consultation for back pain"
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "abc123def456"
}
```

### 2. `check-availability`
Checks if the physiotherapist is available during a specific time period.

**Endpoint:** `POST /functions/v1/check-availability`

**Request Body:**
```json
{
  "start": "2024-01-15T10:00:00.000Z",
  "end": "2024-01-15T11:00:00.000Z"
}
```

**Response:**
```json
{
  "available": true,
  "busyTimes": []
}
```

## Environment Variables

Set these in your Supabase project settings under Edge Functions secrets:

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
```

## Deployment

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Deploy functions:
```bash
supabase functions deploy new-appointment
supabase functions deploy check-availability
```

5. Set environment variables:
```bash
supabase secrets set GOOGLE_CLIENT_ID=your_client_id
supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret
supabase secrets set GOOGLE_REFRESH_TOKEN=your_refresh_token
```

## Local Testing

### Prerequisites
1. Install Deno: https://deno.land/manual/getting_started/installation
2. Install Supabase CLI
3. Have your Google OAuth credentials ready

### Setup Local Environment

1. Start Supabase locally:
```bash
supabase start
```

2. Create a `.env` file in the functions directory:
```bash
# supabase/functions/.env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
```

3. Serve functions locally:
```bash
supabase functions serve --env-file supabase/functions/.env
```

### Test the Functions

#### Test new-appointment:
```bash
curl -X POST 'http://localhost:54321/functions/v1/new-appointment' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": "2024-01-15T11:00:00.000Z",
    "summary": "Test Appointment",
    "description": "Testing the function"
  }'
```

#### Test check-availability:
```bash
curl -X POST 'http://localhost:54321/functions/v1/check-availability' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "start": "2024-01-15T10:00:00.000Z",
    "end": "2024-01-15T11:00:00.000Z"
  }'
```

### Using Postman or Similar Tools

1. Set the base URL to: `http://localhost:54321/functions/v1/`
2. Add headers:
   - `Authorization: Bearer YOUR_ANON_KEY`
   - `Content-Type: application/json`
3. Use POST method for both endpoints
4. Send the JSON payloads as shown above

## Security Notes

- Never expose your Google Client Secret or Refresh Token in client-side code
- The functions automatically refresh access tokens as needed
- All sensitive credentials are stored as Supabase secrets
- CORS is configured to allow requests from your frontend domain
- Input validation is performed on all requests

## Error Handling

The functions include comprehensive error handling for:
- Invalid request methods
- Missing required fields
- Invalid date formats
- Google API failures
- Token refresh failures

All errors return appropriate HTTP status codes and descriptive error messages.

## Timezone Considerations

The functions currently use 'America/New_York' as the default timezone. You may want to:
1. Make timezone configurable via environment variable
2. Accept timezone in the request payload
3. Use the physiotherapist's local timezone

## Rate Limiting

Google Calendar API has the following limits:
- 1,000,000 requests per day
- 100 requests per 100 seconds per user

The functions don't implement additional rate limiting, but you may want to add this for production use.