# Fix for "Client not found" Error

## Problem
When clicking the START button on the Start Session page, you see "Client not found" error.

## Root Cause
The API routes were using the client-side Supabase client which doesn't have proper authentication context in server-side API routes. With Row Level Security (RLS) enabled, the queries were being blocked.

## Solution
The API routes now use the Supabase service role key for server-side operations, which bypasses RLS policies.

## Setup Instructions

### 1. Get Your Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Find the **service_role** key (NOT the anon key)
4. Copy the key (it starts with `eyJ...`)

⚠️ **IMPORTANT**: The service role key has full database access. Keep it secret and never expose it in client-side code!

### 2. Add to Environment Variables

Add the service role key to your `.env.local` file:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## What Changed

### Files Modified:
- `app/api/initiate-session-verification/route.ts`
- `app/api/verify-session/route.ts`

### Changes Made:
1. Replaced client-side Supabase client with server-side client using service role key
2. Added error logging for better debugging
3. Service role key bypasses RLS policies for legitimate server-side operations

## Testing

After adding the service role key and restarting:

1. Go to the Start Session page
2. Click START on any client
3. You should see "WAITING FOR APPROVAL" status
4. Check your console for the verification URL (if RESEND_API_KEY is not configured)
5. The "Client not found" error should be resolved

## Fallback

If you don't have the service role key yet, the code will fall back to using the anon key, but you may still encounter RLS issues. It's recommended to use the service role key for production.

## Security Notes

- ✅ Service role key is only used in server-side API routes
- ✅ Never exposed to the client
- ✅ Stored in environment variables
- ✅ Not committed to version control
- ✅ Bypasses RLS for legitimate server operations
