# Setup Instructions for Witness The Fitness

## Quick Start Guide

### 1. Environment Variables

Create a `.env.local` file in the root directory with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to find these:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **Project URL** and **anon/public key**

### 2. Disable Email Confirmation (For Development)

To test authentication without email verification:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. **Disable** the option "Confirm email"
4. Click **Save**

This allows users to sign up and immediately sign in without needing to confirm their email.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Testing Authentication

### Sign Up Flow

1. Navigate to [http://localhost:3000/signup](http://localhost:3000/signup)
2. Select your role (Admin or PT)
3. Fill in the form:
   - First Name
   - Last Name
   - Email
   - Phone Number (optional)
   - Password (minimum 6 characters)
   - Confirm Password
4. Click "Sign up"
5. You should see a success message and be redirected to the login page

### Sign In Flow

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Select your role (must match the role you signed up with)
3. Enter your email and password
4. Click "Sign in"
5. You should be redirected to the dashboard

## Common Issues

### "Invalid login credentials"
- Make sure you're selecting the correct role (Admin or PT)
- Verify your email and password are correct
- Check that email confirmation is disabled in Supabase

### "Failed to create account"
- Check browser console for detailed error messages
- Verify your Supabase credentials in `.env.local`
- Ensure your Supabase project is active

### "Token has expired or is invalid"
- This usually happens if email confirmation is enabled
- Disable email confirmation as described above

### Database trigger not working
- The trigger should be automatically created via MCP
- Verify it exists by checking Supabase Dashboard → Database → Functions
- Look for `handle_new_user` function

## Database Schema

The database includes:
- **users**: User authentication and profile data (auto-created on signup)
- **trainers**: Personal trainer information
- **clients**: Client management
- **payments**: Payment tracking
- **sessions**: Training session scheduling
- **pt_sales**: Sales tracking

All tables have Row Level Security (RLS) enabled.

## Security Notes

- Never commit `.env.local` to version control
- Use strong passwords for production
- Enable email confirmation for production deployments
- Consider enabling MFA for admin accounts in production

## Next Steps

After successful authentication:
1. Explore the dashboard at `/dashboard/clients`
2. Create your first client
3. Add trainers (Admin only)
4. Track payments and sessions

## Support

For issues or questions, check:
- Browser console for error messages
- Supabase logs in Dashboard → Logs
- README.md for additional documentation
