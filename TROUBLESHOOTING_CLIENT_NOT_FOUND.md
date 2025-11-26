# 🔧 Troubleshooting "Client not found" Error

## The Error You're Seeing

```
Client not found
```

This appears when clicking START on the Start Session page.

---

## 🎯 Step-by-Step Fix

### Step 1: Run Database Migration (CRITICAL!)

**You MUST run this first!**

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy the SQL below and run it:

```sql
-- Session Confirmations Table
-- This table tracks session verification requests sent to clients

CREATE TABLE IF NOT EXISTS public.session_confirmations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  trainer_id UUID REFERENCES public.trainers(id) ON DELETE CASCADE NOT NULL,
  verification_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_session_confirmations_client_id ON public.session_confirmations(client_id);
CREATE INDEX idx_session_confirmations_trainer_id ON public.session_confirmations(trainer_id);
CREATE INDEX idx_session_confirmations_token ON public.session_confirmations(verification_token);
CREATE INDEX idx_session_confirmations_status ON public.session_confirmations(status);

-- Enable RLS
ALTER TABLE public.session_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view session confirmations" ON public.session_confirmations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert session confirmations" ON public.session_confirmations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anyone can update session confirmations" ON public.session_confirmations
  FOR UPDATE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_session_confirmations_updated_at 
  BEFORE UPDATE ON public.session_confirmations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

4. Click **"Run"**
5. Wait for success message

---

### Step 2: Verify .env.local Settings

**Open `.env.local` and make sure you have:**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_your_resend_key_here
```

**Check:**
- ✅ All values are filled in (no "your_xxx_here" placeholders)
- ✅ No extra spaces
- ✅ RESEND_API_KEY starts with `re_`
- ✅ URLs don't have trailing slashes

---

### Step 3: Restart Dev Server

**IMPORTANT:** After changing `.env.local`, you MUST restart!

```bash
# Stop current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

---

### Step 4: Check Browser Console

1. Open your app
2. Press **F12** (or Cmd+Option+I on Mac)
3. Go to **Console** tab
4. Click **START** on a client
5. Look for error messages

**Common errors:**
- "Client not found" → Database issue
- "Trainer not found" → Missing trainer_id
- Network errors → Supabase connection issue

---

### Step 5: Verify Client Has Email

Make sure the client you're testing with has:
- ✅ An email address set
- ✅ A trainer_id assigned
- ✅ Status = 'active'

**Check in Supabase Dashboard:**
1. Go to **Table Editor**
2. Open **clients** table
3. Find your test client (e.g., "Santhosh")
4. Verify:
   - Email column has value
   - trainer_id column has UUID
   - status = 'active'

---

## 🔍 Common Issues & Solutions

### Issue: "Client not found"
**Cause:** Client ID doesn't exist or RLS blocking
**Fix:** 
- Verify client exists in database
- Run RLS fix (provided earlier)

### Issue: "Trainer not found"  
**Cause:** trainer_id is null or invalid
**Fix:**
- Assign trainer to client in database
- Make sure trainer exists in trainers table

### Issue: Email not sending
**Cause:** Resend not configured
**Fix:**
- Check RESEND_API_KEY is correct
- Verify domain in Resend dashboard
- Check console for email logs

### Issue: "Cannot find module 'resend'"
**Cause:** Package not installed
**Fix:**
```bash
npm install resend
```

---

## 📋 Quick Checklist

Before testing again, verify:

- [ ] Database migration run successfully
- [ ] `session_confirmations` table exists in Supabase
- [ ] `.env.local` has all required variables
- [ ] RESEND_API_KEY is valid (starts with `re_`)
- [ ] Dev server restarted after .env changes
- [ ] Test client has email address
- [ ] Test client has trainer_id assigned
- [ ] Browser console open to see errors
- [ ] `resend` package installed (`npm install resend`)

---

## 🧪 Test Step by Step

1. **Open browser console** (F12)
2. **Go to Start Session page**
3. **Find a client with email and trainer**
4. **Click START**
5. **Watch console for messages**

### Expected Console Output (Success):
```
📧 DEVELOPMENT MODE - Email not sent (if no RESEND_API_KEY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: client@example.com
Subject: Session Start Approval Required
Verification URL: http://localhost:3000/verify-session?token=abc123...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Or (if Resend configured):
```
✅ Email sent successfully via Resend: {id: '...'}
```

---

## 🆘 Still Not Working?

### Check These:

1. **Supabase Connection**
   - Can you see clients on the page?
   - If yes → Supabase is connected ✅
   - If no → Check Supabase credentials

2. **Network Tab (F12 → Network)**
   - Click START
   - Look for `/api/initiate-session-verification`
   - Check if it's returning 404, 500, or 200
   - Red = error, Green = success

3. **API Route Logs**
   - Check terminal where `npm run dev` is running
   - Look for error messages

---

## 💡 Quick Test Without Email

Want to skip email for now and just test the flow?

**Console Workaround:**
1. Click START
2. Copy verification URL from console
3. Open in new tab
4. Session should auto-start!

This proves the system works even if email isn't sending yet.

---

## 🚀 After Fixing

Once fixed, you should see:
1. Click START → No error popup ✅
2. Card shows "WAITING FOR APPROVAL" ✅
3. Console shows verification URL ✅
4. Can test by opening URL manually ✅
5. Session auto-starts after verification ✅

---

**Need more help?** Share:
- Browser console errors (screenshot)
- Terminal output from `npm run dev`
- Supabase SQL editor results
