# Setup Test Users for RBAC Testing

## Creating Admin User

### Step 1: Sign up as Admin
1. Go to the signup page
2. Select "ADMIN" role
3. Fill in the form with admin credentials
4. Submit the form

### Step 2: Verify Admin User in Database
Run this query in Supabase SQL Editor to verify:

```sql
SELECT id, email, role FROM public.users WHERE role = 'admin';
```

## Creating PT User

### Step 1: Sign up as PT
1. Go to the signup page
2. Select "PT" role
3. Fill in the form with PT credentials
4. Submit the form

### Step 2: Create Trainer Record for PT User
After the PT user is created, you need to link them to a trainer record.

Run this query in Supabase SQL Editor (replace the email with your PT user's email):

```sql
-- First, get the user_id for the PT user
SELECT id, email FROM public.users WHERE role = 'pt' AND email = 'pt@example.com';

-- Then create a trainer record linked to this user
INSERT INTO public.trainers (
  user_id,
  first_name,
  last_name,
  email,
  phone_number,
  status
) VALUES (
  'USER_ID_FROM_ABOVE_QUERY',  -- Replace with actual user_id
  'John',
  'Trainer',
  'pt@example.com',
  '1234567890',
  'active'
);
```

### Alternative: Use the Create PT Page (Admin Only)
1. Login as Admin
2. Go to "Create PT" page
3. Fill in the trainer details
4. This creates a trainer record, but you still need to manually link it to a user account

## Quick Setup SQL Script

Run this in Supabase SQL Editor to create complete test users:

```sql
-- Note: You'll need to create the auth users first through the signup page
-- Then run this to link them to trainer records

-- Example: Link existing PT user to trainer
DO $$
DECLARE
  pt_user_id UUID;
BEGIN
  -- Get the PT user's ID (replace email with your PT user's email)
  SELECT id INTO pt_user_id FROM auth.users WHERE email = 'pt@example.com';
  
  -- Create trainer record if it doesn't exist
  INSERT INTO public.trainers (
    user_id,
    first_name,
    last_name,
    email,
    phone_number,
    status
  ) VALUES (
    pt_user_id,
    'John',
    'Trainer',
    'pt@example.com',
    '1234567890',
    'active'
  )
  ON CONFLICT (email) DO NOTHING;
END $$;
```

## Testing Login

### Test Admin Login
1. Go to login page
2. Select "ADMIN" role
3. Enter admin credentials
4. Verify you see all menu items:
   - Personal Trainers
   - Client Details
   - PT Sales
   - Create PT
   - Payments
   - Sessions
   - Start Session

### Test PT Login
1. Go to login page
2. Select "PT" role
3. Enter PT credentials
4. Verify you see limited menu items:
   - Client Details
   - Payments
   - Sessions
   - Start Session

## Common Issues

### Issue: PT user can't see any clients
**Solution**: Make sure the PT user has a trainer record in the trainers table with their user_id

### Issue: PT user sees "No trainer assigned" error
**Solution**: Run the SQL script above to link the user to a trainer record

### Issue: Can't access admin pages as admin
**Solution**: Verify the user's role in the users table is set to 'admin'

### Issue: RLS policies blocking all access
**Solution**: Make sure the user is properly authenticated and their session is valid

## Verification Queries

Check if PT user is properly linked to trainer:
```sql
SELECT 
  u.id as user_id,
  u.email,
  u.role,
  t.id as trainer_id,
  t.first_name,
  t.last_name
FROM public.users u
LEFT JOIN public.trainers t ON t.user_id = u.id
WHERE u.role = 'pt';
```

Check clients assigned to a specific trainer:
```sql
SELECT 
  c.client_id,
  c.full_name,
  c.email,
  t.first_name as trainer_first_name,
  t.last_name as trainer_last_name
FROM public.clients c
JOIN public.trainers t ON c.trainer_id = t.id
WHERE t.email = 'pt@example.com';
```
