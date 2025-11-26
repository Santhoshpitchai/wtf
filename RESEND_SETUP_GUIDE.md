# 📧 Resend Email Setup Guide

## What is Resend?

Resend is a modern email API service that makes it super easy to send transactional emails (like our verification emails). It's:
- ✅ **Free tier**: 3,000 emails/month, 100 emails/day
- ✅ **Easy to use**: Simple REST API
- ✅ **Fast**: Delivers emails in seconds
- ✅ **Reliable**: High deliverability rates

---

## Step 1: Sign Up for Resend

### A. Go to Resend Website
1. Open your browser
2. Navigate to: **https://resend.com**
3. Click **"Sign Up"** or **"Get Started"** button

### B. Create Account
You can sign up with:
- **GitHub** (recommended - one click)
- **Google**
- **Email + Password**

Choose your preferred method and complete signup.

---

## Step 2: Verify Email (if using email signup)

1. Check your email inbox
2. Click the verification link from Resend
3. Your account is now active!

---

## Step 3: Get Your API Key

### A. Access API Keys
1. Once logged in, you'll be on the dashboard
2. Look for **"API Keys"** in the left sidebar
3. Click on it

### B. Create New API Key
1. Click **"Create API Key"** button
2. Give it a name (e.g., "WTF Fitness Dev" or "Session Verification")
3. Select permission: **"Full Access"** or **"Sending Only"**
4. Click **"Create"**

### C. Copy Your API Key
1. You'll see a key that looks like: `re_123abc456def...`
2. **IMPORTANT**: Copy it immediately - you can only see it once!
3. Click the copy icon or select and copy manually
4. Save it somewhere safe temporarily

**Example API Key format:**
```
re_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

---

## Step 4: Domain Setup (Optional but Recommended)

### Option A: Use Resend Test Domain (Quick Start)
- Resend provides a free test domain
- Format: `onboarding@resend.dev`
- **Limitation**: Can only send to your verified email
- **Good for**: Testing and development

### Option B: Add Your Own Domain (Production)
For production/sending to real clients:

1. **Go to Domains** section in Resend dashboard
2. Click **"Add Domain"**
3. Enter your domain (e.g., `yourgym.com`)
4. Resend will show DNS records to add
5. Add these records to your domain DNS:
   - **SPF Record** (TXT)
   - **DKIM Record** (TXT)
   - **DMARC Record** (TXT)
6. Click **"Verify"** - may take a few minutes to 24 hours

**For now, you can skip this and use the test domain for development!**

---

## Step 5: Add API Key to Your Project

### A. Open Your Terminal
Navigate to your project:
```bash
cd /Users/santhoshpitchai/Desktop/WTF
```

### B. Update `.env.local`
```bash
# If .env.local doesn't exist, create it:
touch .env.local

# Open it in your editor
open .env.local
```

### C. Add These Variables
```env
# Supabase (you should already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend API Key (paste the key you copied)
RESEND_API_KEY=re_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**Replace `re_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456` with your actual API key!**

### D. Save the File
- Save and close `.env.local`
- **IMPORTANT**: Never commit this file to Git (it's in .gitignore)

---

## Step 6: Install Resend Package

Run this command in your terminal:
```bash
npm install resend
```

This installs the official Resend SDK for Node.js.

---

## Step 7: Update API Route Code

The code is already prepared! I'll update it for you in the next step.

---

## Step 8: Test Email Sending

### A. Verify Your Email in Resend (for test domain)
If using `onboarding@resend.dev`:
1. Go to **"Domains"** in Resend dashboard
2. Find the test domain
3. Add your email to **"Verified Emails"**
4. Check your email and verify

### B. Update Email in Test
Make sure one of your test clients has your verified email address.

### C. Test the Flow
1. Start dev server: `npm run dev`
2. Go to Start Session page
3. Click **START** on the client with your email
4. Check your inbox - you should receive the email!
5. Click the verification link
6. Session should auto-start!

---

## Step 9: Verify Email Delivery

### Check Resend Dashboard
1. Go to **"Logs"** or **"Emails"** in Resend dashboard
2. You should see your sent email
3. Check status: **Delivered**, **Opened**, etc.

### Check Your Inbox
- Email should arrive within seconds
- Check spam folder if not in inbox
- Click the verification button/link

---

## Troubleshooting

### Issue: "Invalid API Key" Error
**Solution**:
- Check you copied the key correctly
- Ensure no extra spaces in `.env.local`
- Restart dev server after updating `.env.local`

### Issue: Email Not Sending
**Solution**:
- Check console for error messages
- Verify RESEND_API_KEY is set correctly
- Check Resend dashboard for errors
- Ensure you're using the right "from" email

### Issue: Email Goes to Spam
**Solution**:
- Add proper domain DNS records (SPF, DKIM)
- Use a custom domain instead of test domain
- Add sender to contacts in email client

### Issue: Can't Send to Client Emails
**Solution**:
- If using test domain, you can only send to verified emails
- Add client emails to verified list in Resend, OR
- Set up your own domain

---

## Production Checklist

Before going live:

- [ ] Set up your own domain in Resend
- [ ] Add all DNS records (SPF, DKIM, DMARC)
- [ ] Verify domain in Resend
- [ ] Update `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Test with multiple email providers (Gmail, Outlook, etc.)
- [ ] Update "from" email to match your domain
- [ ] Test email deliverability
- [ ] Check spam score
- [ ] Add unsubscribe link if needed (for compliance)

---

## Email Limits

### Free Tier:
- **3,000 emails/month**
- **100 emails/day**
- Perfect for testing and small gyms

### Paid Plans:
- Start at $20/month
- 50,000 emails/month
- Higher daily limits
- Priority support

For most gyms, free tier is plenty to start!

---

## Quick Reference

### Environment Variables
```env
RESEND_API_KEY=re_your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Test Domain Email
```
from: "WTF Fitness <onboarding@resend.dev>"
```

### Your Domain Email (after setup)
```
from: "WTF Fitness <sessions@yourgym.com>"
```

### API Endpoint
```
https://api.resend.com/emails
```

---

## Next Steps After Setup

1. ✅ Get API key
2. ✅ Add to `.env.local`
3. ✅ Install resend package
4. ✅ Code is already updated (see next file)
5. ✅ Test with your email
6. ✅ Verify in Resend dashboard
7. ✅ Test full verification flow
8. 🚀 You're ready to go!

---

## Support Links

- **Resend Dashboard**: https://resend.com/dashboard
- **Resend Docs**: https://resend.com/docs
- **API Reference**: https://resend.com/docs/api-reference
- **Support**: https://resend.com/support

---

**Questions?** Check the documentation files or reach out for help!
