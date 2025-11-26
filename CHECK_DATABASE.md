# 🔍 Database Diagnostics Checklist

## Step 1: Check if session_confirmations table exists

**Go to Supabase Dashboard:**
1. Open https://supabase.com/dashboard
2. Select your project
3. Go to **Table Editor** (left sidebar)
4. Look for table: **session_confirmations**

**If you DON'T see it:**
- ❌ Migration wasn't run
- ✅ Go to SQL Editor and run migration-session-confirmations.sql

**If you DO see it:**
- ✅ Table exists
- Continue to Step 2

---

## Step 2: Check clients table

**In Supabase Table Editor:**
1. Click on **clients** table
2. Find a client to test with
3. Check these columns:

**Critical Fields:**
- `id` - Should have UUID value
- `email` - Should have email address (NOT empty!)
- `trainer_id` - Should have UUID value (NOT null!)
- `full_name` - Should have name
- `status` - Should be 'active'

**Example good row:**
```
id: 123e4567-e89b-12d3-a456-426614174000
email: santhoshpitchai13@gmail.com
trainer_id: 987e6543-e21b-12d3-a456-426614174000
full_name: Santhosh
status: active
```

**If email or trainer_id is empty:**
- This is the problem!
- Update the row manually in Supabase

---

## Step 3: Check trainers table

**In Supabase Table Editor:**
1. Click on **trainers** table
2. Find the trainer assigned to your client
3. Verify the UUID matches client's trainer_id

**Example:**
```
id: 987e6543-e21b-12d3-a456-426614174000
first_name: John
last_name: Smith
email: trainer@gym.com
status: active
```

---

## Step 4: Test the API Directly

**Open browser console (F12) and run:**

```javascript
// Test 1: Check if API route exists
fetch('/api/initiate-session-verification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clientId: 'paste-client-uuid-here',
    trainerId: 'paste-trainer-uuid-here'
  })
})
.then(r => r.json())
.then(data => console.log('API Response:', data))
.catch(err => console.error('API Error:', err))
```

Replace the UUIDs with real ones from your database!

---

## Step 5: Check Environment Variables

**Verify .env.local has:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_your_key_here
```

**Restart server after any changes:**
```bash
npm run dev
```

---

## Step 6: Check RLS Policies

**In Supabase → SQL Editor, run:**

```sql
-- Check if you can read clients
SELECT id, email, full_name, trainer_id, status 
FROM clients 
LIMIT 5;

-- Check if you can read trainers  
SELECT id, first_name, last_name, email
FROM trainers
LIMIT 5;

-- Check if session_confirmations table exists
SELECT * FROM session_confirmations LIMIT 1;
```

**Expected:**
- ✅ Returns rows (or empty but no error)
- ❌ "permission denied" = RLS issue
- ❌ "relation does not exist" = table missing

---

## What Each Error Means

### "Client not found" (404)
**Cause:** 
- Client UUID doesn't exist in database
- Or RLS policy blocking read

**Fix:**
- Verify client exists in Supabase
- Check client UUID is correct
- Run RLS fix SQL

### "Trainer not found" (404)
**Cause:**
- trainer_id on client is null
- Or trainer doesn't exist

**Fix:**
- Assign trainer to client
- Verify trainer exists in trainers table

### "Failed to create verification request" (500)
**Cause:**
- session_confirmations table doesn't exist
- RLS policy blocking insert

**Fix:**
- Run migration-session-confirmations.sql
- Check RLS policies

### Network Error
**Cause:**
- Supabase connection issue
- Wrong credentials in .env.local

**Fix:**
- Verify NEXT_PUBLIC_SUPABASE_URL
- Verify NEXT_PUBLIC_SUPABASE_ANON_KEY
- Check Supabase project is active

---

## Quick SQL to Fix Common Issues

**Run in Supabase SQL Editor:**

```sql
-- 1. Check session_confirmations table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'session_confirmations'
);

-- 2. Find clients without email
SELECT id, full_name, email, trainer_id 
FROM clients 
WHERE email IS NULL OR email = '';

-- 3. Find clients without trainer
SELECT id, full_name, email, trainer_id 
FROM clients 
WHERE trainer_id IS NULL;

-- 4. Update a specific client (replace UUIDs)
UPDATE clients 
SET 
  email = 'santhoshpitchai13@gmail.com',
  trainer_id = 'your-trainer-uuid-here'
WHERE id = 'your-client-uuid-here';
```

---

## ✅ Checklist Before Testing

- [ ] session_confirmations table exists
- [ ] Test client has email address
- [ ] Test client has trainer_id
- [ ] Trainer exists in trainers table  
- [ ] .env.local configured correctly
- [ ] Dev server restarted after .env changes
- [ ] resend package installed
- [ ] Browser console open to see errors

---

## 🆘 Still Stuck?

Share these with me:
1. Screenshot of clients table (one row)
2. Screenshot of trainers table (one row)
3. Browser console error when clicking START
4. Terminal output from npm run dev

This will help pinpoint the exact issue!
