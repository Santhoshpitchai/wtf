# PT Email Validation Implementation

## Overview
This document describes the implementation of Personal Trainer (PT) email validation to ensure that only PTs whose emails are pre-registered by administrators can login or create accounts.

## Problem Statement
Previously, any user could sign up as a PT without their email being registered in the system by an administrator. This implementation ensures that:
- PT accounts can only be created if the email exists in the `trainers` table
- PT login is restricted to emails that exist in the `trainers` table with `active` status
- Unauthorized PT accounts cannot access the system

## Implementation Details

### 1. Database Function (`is_pt_email_registered`)

**Location**: Supabase Database Migration

**Purpose**: Validates if a PT email exists in the trainers table with active status

```sql
CREATE OR REPLACE FUNCTION public.is_pt_email_registered(pt_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.trainers 
    WHERE LOWER(email) = LOWER(pt_email)
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Features**:
- Case-insensitive email matching
- Only checks for active trainers
- Accessible to both authenticated and anonymous users
- Returns boolean (true if email exists and is active, false otherwise)

### 2. Database Trigger (`validate_pt_signup_trigger`)

**Location**: Supabase Database Migration

**Purpose**: Prevents PT user records from being created if email doesn't exist in trainers table

```sql
CREATE OR REPLACE FUNCTION public.validate_pt_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'pt' THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM public.trainers 
      WHERE LOWER(email) = LOWER(NEW.email)
      AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'PT email not registered. Please contact administrator to register your email first.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Features**:
- Triggers before INSERT on `users` table
- Only validates PT role users
- Raises exception if email not found in trainers table
- Provides clear error message to user

### 3. Signup Page Validation

**File**: `/app/signup/page.tsx`

**Changes**:
- Added pre-signup validation for PT role
- Calls `is_pt_email_registered` RPC function before attempting signup
- Shows clear error message if email not registered
- Prevents unnecessary auth.signUp calls for unregistered emails

**Code Flow**:
```typescript
if (role === 'pt') {
  const { data: isRegistered, error: checkError } = await supabase
    .rpc('is_pt_email_registered', { pt_email: email })

  if (!isRegistered) {
    setError('This email is not registered as a Personal Trainer. Please contact your administrator to register your email first.')
    return
  }
}
```

### 4. Login Page Validation

**File**: `/app/page.tsx`

**Changes**:
- Added pre-login validation for PT role
- Calls `is_pt_email_registered` RPC function before attempting login
- Verifies trainer record exists and is active after successful authentication
- Signs out user if trainer record is invalid or inactive

**Code Flow**:
```typescript
// Pre-login check
if (role === 'pt') {
  const { data: isRegistered } = await supabase
    .rpc('is_pt_email_registered', { pt_email: email })
  
  if (!isRegistered) {
    setError('This email is not registered as a Personal Trainer...')
    return
  }
}

// Post-login verification
if (role === 'pt') {
  const { data: trainerData } = await supabase
    .from('trainers')
    .select('id, status')
    .eq('email', email)
    .single()

  if (!trainerData || trainerData.status !== 'active') {
    await supabase.auth.signOut()
    return
  }
}
```

### 5. Protected Route Enhancement

**File**: `/components/ProtectedRoute.tsx`

**Changes**:
- Added runtime validation for PT users on protected routes
- Verifies trainer record exists and is active
- Automatically signs out and redirects if validation fails
- Provides additional security layer beyond login

**Code Flow**:
```typescript
if (currentUser.role === 'pt') {
  const { data: trainerData } = await supabase
    .from('trainers')
    .select('id, status, email')
    .eq('email', currentUser.email)
    .single()

  if (!trainerData || trainerData.status !== 'active') {
    await supabase.auth.signOut()
    router.push('/')
    return
  }
}
```

## Security Layers

This implementation provides **4 layers of security**:

1. **Frontend Validation (Signup)**: Checks email before signup attempt
2. **Frontend Validation (Login)**: Checks email before and after login
3. **Database Trigger**: Prevents user record creation if email not registered
4. **Protected Route**: Runtime validation on every protected page access

