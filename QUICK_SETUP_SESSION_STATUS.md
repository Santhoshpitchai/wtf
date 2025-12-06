# Quick Setup: Session Status Feature

## Problem
The status dropdown in the Sessions page isn't working because the `client_sessions` table doesn't exist in the database.

## Solution (5 minutes)

### Step 1: Open Supabase
1. Go to https://supabase.com
2. Login and select your WTF project

### Step 2: Run Migration
1. Click **"SQL Editor"** in left sidebar
2. Click **"New Query"**
3. Copy ALL the code from `migration-client-sessions.sql`
4. Paste into the editor
5. Click **"Run"** (or press Ctrl+Enter)

### Step 3: Verify
1. Go to **"Table Editor"** in left sidebar
2. Look for **"client_sessions"** table
3. You should see it with columns: id, client_id, status, created_at, updated_at

### Step 4: Test
1. Go to your app: `/dashboard/sessions`
2. Find a client in the list
3. Click the **Status** dropdown
4. Change from "Pending" to "Booked" or "Confirmed"
5. Status should update immediately!

## What This Does

Creates a new table that tracks session status for each client:
- **Pending** 🟡 - Not yet scheduled
- **Booked** 🔴 - Scheduled but not confirmed  
- **Confirmed** 🟢 - Confirmed and ready

## How PTs Use It

1. **View Sessions page** - See all clients with their status
2. **Click dropdown** - Select new status
3. **Filter by status** - Use filter button to show only Pending/Booked/Confirmed
4. **Track progress** - Know which clients need follow-up

## Visual Guide

### Before Migration:
```
Sessions Page → Status dropdown → ❌ Not working
```

### After Migration:
```
Sessions Page → Status dropdown → ✅ Working!
                                  ├─ Pending
                                  ├─ Booked
                                  └─ Confirmed
```

## Status Colors

- **Pending**: Gray (waiting to schedule)
- **Booked**: Red (scheduled, needs confirmation)
- **Confirmed**: Green (all set!)

## That's It!

Once you run the migration, the feature works automatically. No code changes needed!

---

**Need Help?** Check `SESSION_STATUS_FEATURE_GUIDE.md` for detailed documentation.
