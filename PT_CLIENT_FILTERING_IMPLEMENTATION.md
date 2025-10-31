# PT Client Filtering Implementation

## Overview
This document describes the implementation of Personal Trainer (PT) specific client filtering, ensuring that each PT can only see and manage their own clients, not all clients in the system.

## Database Changes

### Migration: `add_pt_client_filtering`

#### Row Level Security (RLS) Policies Updated

The migration implements proper RLS policies to enforce PT-specific data access at the database level.

##### Clients Table Policies

**Removed:**
- "Anyone authenticated can view clients" - Too permissive
- "Authenticated users can insert clients" - Too permissive
- "Authenticated users can update clients" - Too permissive

**Added:**
1. **"Admins can view all clients"** - Admins can see all clients
2. **"PTs can view their own clients"** - PTs can only see clients where `trainer_id` matches their own
3. **"Admins can insert clients"** - Admins can create clients for any trainer
4. **"PTs can insert their own clients"** - PTs can only create clients assigned to themselves
5. **"Admins can update any client"** - Admins can update any client
6. **"PTs can update their own clients"** - PTs can only update their own clients

##### Payments Table Policies

**Removed:**
- "Anyone authenticated can view payments" - Too permissive
- "Authenticated users can insert payments" - Too permissive
- "Authenticated users can update payments" - Too permissive

**Added:**
1. **"Admins can view all payments"** - Admins can see all payments
2. **"PTs can view their clients payments"** - PTs can only see payments for their clients
3. **"Admins can insert payments"** - Admins can create payments for any client
4. **"PTs can insert payments for their clients"** - PTs can only create payments for their clients
5. **"Admins can update payments"** - Admins can update any payment
6. **"PTs can update payments for their clients"** - PTs can only update payments for their clients

##### Sessions Table Policies

**Removed:**
- "Anyone authenticated can view sessions" - Too permissive
- "Authenticated users can insert sessions" - Too permissive
- "Authenticated users can update sessions" - Too permissive

**Added:**
1. **"Admins can view all sessions"** - Admins can see all sessions
2. **"PTs can view their clients sessions"** - PTs can only see sessions where `trainer_id` matches their own
3. **"Admins can insert sessions"** - Admins can create sessions for any trainer
4. **"PTs can insert sessions for their clients"** - PTs can only create sessions for themselves
5. **"Admins can update sessions"** - Admins can update any session
6. **"PTs can update sessions for their clients"** - PTs can only update their own sessions

## Frontend Changes

### Updated Files

#### 1. `/app/dashboard/clients/page.tsx`
- Added `currentUser` state to track the logged-in user
- Updated `fetchClients()` to accept `user` parameter
- Added explicit filtering: `query.eq('trainer_id', user.trainer_id)` for PT users
- Updated all `fetchClients()` calls to pass `currentUser`
- PT users automatically have clients assigned to their `trainer_id` when creating/editing

#### 2. `/app/dashboard/payments/page.tsx`
- Added `currentUser` state
- Updated `fetchClients()` to accept `user` parameter
- Added filtering by `trainer_id` for PT users
- Created `loadUserAndData()` function to fetch user and data together

#### 3. `/app/dashboard/start-session/page.tsx`
- Added `currentUser` state
- Updated `fetchClients()` to accept `user` parameter
- Added filtering by `trainer_id` for PT users
- Created `loadUserAndData()` function

### How It Works

1. **On Page Load:**
   - `loadUserAndData()` is called
   - Gets current user with `getCurrentUser()` from `/lib/auth.ts`
   - User object includes `role` ('admin' or 'pt') and `trainer_id` (for PT users)
   - Passes user to `fetchClients(user)`

2. **Fetching Clients:**
   - If user is Admin: Fetches all clients
   - If user is PT: Adds `.eq('trainer_id', user.trainer_id)` filter to query
   - RLS policies enforce this at database level as well

3. **Creating/Updating Clients:**
   - Admin: Can assign any trainer
   - PT: Automatically assigns to their own `trainer_id`
   - RLS policies prevent PTs from creating clients for other trainers

## Data Flow

```
User Login → getCurrentUser() → Returns { role, trainer_id }
                                          ↓
                                   fetchClients(user)
                                          ↓
                        If PT: query.eq('trainer_id', user.trainer_id)
                                          ↓
                                    RLS Policies Enforce
                                          ↓
                                  Only PT's clients returned
```

## Security

### Multi-Layer Protection

1. **Database Level (RLS):** Policies prevent unauthorized access even if frontend is bypassed
2. **Application Level:** Explicit filtering in queries
3. **UI Level:** PT users don't see trainer selection dropdown (auto-assigned)

### Testing

To test the implementation:

1. **As Admin:**
   - Login as admin user
   - Navigate to Clients page
   - Should see ALL clients from all trainers

2. **As PT:**
   - Login as PT user
   - Navigate to Clients page
   - Should ONLY see clients where `trainer_id` matches your trainer ID
   - Try to create a client - should auto-assign to your trainer ID
   - Navigate to Payments page - should only see payments for your clients
   - Navigate to Start Session page - should only see your clients

## Migration Command

The migration was applied using Supabase MCP:

```typescript
mcp0_apply_migration({
  name: 'add_pt_client_filtering',
  query: '...' // SQL from above
})
```

## Benefits

1. **Data Isolation:** Each PT can only access their own client data
2. **Security:** Multi-layer protection prevents data leaks
3. **Scalability:** Works efficiently with many PTs and clients
4. **Maintainability:** Clear separation of concerns
5. **Compliance:** Helps meet data privacy requirements

## Future Enhancements

Potential improvements:
- Add PT dashboard showing only their client statistics
- Add PT-specific reports and analytics
- Implement client transfer between PTs (admin only)
- Add audit logs for PT actions
