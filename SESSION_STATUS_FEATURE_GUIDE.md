# Session Status Feature - Complete Guide

## Overview
The Session Status feature allows PTs (Personal Trainers) and Admins to track and update the status of client sessions. Each client can have one of three statuses:

- **Pending** 🟡 - Session not yet scheduled
- **Booked** 🔴 - Session scheduled but not confirmed
- **Confirmed** 🟢 - Session confirmed and ready

## How It Works

### Database Structure
The feature uses a `client_sessions` table that links to clients:

```sql
client_sessions
├── id (UUID)
├── client_id (UUID) → links to clients table
├── status (TEXT) → 'pending', 'booked', or 'confirmed'
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### User Interface
On the **Sessions** page (`/dashboard/sessions`), each client row has a dropdown menu in the "Status" column:

```
┌─────────────┬──────────────┬────────────┐
│ Client Name │ Session Type │ Status     │
├─────────────┼──────────────┼────────────┤
│ John Doe    │ 3 months     │ [Pending ▼]│
│ Jane Smith  │ 6 months     │ [Booked  ▼]│
│ Bob Wilson  │ 1 month      │ [Confirmed▼]│
└─────────────┴──────────────┴────────────┘
```

### Status Colors
- **Pending**: Gray text (🟡)
- **Booked**: Red text (🔴)
- **Confirmed**: Green text (🟢)

## Setup Instructions

### Step 1: Run the Database Migration

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Copy the contents of `migration-client-sessions.sql`
   - Paste into the SQL editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Success**
   - You should see: "Success. No rows returned"
   - Check the "Table Editor" to see the new `client_sessions` table

### Step 2: Verify the Feature

1. **Login to Dashboard**
   - Login as Admin or PT

2. **Navigate to Sessions**
   - Click "Sessions" in the sidebar

3. **Test Status Update**
   - Find a client in the list
   - Click the status dropdown
   - Select a different status
   - The status should update immediately

## How PTs Use This Feature

### Scenario 1: New Client Registration
1. Client registers → Status automatically set to **Pending**
2. PT reviews client details
3. PT schedules first session → Changes status to **Booked**
4. Client confirms attendance → PT changes status to **Confirmed**

### Scenario 2: Managing Multiple Clients
1. PT views Sessions page
2. Filters by status: "Show only Pending"
3. Contacts pending clients to schedule
4. Updates status as clients respond

### Scenario 3: Daily Session Planning
1. PT filters by status: "Show only Confirmed"
2. Sees list of clients with confirmed sessions
3. Prepares workout plans for confirmed clients

## Features

### ✅ Real-time Updates
- Status changes are saved immediately to database
- No page refresh needed
- Changes visible to all users instantly

### ✅ Filtering
- Filter sessions by status
- Combine with search and date filters
- Quick access to specific client groups

### ✅ Automatic Creation
- New clients automatically get "Pending" status
- No manual setup required
- Existing clients get status on first page load

### ✅ Role-Based Access
- **Admin**: Can see and update all client statuses
- **PT**: Can see and update only their assigned clients

## Technical Details

### Status Update Flow

```
User clicks dropdown
       ↓
Selects new status
       ↓
handleStatusChange() called
       ↓
Database updated via Supabase
       ↓
Local state updated
       ↓
UI reflects new status
```

### Code Implementation

**Update Status Function:**
```typescript
const handleStatusChange = async (sessionId: string, newStatus: 'booked' | 'confirmed' | 'pending') => {
  // Update database
  await supabase
    .from('client_sessions')
    .upsert({ 
      client_id: sessionId, 
      status: newStatus 
    })
  
  // Update UI
  setClientSessions(prev => 
    prev.map(session => 
      session.id === sessionId 
        ? { ...session, status: newStatus } 
        : session
    )
  )
}
```

**Status Dropdown:**
```tsx
<select
  value={session.status}
  onChange={(e) => handleStatusChange(session.id, e.target.value)}
  className="..."
>
  <option value="pending">Pending</option>
  <option value="booked">Booked</option>
  <option value="confirmed">Confirmed</option>
</select>
```

## Troubleshooting

### Issue: Status dropdown not showing
**Solution:** Run the migration SQL to create the `client_sessions` table

### Issue: Status not updating
**Solution:** 
1. Check browser console for errors
2. Verify RLS policies in Supabase
3. Ensure user is authenticated

### Issue: Status resets after page refresh
**Solution:** 
1. Check if migration was run successfully
2. Verify database connection
3. Check Supabase logs for errors

### Issue: PT can't see any sessions
**Solution:**
1. Verify PT has `trainer_id` set
2. Check if PT has assigned clients
3. Verify RLS policies allow PT access

## Best Practices

### For PTs
1. **Update status promptly** - Keep status current for accurate tracking
2. **Use filters** - Filter by status to focus on specific tasks
3. **Communicate with clients** - Update status after client communication
4. **Review regularly** - Check pending clients daily

### For Admins
1. **Monitor status distribution** - Ensure PTs are updating statuses
2. **Review pending clients** - Follow up on long-pending clients
3. **Track confirmation rates** - Monitor how many bookings get confirmed

## Status Workflow Examples

### Example 1: Onboarding New Client
```
Day 1: Client registers → Pending
Day 2: PT calls client → Booked
Day 3: Client confirms → Confirmed
Day 4: Session happens → (Status remains Confirmed)
```

### Example 2: Rescheduling
```
Current: Confirmed
Client cancels → Pending
PT reschedules → Booked
Client confirms new time → Confirmed
```

### Example 3: Inactive Client
```
Current: Pending (for 7 days)
PT follows up → Still Pending
PT marks inactive → (Admin can mark client as inactive)
```

## Database Queries

### Get all pending sessions
```sql
SELECT c.full_name, cs.status, c.created_at
FROM clients c
JOIN client_sessions cs ON c.id = cs.client_id
WHERE cs.status = 'pending'
ORDER BY c.created_at DESC;
```

### Get PT's confirmed sessions
```sql
SELECT c.full_name, cs.status, t.first_name as trainer_name
FROM clients c
JOIN client_sessions cs ON c.id = cs.client_id
JOIN trainers t ON c.trainer_id = t.id
WHERE cs.status = 'confirmed' AND t.id = 'trainer-uuid-here';
```

### Count sessions by status
```sql
SELECT status, COUNT(*) as count
FROM client_sessions
GROUP BY status;
```

## Summary

The Session Status feature provides:
- ✅ Easy status tracking for all clients
- ✅ Quick filtering and searching
- ✅ Real-time updates
- ✅ Role-based access control
- ✅ Automatic initialization for new clients

**Next Steps:**
1. Run the migration SQL in Supabase
2. Test the feature on the Sessions page
3. Train PTs on how to use status updates
4. Monitor usage and gather feedback

---

**Status**: ✅ Feature Ready
**Migration**: `migration-client-sessions.sql`
**Page**: `/dashboard/sessions`
**Roles**: Admin, PT
