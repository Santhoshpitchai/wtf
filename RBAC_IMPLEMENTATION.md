# Role-Based Access Control (RBAC) Implementation

## Overview
Implemented comprehensive role-based access control to separate Admin and PT (Personal Trainer) functionalities.

## Changes Made

### 1. Database Layer (RLS Policies)
**File: Migration applied via MCP**

- Updated Row Level Security (RLS) policies for all tables
- **Admin Role**: Full access to all data (clients, payments, sessions, trainers, pt_sales)
- **PT Role**: Restricted access to only their own data
  - Can only view/manage clients assigned to them
  - Can only view/manage payments for their clients
  - Can only view/manage sessions for their clients
  - Can only view/manage their own PT sales

### 2. Authentication Helper
**File: `/lib/auth.ts`** (NEW)

Created helper functions to:
- Get current user with role and trainer_id
- Check if user is admin or PT
- Get current trainer_id for PT users

### 3. Sidebar Navigation
**File: `/components/Sidebar.tsx`**

- **Admin Menu**: Management features (Personal Trainers, Client Details, PT Sales, Create PT)
- **PT Menu**: Operational features (Client Details, Payments, Sessions, Start Session)
- Displays user role and email in profile section
- **Note**: Payments and Sessions removed from Admin to avoid confusion - these are PT responsibilities

### 4. Protected Route Component
**File: `/components/ProtectedRoute.tsx`** (NEW)

- Reusable component to protect admin-only routes
- Automatically redirects unauthorized users
- Shows loading state during authentication check

### 5. Page-Level Protection

#### Admin-Only Pages (Protected)
- `/dashboard/trainers` - View and manage all trainers
- `/dashboard/create-pt` - Create new PT accounts
- `/dashboard/sales` - View all PT sales

#### Shared Pages (Role-Based Data)
- `/dashboard/clients` - Admins see all clients, PTs see only their clients
- `/dashboard/payments` - Admins see all payments, PTs see only their client payments
- `/dashboard/sessions` - Admins see all sessions, PTs see only their client sessions
- `/dashboard/start-session` - Both can start sessions for their respective clients

### 6. Client Management Updates
**File: `/app/dashboard/clients/page.tsx`**

- PT users automatically assigned as trainer when creating clients
- Trainer selection field hidden for PT users (auto-assigned)
- PT users can only edit their own clients
- Data automatically filtered by RLS policies

## User Experience

### Admin Login
1. Selects "ADMIN" role on login page
2. Sees management-focused sidebar menu
3. Can manage trainers, create PTs, view PT sales
4. Can view all clients and assign them to trainers
5. **Does NOT see**: Payments, Sessions, Start Session (PT responsibilities)

### PT Login
1. Selects "PT" role on login page
2. Sees operational sidebar menu
3. Can manage their own clients, payments, and sessions
4. Clients are automatically assigned to them
5. Cannot access admin-only pages (Trainers, Create PT, PT Sales)

## Security Features

1. **Database Level**: RLS policies enforce data isolation at the database level
2. **Application Level**: Protected routes prevent unauthorized page access
3. **UI Level**: Role-based menus hide unavailable features
4. **Form Level**: Auto-assignment prevents PTs from assigning clients to other trainers

## Testing Checklist

### Admin User Testing
- [ ] Can view all trainers
- [ ] Can create new PT accounts
- [ ] Can view all clients (from all trainers)
- [ ] Can assign clients to any trainer
- [ ] Can access PT Sales page
- [ ] **Cannot** access Payments page (PT only)
- [ ] **Cannot** access Sessions page (PT only)
- [ ] **Cannot** access Start Session page (PT only)

### PT User Testing
- [ ] Cannot access Trainers page (redirected)
- [ ] Cannot access Create PT page (redirected)
- [ ] Cannot access PT Sales page (redirected)
- [ ] Can only see their own clients
- [ ] New clients automatically assigned to them
- [ ] Cannot see trainer selection dropdown
- [ ] Can manage payments for their clients only
- [ ] Can manage sessions for their clients only
- [ ] Can start sessions for their clients

## Migration Instructions

To apply these changes to your Supabase project:

1. The RLS policies have been applied via MCP
2. Ensure you have at least one admin user and one PT user in the database
3. Test both roles thoroughly
4. Create a PT user by:
   - First creating a user in auth with role 'pt'
   - Then creating a corresponding trainer record with that user_id

## Notes

- All data filtering happens at the database level via RLS policies
- Even if someone bypasses the UI, they cannot access unauthorized data
- PT users must have a corresponding trainer record in the trainers table
- The system automatically links users to their trainer records via user_id