## Admin Workflow

### Creating a New PT

1. Admin logs into the system
2. Navigates to "Create PT" page
3. Fills in PT details including email
4. Submits the form
5. PT record is created in `trainers` table with `active` status

### PT Can Now:
- Sign up using the registered email
- Login using the registered email
- Access protected PT routes

### If Admin Deactivates PT:
- Set `status` to `inactive` in `trainers` table
- PT will be unable to login
- PT will be automatically signed out from active sessions

## Testing Guide

### Test Case 1: PT Signup with Unregistered Email
1. Go to signup page
2. Select "PT" role
3. Enter an email NOT in the trainers table
4. Fill other details and submit
5. **Expected**: Error message "This email is not registered as a Personal Trainer..."

### Test Case 2: PT Signup with Registered Email
1. Admin creates PT with email `test@example.com`
2. Go to signup page
3. Select "PT" role
4. Enter `test@example.com`
5. Fill other details and submit
6. **Expected**: Account created successfully

### Test Case 3: PT Login with Unregistered Email
1. Go to login page
2. Select "PT" role
3. Enter an email NOT in the trainers table
4. Enter password and submit
5. **Expected**: Error message "This email is not registered as a Personal Trainer..."

### Test Case 4: PT Login with Inactive Status
1. Admin creates PT and sets status to `inactive`
2. PT tries to login
3. **Expected**: Error message "Your trainer account is inactive..."

### Test Case 5: Admin Signup/Login
1. Admin can signup/login normally
2. **Expected**: No email validation for admin role

## Error Messages

| Scenario | Error Message |
|----------|--------------|
| PT signup with unregistered email | "This email is not registered as a Personal Trainer. Please contact your administrator to register your email first." |
| PT login with unregistered email | "This email is not registered as a Personal Trainer. Please contact your administrator to register your email first." |
| PT login with inactive status | "Your trainer account is inactive. Please contact your administrator." |
| No trainer record found | "No trainer record found. Please contact your administrator." |
| RPC function error | "Failed to verify PT email. Please try again." |

## Database Schema Requirements

### trainers table must have:
- `email` column (TEXT, UNIQUE)
- `status` column (TEXT, CHECK constraint for 'active'/'inactive')

### users table must have:
- `email` column (TEXT, UNIQUE)
- `role` column (TEXT, CHECK constraint for 'admin'/'pt')

## Benefits

1. **Enhanced Security**: Multiple validation layers prevent unauthorized access
2. **Admin Control**: Only admins can authorize PT accounts
3. **Status Management**: Admins can activate/deactivate PTs
4. **Clear Error Messages**: Users understand why they cannot access the system
5. **Automatic Cleanup**: Invalid sessions are automatically terminated

## Future Enhancements

1. Email notification to PT when their account is created
2. Email notification when account is deactivated
3. Admin dashboard to manage PT status
4. Bulk PT import functionality
5. PT invitation system with temporary tokens

## Troubleshooting

### Issue: PT cannot signup even with registered email
**Solution**: 
- Check if email in trainers table matches exactly (case-insensitive)
- Verify trainer status is 'active'
- Check database function permissions

### Issue: Database trigger not working
**Solution**:
- Verify trigger is created: `SELECT * FROM pg_trigger WHERE tgname = 'validate_pt_signup_trigger'`
- Check function exists: `SELECT * FROM pg_proc WHERE proname = 'validate_pt_signup'`
- Review Supabase logs for trigger errors

### Issue: RPC function not accessible
**Solution**:
- Verify function permissions: `GRANT EXECUTE ON FUNCTION public.is_pt_email_registered(TEXT) TO authenticated, anon`
- Check Supabase API logs for permission errors

## Conclusion

This implementation ensures that Personal Trainers can only access the system if their email is pre-registered by an administrator. The multi-layer validation approach provides robust security while maintaining a good user experience with clear error messages.
