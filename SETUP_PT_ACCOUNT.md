
# How to Set Up Personal Trainer Accounts

## 🚨 **Important: The Login Loop Issue**

### **Problem:**
When a PT tries to login, they see the dashboard for a second then get redirected back to login.

### **Root Cause:**
The PT user exists in Supabase Auth but **NOT in the `users` table**. The system requires a record in the `users` table with:
- `role` = 'trainer'
- `trainer_id` = (link to trainers table)

## ✅ **Solution: Proper PT Account Setup**

### **Step 1: Create Trainer Record**
First, create the trainer in the `trainers` table:

```sql
-- In Supabase SQL Editor
INSERT INTO public.trainers (first_name, last_name, email, phone_number, specialization, status)
VALUES ('John', 'Doe', 'john@wtf.com', '1234567890', 'Strength Training', 'active')
RETURNING id;
```

**Copy the returned `id` (UUID)** - you'll need it in Step 3.

### **Step 2: Create Auth Account**
1. Go to Supabase Dashboard
2. Click **Authentication** → **Users**
3. Click **Add User**
4. Enter:
   - Email: `john@wtf.com`
   - Password: (set a password)
   - Auto Confirm User: ✅ Yes
5. Click **Create User**
6. **Copy the User ID (UUID)** from the users list

### **Step 3: Link User to Trainer**
Now link the auth user to the trainer record:

```sql
-- In Supabase SQL Editor
-- Replace <auth_user_id> with the UUID from Step 2
-- Replace <trainer_id> with the UUID from Step 1

INSERT INTO public.users (id, email, password_hash, full_name, role, trainer_id)
VALUES (
  '<auth_user_id>',
  'john@wtf.com',
  'not_used', -- Password is handled by Supabase Auth
  'John Doe',
  'trainer',
  '<trainer_id>'
);
```

### **Step 4: Test Login**
1. Go to login page
2. Click **PT** tab
3. Enter email and password
4. Should successfully login and see only their clients

## 📋 **Complete Example**

### **Example: Creating PT Account for "Sarah Smith"**

**Step 1: Create Trainer**
```sql
INSERT INTO public.trainers (first_name, last_name, email, phone_number, specialization, status)
VALUES ('Sarah', 'Smith', 'sarah@wtf.com', '9876543210', 'Yoga', 'active')
RETURNING id;

-- Result: id = '123e4567-e89b-12d3-a456-426614174000'
```

**Step 2: Create Auth User**
- Email: sarah@wtf.com
- Password: SecurePass123!
- Result: User ID = 'abc12345-6789-0def-ghij-klmnopqrstuv'

**Step 3: Link Them**
```sql
INSERT INTO public.users (id, email, password_hash, full_name, role, trainer_id)
VALUES (
  'abc12345-6789-0def-ghij-klmnopqrstuv',
  'sarah@wtf.com',
  'not_used',
  'Sarah Smith',
  'trainer',
  '123e4567-e89b-12d3-a456-426614174000'
);
```

**Step 4: Login**
- Tab: PT
- Email: sarah@wtf.com
- Password: SecurePass123!
- ✅ Success!

## 🔧 **Quick Fix for Existing PT Users**

If you already have a PT who can't login:

### **Option 1: Add Missing User Record**

```sql
-- Find the trainer
SELECT id, first_name, last_name, email FROM trainers WHERE email = 'pt@email.com';
-- Copy the trainer id

-- Find the auth user
-- Go to Supabase Dashboard → Authentication → Users
-- Find user by email and copy their ID

-- Create the link
INSERT INTO public.users (id, email, password_hash, full_name, role, trainer_id)
VALUES (
  '<auth_user_id>',
  'pt@email.com',
  'not_used',
  'PT Name',
  'trainer',
  '<trainer_id>'
);
```

### **Option 2: Automated Script**

```sql
-- This script creates user records for trainers who don't have them
-- WARNING: This assumes trainer email matches auth email

INSERT INTO public.users (id, email, password_hash, full_name, role, trainer_id)
SELECT 
  auth.users.id,
  auth.users.email,
  'not_used',
  CONCAT(trainers.first_name, ' ', trainers.last_name),
  'trainer',
  trainers.id
FROM auth.users
INNER JOIN trainers ON auth.users.email = trainers.email
WHERE auth.users.id NOT IN (SELECT id FROM public.users);
```

