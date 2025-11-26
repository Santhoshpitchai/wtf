# Fix for "Unexpected token '<'" JSON Parse Error

## Problem
After restarting the session, you see an error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

## Root Cause
This error occurs when:
1. The API route crashes at module initialization time
2. Next.js returns an HTML error page instead of JSON
3. The frontend tries to parse the HTML as JSON and fails

The issue was caused by:
- Using non-null assertion operator (`!`) on environment variables at module level
- Environment variables not being available during module initialization
- Extra spaces in environment variable values

## Solution Applied

### 1. Changed Supabase Client Initialization
**Before:**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey, {...})
```

**After:**
```typescript
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {...})
}
```

This ensures:
- Environment variables are checked at request time, not module load time
- Better error messages if configuration is missing
- Fallback to anon key if service role key is not available

### 2. Fixed Environment Variables
Removed extra spaces and trailing slashes:

**Before:**
```bash
NEXT_PUBLIC_SUPABASE_URL= https://prwvplpsdiuyslnojnei.supabase.co
NEXT_PUBLIC_APP_URL=http://localhost:3000/
```

**After:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://prwvplpsdiuyslnojnei.supabase.co
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Files Modified
- `app/api/initiate-session-verification/route.ts`
- `app/api/verify-session/route.ts`
- `.env.local`

## Next Steps

**You MUST restart your development server for these changes to take effect:**

```bash
# Stop the current server (Ctrl+C in the terminal)
# Then restart:
npm run dev
```

After restarting, the "Unexpected token" error should be resolved and the START button should work correctly.

## Testing

1. Restart your dev server
2. Go to Start Session page
3. Click START on a client
4. You should see "WAITING FOR APPROVAL" status
5. Check the console for the verification URL
6. No JSON parse errors should appear

## Why This Happened

Next.js API routes are loaded when the server starts. If there's an error during module initialization (like accessing undefined environment variables with `!`), the route crashes and Next.js serves an HTML error page. When the frontend tries to parse this HTML as JSON, you get the "Unexpected token '<'" error.

By moving the Supabase client creation into a function that's called during request handling, we ensure proper error handling and avoid module-level crashes.
