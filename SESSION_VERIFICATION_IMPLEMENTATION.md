# Session Verification Implementation Guide

## Overview

This implementation adds client-side verification for session starts. When a PT (Personal Trainer) clicks "Start Session", an email verification is sent to the client. The session only starts after the client approves it via email.

## Flow Diagram

```
PT clicks START → Email sent to Client → Client clicks link → Session starts automatically
```

## Components

### 1. Database Table: `session_confirmations`

**Location**: `migration-session-confirmations.sql`

Stores verification requests with the following fields:
- `id`: Unique identifier
- `client_id`: Reference to the client
- `trainer_id`: Reference to the trainer
- `verification_token`: Unique token for email link
- `status`: pending | approved | expired
- `expires_at`: Expiration timestamp (30 minutes)
- `verified_at`: When client approved
- `created_at`, `updated_at`: Timestamps

**To set up**: Run this SQL in your Supabase SQL Editor:
```bash
# Copy the contents of migration-session-confirmations.sql
# Paste into Supabase SQL Editor and run
```

### 2. API Route: Initiate Verification

**Location**: `/app/api/initiate-session-verification/route.ts`

**What it does**:
1. Receives client_id and trainer_id
2. Fetches client's email from database
3. Generates a unique verification token
4. Creates a record in `session_confirmations` table
5. Prepares email with verification link
6. Returns verification URL (for testing without email service)

**Email Integration**: Currently logs the email content. To enable actual emails:
1. Sign up for [Resend](https://resend.com) (free tier available)
2. Add `RESEND_API_KEY` to your `.env.local`
3. Add `NEXT_PUBLIC_APP_URL` (your app's URL)
4. Uncomment the email sending code in the route

### 3. API Route: Verify Session

**Location**: `/app/api/verify-session/route.ts`

**What it does**:
1. Receives verification token from client's click
2. Validates token exists and is not expired
3. Checks if already approved
4. Updates status to 'approved' if valid
5. Returns success/error response

### 4. Verification Page

**Location**: `/app/verify-session/page.tsx`

**What it does**:
- Beautiful UI that shows when client clicks email link
- Automatically calls verification API
- Shows success/error/expired states
- Displays client and trainer names on success

### 5. Updated Start Session Page

**Location**: `/app/dashboard/start-session/page.tsx`

**Key Changes**:
- Added `pending_approval` session status
- Updated `handleStartSession` to:
  - Call verification API
  - Show "Waiting for Approval" status
  - Start polling for approval
- Added `pollForApproval` function that:
  - Checks database every 5 seconds
  - Auto-starts session when approved
  - Handles timeout (5 minutes)
  - Handles expired links
- New UI states:
  - Amber spinner during pending approval
  - Visual feedback for waiting state

## How to Test

### Without Email Service (Development)

1. **Run the database migration**:
   - Open Supabase SQL Editor
   - Paste contents from `migration-session-confirmations.sql`
   - Click "Run"

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Test the flow**:
   - Go to the Start Session page
   - Click "START" on any client card
   - Check browser console - you'll see the verification URL logged
   - Copy the URL from console
   - Open it in a new tab (simulating client clicking email)
   - Go back to Start Session page - session should auto-start!

### With Email Service (Production)

1. **Set up Resend**:
   - Sign up at [Resend](https://resend.com)
   - Verify your domain (or use their test domain)
   - Get your API key

2. **Update environment variables** in `.env.local`:
   ```env
   NEXT_PUBLIC_APP_URL=https://your-production-url.com
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

3. **Uncomment email code**:
   - Open `/app/api/initiate-session-verification/route.ts`
   - Uncomment the Resend email sending code (lines marked with TODO)
   - Update the `from` email address to your verified domain

4. **Test**:
   - Click "START" on a client
   - Client receives email
   - Client clicks link in email
   - Session starts automatically!

## Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change for production
RESEND_API_KEY=your_resend_api_key  # Optional for testing
```

## Security Features

1. **Token Expiration**: Links expire after 30 minutes
2. **Single Use**: Once approved, same link can't be used again
3. **Database Validation**: All checks happen server-side
4. **Secure Tokens**: Uses crypto.randomBytes for token generation
5. **RLS Policies**: Supabase Row Level Security enabled

## User Experience

### For Personal Trainers (PT):
1. Click "START" button
2. See "Waiting for Approval" status with spinner
3. Session auto-starts when client approves
4. Get timeout notification if no response in 5 minutes

### For Clients:
1. Receive professional email
2. Click clear "Approve Session Start" button
3. See success confirmation page
4. Can close window

## Customization Options

### Email Template
Edit the HTML in `/app/api/initiate-session-verification/route.ts`:
- Change colors (teal to your brand color)
- Update wording
- Add logo/branding
- Customize styling

### Polling Interval
In `page.tsx`, the `pollForApproval` function:
- Default: Check every 5 seconds
- Default timeout: 5 minutes (60 attempts × 5 seconds)
- Adjust these values as needed

### Link Expiration
In `/app/api/initiate-session-verification/route.ts`:
- Default: 30 minutes
- Change `expiresAt.setMinutes(expiresAt.getMinutes() + 30)` to desired duration

## Troubleshooting

### Issue: Email not sending
- Check RESEND_API_KEY is set correctly
- Verify domain in Resend dashboard
- Check console logs for errors
- Ensure code is uncommented

### Issue: Session not auto-starting
- Check browser console for polling errors
- Verify database connection
- Check session_confirmations table has the record
- Ensure token matches

### Issue: Link expired immediately
- Check server timezone settings
- Verify database timezone
- Ensure clock sync is correct

### Issue: Polling not working
- Check if there are JavaScript errors
- Verify Supabase connection
- Check Row Level Security policies

## Future Enhancements

Potential improvements:
1. **WebSocket Integration**: Real-time updates instead of polling
2. **SMS Verification**: Alternative to email
3. **Push Notifications**: Mobile app notifications
4. **WhatsApp Integration**: Use WhatsApp for verification
5. **QR Code**: Generate QR code for in-person verification
6. **Multi-factor**: Require both email and SMS
7. **Analytics**: Track verification rates and times

## Database Queries for Monitoring

### Check pending verifications:
```sql
SELECT * FROM session_confirmations 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

### Check expired links:
```sql
SELECT * FROM session_confirmations 
WHERE status = 'pending' 
AND expires_at < NOW();
```

### Verification success rate:
```sql
SELECT 
  status, 
  COUNT(*) as count 
FROM session_confirmations 
GROUP BY status;
```

## Support

For issues or questions:
1. Check the console logs (browser and server)
2. Verify all environment variables are set
3. Ensure database migration ran successfully
4. Check Supabase dashboard for RLS policy issues

---

**Implementation Date**: 2025-11-26
**Version**: 1.0