## 🔐 **Admin Account Setup**

### **Step 1: Create Auth User**
1. Supabase Dashboard → Authentication → Users
2. Add User with admin email
3. Copy User ID

### **Step 2: Create Admin Record**
```sql
INSERT INTO public.users (id, email, password_hash, full_name, role)
VALUES (
  '<auth_user_id>',
  'admin@wtf.com',
  'not_used',
  'Admin User',
  'admin'
);
-- Note: No trainer_id for admin
```

## ⚠️ **Common Mistakes**

### **Mistake 1: Only Creating Auth User**
❌ Creating user in Supabase Auth only
✅ Must also create record in `users` table

### **Mistake 2: Wrong trainer_id**
❌ Using wrong UUID or NULL trainer_id
✅ Must match actual trainer record

### **Mistake 3: Wrong Role**
❌ Setting role = 'user' or 'pt'
✅ Must be exactly 'trainer' or 'admin'

### **Mistake 4: Email Mismatch**
❌ Different emails in auth.users and trainers table
✅ Emails must match

## 🧪 **Verification Checklist**

After setting up a PT account, verify:

- [ ] Trainer exists in `trainers` table
- [ ] User exists in Supabase Auth
- [ ] User record exists in `users` table
- [ ] `users.role` = 'trainer'
- [ ] `users.trainer_id` matches trainer UUID
- [ ] Emails match across all tables
- [ ] Can login with PT tab
- [ ] Sees only their clients
- [ ] Cannot see admin features

## 📊 **Database Relationships**

```
auth.users (Supabase Auth)
    ↓ (id)
public.users
    ↓ (trainer_id)
public.trainers
    ↓ (id)
public.clients (trainer_id)
```

## 🚀 **Bulk PT Account Creation**

For creating multiple PT accounts:

```sql
-- 1. Create trainers
INSERT INTO public.trainers (first_name, last_name, email, phone_number, specialization, status)
VALUES 
  ('John', 'Doe', 'john@wtf.com', '1111111111', 'Strength', 'active'),
  ('Jane', 'Smith', 'jane@wtf.com', '2222222222', 'Cardio', 'active'),
  ('Bob', 'Wilson', 'bob@wtf.com', '3333333333', 'Yoga', 'active');

-- 2. Create auth users in Supabase Dashboard (one by one)

-- 3. Link them (run after creating auth users)
-- You'll need to get the auth user IDs and match them manually
```

## 💡 **Best Practice**

### **Recommended Workflow:**
1. Create trainer in `trainers` table
2. Create auth user in Supabase Dashboard
3. Immediately create link in `users` table
4. Test login before moving to next PT

### **Don't:**
- Create auth users in bulk without linking
- Forget to set trainer_id
- Use wrong role values

## 🆘 **Troubleshooting**

### **Issue: "User account not properly set up"**
**Solution:** User exists in auth but not in `users` table. Run Step 3 above.

### **Issue: "Please select the correct role"**
**Solution:** User's role in `users` table doesn't match selected tab. Check role value.

### **Issue: PT sees all clients**
**Solution:** trainer_id is NULL or wrong. Update `users.trainer_id`.

### **Issue: Login loop (dashboard → login → dashboard)**
**Solution:** This is the main issue - user record missing. Follow setup steps above.

## 📞 **Support Query**

To check if PT account is set up correctly:

```sql
-- Check if PT account exists and is linked
SELECT 
  u.id as user_id,
  u.email,
  u.role,
  u.trainer_id,
  t.first_name,
  t.last_name,
  t.email as trainer_email
FROM public.users u
LEFT JOIN public.trainers t ON u.trainer_id = t.id
WHERE u.email = 'pt@email.com';
```

Expected result:
- user_id: (UUID)
- email: pt@email.com
- role: trainer
- trainer_id: (UUID, not NULL)
- first_name: (trainer name)
- last_name: (trainer name)
- trainer_email: pt@email.com

If any field is NULL or wrong, fix it!
