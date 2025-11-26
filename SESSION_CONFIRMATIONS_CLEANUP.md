# Session Confirmations Cleanup Guide

## Overview

This document describes the automated cleanup process for expired session confirmation records in the WTF Fitness application. The cleanup system helps maintain database performance by removing stale verification records that are no longer needed.

## Cleanup Function

The database includes a function `cleanup_expired_session_confirmations()` that removes expired session confirmations older than 24 hours.

### Function Details

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_session_confirmations()
RETURNS INTEGER
```

**What it does:**
- Deletes session confirmations with status = 'expired'
- Only removes records where expires_at is more than 24 hours in the past
- Returns the count of deleted records
- Logs the cleanup operation

**Why 24 hours?**
- Expired tokens are kept for 24 hours to allow for debugging and audit trails
- After 24 hours, they are safe to remove as they serve no operational purpose
- This prevents the table from growing indefinitely

## Manual Cleanup

You can manually run the cleanup function at any time using the Supabase SQL Editor:

```sql
SELECT cleanup_expired_session_confirmations();
```

This will return the number of records deleted.

## Automated Cleanup Options

### Option 1: Supabase Database Webhooks (Recommended for Production)

Set up a scheduled webhook that calls the cleanup function:

1. Create an API endpoint in your application:
   ```typescript
   // app/api/cleanup-confirmations/route.ts
   import { createClient } from '@supabase/supabase-js';
   
   export async function POST(request: Request) {
     // Verify the request is from a trusted source (e.g., check API key)
     const authHeader = request.headers.get('authorization');
     if (authHeader !== `Bearer ${process.env.CLEANUP_API_KEY}`) {
       return Response.json({ error: 'Unauthorized' }, { status: 401 });
     }
     
     const supabase = createClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.SUPABASE_SERVICE_ROLE_KEY!
     );
     
     const { data, error } = await supabase.rpc('cleanup_expired_session_confirmations');
     
     if (error) {
       return Response.json({ error: error.message }, { status: 500 });
     }
     
     return Response.json({ 
       success: true, 
       deletedCount: data,
       timestamp: new Date().toISOString()
     });
   }
   ```

2. Use a cron service (like Vercel Cron, GitHub Actions, or cron-job.org) to call this endpoint daily

### Option 2: pg_cron Extension (Supabase Pro)

If you have Supabase Pro with pg_cron enabled:

```sql
-- Schedule cleanup to run daily at 2 AM UTC
SELECT cron.schedule(
  'cleanup-expired-confirmations',
  '0 2 * * *',
  $$ SELECT cleanup_expired_session_confirmations(); $$
);
```

To view scheduled jobs:
```sql
SELECT * FROM cron.job;
```

To unschedule:
```sql
SELECT cron.unschedule('cleanup-expired-confirmations');
```

### Option 3: External Cron Job

Set up a cron job on your server or use a service like:
- **Vercel Cron**: Add to `vercel.json`
  ```json
  {
    "crons": [{
      "path": "/api/cleanup-confirmations",
      "schedule": "0 2 * * *"
    }]
  }
  ```

- **GitHub Actions**: Create `.github/workflows/cleanup.yml`
  ```yaml
  name: Cleanup Expired Confirmations
  on:
    schedule:
      - cron: '0 2 * * *'  # Daily at 2 AM UTC
  jobs:
    cleanup:
      runs-on: ubuntu-latest
      steps:
        - name: Call cleanup endpoint
          run: |
            curl -X POST https://your-app.vercel.app/api/cleanup-confirmations \
              -H "Authorization: Bearer ${{ secrets.CLEANUP_API_KEY }}"
  ```

### Option 4: Manual Periodic Cleanup

If automated cleanup is not set up, run the cleanup manually on a regular schedule (e.g., weekly):

1. Log into Supabase Dashboard
2. Go to SQL Editor
3. Run: `SELECT cleanup_expired_session_confirmations();`
4. Note the number of records deleted

## Monitoring

### Check for Records Needing Cleanup

To see how many expired records are ready for cleanup:

```sql
SELECT COUNT(*) 
FROM public.session_confirmations
WHERE status = 'expired' 
  AND expires_at < NOW() - INTERVAL '24 hours';
```

### View Recent Cleanup Activity

Check PostgreSQL logs in Supabase Dashboard for NOTICE messages:
```
NOTICE: Cleaned up X expired session confirmations
```

### Monitor Table Size

To monitor the session_confirmations table size:

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename = 'session_confirmations';
```

## Cleanup Policy

**What gets deleted:**
- Records with `status = 'expired'`
- Records where `expires_at < NOW() - INTERVAL '24 hours'`

**What is preserved:**
- All 'pending' confirmations (even if expired timestamp passed)
- All 'approved' confirmations (for audit trail)
- Expired confirmations less than 24 hours old

**Note:** The cleanup function only deletes records with status 'expired'. Records with status 'pending' that have passed their expiration time should be updated to 'expired' by the application logic before they can be cleaned up.

## Troubleshooting

### Cleanup function not found
Run the migration file: `migration-session-confirmations-enhanced.sql`

### Permission denied
Ensure the authenticated role has execute permission:
```sql
GRANT EXECUTE ON FUNCTION cleanup_expired_session_confirmations() TO authenticated;
```

### No records being deleted
Check if there are actually expired records older than 24 hours:
```sql
SELECT * 
FROM public.session_confirmations
WHERE status = 'expired' 
  AND expires_at < NOW() - INTERVAL '24 hours'
LIMIT 10;
```

## Recommendations

1. **Set up automated cleanup** using one of the options above
2. **Run cleanup daily** during low-traffic hours (e.g., 2 AM)
3. **Monitor table growth** monthly to ensure cleanup is working
4. **Keep approved records** for audit purposes (they don't grow as fast)
5. **Consider archiving** very old approved records (>6 months) to a separate table if needed

## Environment Variables

If using the API endpoint approach, add to `.env.local`:

```
CLEANUP_API_KEY=your-secure-random-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Update `.env.example`:
```
# Cleanup API (for automated cleanup endpoint)
CLEANUP_API_KEY=your-secure-random-key-here
```

## Related Files

- `migration-session-confirmations-enhanced.sql` - Contains the cleanup function definition
- `supabase-schema.sql` - Main database schema
- `.kiro/specs/enhanced-client-verification/design.md` - Design documentation
