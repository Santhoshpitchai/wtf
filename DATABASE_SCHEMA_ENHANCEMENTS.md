# Database Schema Enhancements for Session Confirmations

## Overview

This document describes the enhancements made to the `session_confirmations` table schema to support the enhanced client verification system.

## Changes Made

### 1. Performance Indexes

#### Added Indexes:
- **`idx_session_confirmations_token`**: Fast O(1) lookups for token verification
- **`idx_session_confirmations_status`**: Efficient filtering by status
- **`idx_session_confirmations_client_trainer`**: Composite index for client-trainer pair queries (critical for token invalidation)
- **`idx_session_confirmations_client_id`**: Foreign key lookup optimization
- **`idx_session_confirmations_trainer_id`**: Foreign key lookup optimization
- **`idx_session_confirmations_expires_at`**: Partial index for cleanup queries (only on pending records)

#### Rationale:
- The composite index on `(client_id, trainer_id)` is essential for Requirement 8.3 and 8.4, which require invalidating previous pending tokens when a new verification is requested
- The partial index on `expires_at` improves cleanup query performance by only indexing pending records
- All indexes use `CREATE INDEX IF NOT EXISTS` to allow safe re-running of the migration

### 2. Enhanced RLS Policies

#### Updated Policies:
- **SELECT**: Restricted to authenticated users only (was "anyone")
- **INSERT**: Restricted to authenticated users (unchanged)
- **UPDATE**: Restricted to authenticated users (was "anyone")
- **DELETE**: New policy allowing cleanup of expired records older than 24 hours

#### Security Improvements:
- Removed overly permissive "anyone can view/update" policies
- All operations now require authentication
- DELETE policy specifically scoped to cleanup operations only
- Policies align with security requirements in the design document

### 3. Helper Functions

#### `cleanup_expired_session_confirmations()`
- **Purpose**: Removes expired session confirmations older than 24 hours
- **Returns**: Count of deleted records
- **Usage**: Can be called manually or scheduled via cron job
- **Requirement**: Addresses Requirement 4.4 (expired record cleanup)

```sql
SELECT cleanup_expired_session_confirmations();
```

#### `invalidate_previous_verification_tokens(client_id, trainer_id, current_token)`
- **Purpose**: Marks previous pending tokens as expired for a client-trainer pair
- **Returns**: Count of invalidated tokens
- **Usage**: Called when creating a new verification request
- **Requirement**: Addresses Requirements 8.3 and 8.4 (token invalidation)

```sql
SELECT invalidate_previous_verification_tokens(
  'client-uuid',
  'trainer-uuid', 
  'current-token-value'
);
```

### 4. Documentation

Added SQL comments for:
- Table description
- Column descriptions (especially for `verification_token`, `status`, `expires_at`)
- Index descriptions
- Function descriptions

## Migration Instructions

### For New Installations:
Run the enhanced migration file:
```bash
# In Supabase SQL Editor
\i migration-session-confirmations-enhanced.sql
```

### For Existing Installations:
The migration is idempotent and can be safely run on existing databases:
1. It uses `CREATE TABLE IF NOT EXISTS`
2. It uses `CREATE INDEX IF NOT EXISTS`
3. It uses `DROP POLICY IF EXISTS` before recreating policies
4. It uses `CREATE OR REPLACE FUNCTION` for functions

```bash
# In Supabase SQL Editor
\i migration-session-confirmations-enhanced.sql
```

## Verification Queries

### Check Indexes:
```sql
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'session_confirmations'
ORDER BY indexname;
```

### Check RLS Policies:
```sql
SELECT 
  policyname, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'session_confirmations';
```

### Check Functions:
```sql
SELECT 
  proname, 
  pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname LIKE '%session_confirmation%';
```

## Performance Considerations

### Index Usage:
- **Token lookups**: Use `idx_session_confirmations_token` for O(1) verification
- **Status filtering**: Use `idx_session_confirmations_status` for polling queries
- **Token invalidation**: Use `idx_session_confirmations_client_trainer` for finding previous tokens
- **Cleanup**: Use `idx_session_confirmations_expires_at` for efficient expired record deletion

### Maintenance:
- Run `cleanup_expired_session_confirmations()` daily to prevent table bloat
- Monitor index usage with `pg_stat_user_indexes`
- Consider VACUUM ANALYZE after bulk deletions

## Requirements Addressed

- **Requirement 5.3**: Database schema with proper indexes for performance
- **Requirement 4.4**: Cleanup mechanism for expired records
- **Requirement 8.3**: Token invalidation for retry scenarios
- **Requirement 8.4**: Only most recent token valid for client-trainer pair

## Security Considerations

- All RLS policies require authentication
- DELETE policy scoped to cleanup operations only
- Helper functions use SECURITY DEFINER with proper grants
- Token column documented as cryptographically secure

## Next Steps

1. Apply the migration to your Supabase database
2. Verify indexes are created correctly
3. Test RLS policies with different user roles
4. Set up automated cleanup job (optional)
5. Monitor query performance with new indexes

