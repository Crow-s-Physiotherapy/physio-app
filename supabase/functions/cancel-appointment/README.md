# Cancel Appointment Edge Function

This Edge Function handles appointment cancellation by deleting events from Google Calendar.

## Endpoint

`POST /functions/v1/cancel-appointment`

## Request Body

```json
{
  "eventId": "string" // Google Calendar event ID
}
```

## Response

### Success Response (200)
```json
{
  "success": true
}
```

### Error Response (4xx/5xx)
```json
{
  "success": false,
  "error": "Error message"
}
```

## Error Codes

- `400` - Bad Request (missing or invalid eventId)
- `401` - Unauthorized (authentication failed)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (appointment not found)
- `405` - Method Not Allowed (only POST allowed)
- `500` - Internal Server Error (general failure)
- `503` - Service Unavailable (calendar service unavailable)

## Environment Variables Required

- `GOOGLE_CLIENT_ID` - Google OAuth 2.0 client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth 2.0 client secret
- `GOOGLE_REFRESH_TOKEN` - Long-lived refresh token for calendar access

## Usage Example

```javascript
const response = await fetch('/functions/v1/cancel-appointment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    eventId: 'abc123def456'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Appointment cancelled successfully');
} else {
  console.error('Failed to cancel appointment:', result.error);
}
```