# Session Confirmations Schema Migration Checklist

## Pre-Migration Checklist

- [ ] Backup your Supabase database
- [ ] Review the enhanced migration file: `migration-session-confirmations-enhanced.sql`
- [ ] Ensure you have admin access to Supabase SQL Editor
- [ ] Verify the `update_updated_at_column()` function exists (from main schema)

## Migration Steps

### Step 1: Apply the Enhanced Migration

1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `migration-session-confirmations-enhanced.sql`
4. Paste into SQL Editor
5. Click "Run" to execute

Expected output:
```
CREATE TABLE
CREATE INDEX (6 indexes)
ALTER TABLE
DROP POLICY (3 policies)
CREATE POLICY (4 policies)
CREATE TRIGGER
CREATE FUNCTION (2 functions)
GRANT
COMMENT (multiple comments)
```

### Step 2: Verify Indexes

Run this query to verify all indexes are created:

```sql
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'session_confirmations'
ORDER BY indexname;
```

Expected indexes:
- `idx_session_confirmations_client_id`
- `idx_session_confirmations_client_trainer` ⭐ (new composite index)
- `idx_session_confirmations_expires_at` ⭐ (new partial index)
- `idx_session_confirmations_status`
- `idx_session_confirmations_token`
- `idx_session_confirmations_trainer_id`
- `session_confirmations_pkey` (primary key)
- `session_confirmations_verification_token_key` (unique constraint)

### Step 3: Verify RLS Policies

Run this query to verify RLS policies:

```sql
SELECT 
  policyname, 
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies 
WHERE tablename = 'session_confirmations'
ORDER BY policyname;
```

Expected policies:
- `Allow cleanup of expired records` (DELETE) ⭐ (new)
- `Allow updates for verification` (UPDATE) ⭐ (updated)
- `Authenticated users can insert session confirmations` (INSERT)
- `Authenticated users can view session confirmations` (SELECT) ⭐ (updated)

### Step 4: Verify Helper Functions

Run this query to verify functions exist:

```sql
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname IN (
  'cleanup_expired_session_confirmations',
  'invalidate_previous_verification_tokens'
)
ORDER BY proname;
```

Expected functions:
- `cleanup_expired_session_confirmations()` → returns INTEGER
- `invalidate_previous_verification_tokens(UUID, UUID, TEXT)` → returns INTEGER

### Step 5: Test Helper Functions

#### Test Cleanup Function:
```sql
-- This should run without errors (may return 0 if no expired records)
SELECT cleanup_expired_session_confirmations();
```

#### Test Token Invalidation Function:
```sql
-- This should run without errors (returns count of invalidated tokens)
-- Replace UUIDs with actual test values
SELECT invalidate_previous_verification_tokens(
  'test-client-uuid'::UUID,
  'test-trainer-uuid'::UUID,
  'test-current-token'
);
```

## Post-Migration Verification

### Test 1: Create a Test Record

```sql
INSERT INTO session_confirmations (
  client_id,
  trainer_id,
  verification_token,
  expires_at,
  status
)
SELECT 
  (SELECT id FROM clients LIMIT 1),
  (SELECT id FROM trainers LIMIT 1),
  'test_token_' || gen_random_uuid()::text,
  NOW() + INTERVAL '30 minutes',
  'pending'
RETURNING *;
```

### Test 2: Query Using Indexes

```sql
-- Test token lookup (should use idx_session_confirmations_token)
EXPLAIN ANALYZE
SELECT * FROM session_confirmations 
WHERE verification_token = 'test_token_123';

-- Test client-trainer lookup (should use idx_session_confirmations_client_trainer)
EXPLAIN ANALYZE
SELECT * FROM session_confirmations 
WHERE client_id = 'some-uuid' AND trainer_id = 'some-uuid';

-- Test status filter (should use idx_session_confirmations_status)
EXPLAIN ANALYZE
SELECT * FROM session_confirmations 
WHERE status = 'pending';
```

### Test 3: Verify RLS Policies Work

```sql
-- As authenticated user, should be able to view
SELECT COUNT(*) FROM session_confirmations;

-- As authenticated user, should be able to insert
-- (test via API or with proper auth context)
```

## Rollback Plan (If Needed)

If you need to rollback the migration:

```sql
-- Drop new indexes
DROP INDEX IF EXISTS idx_session_confirmations_client_trainer;
DROP INDEX IF EXISTS idx_session_confirmations_expires_at;

-- Drop new functions
DROP FUNCTION IF EXISTS cleanup_expired_session_confirmations();
DROP FUNCTION IF EXISTS invalidate_previous_verification_tokens(UUID, UUID, TEXT);

-- Restore old RLS policies
DROP POLICY IF EXISTS "Allow cleanup of expired records" ON session_confirmations;
DROP POLICY IF EXISTS "Allow updates for verification" ON session_confirmations;
DROP POLICY IF EXISTS "Authenticated users can view session confirmations" ON session_confirmations;

CREATE POLICY "Anyone can view session confirmations" ON session_confirmations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update session confirmations" ON session_confirmations
  FOR UPDATE USING (true);
```

## Performance Monitoring

After migration, monitor these metrics:

### Index Usage:
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'session_confirmations'
ORDER BY idx_scan DESC;
```

### Table Statistics:
```sql
SELECT 
  schemaname,
  tablename,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'session_confirmations';
```

## Maintenance Schedule

### Daily:
- Run `cleanup_expired_session_confirmations()` to remove old records

### Weekly:
- Review index usage statistics
- Check for dead tuples and run VACUUM if needed

### Monthly:
- Review RLS policy effectiveness
- Analyze query performance
- Review table growth and storage

## Troubleshooting

### Issue: Indexes not being used
**Solution**: Run `ANALYZE session_confirmations;` to update statistics

### Issue: RLS policies blocking legitimate queries
**Solution**: Check authentication context and policy definitions

### Issue: Slow cleanup queries
**Solution**: Verify `idx_session_confirmations_expires_at` partial index exists

### Issue: Token invalidation not working
**Solution**: Verify composite index `idx_session_confirmations_client_trainer` exists

## Next Steps

After successful migration:

1. ✅ Schema is enhanced and ready
2. ⏭️ Proceed to Task 2: Enhance token generation and validation
3. ⏭️ Update API routes to use helper functions (Task 5)
4. ⏭️ Set up automated cleanup job (Task 8)

## Support

If you encounter issues:
1. Check Supabase logs for error messages
2. Verify all prerequisites are met
3. Review the rollback plan if needed
4. Consult the design document for requirements

