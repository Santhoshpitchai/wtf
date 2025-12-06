# Invoice Creation Debugging Guide

## Quick Checks

### 1. Check if the API route is accessible

Open your browser console and run:

```javascript
fetch('/api/invoices', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(d => console.log('API Response:', d))
.catch(e => console.error('API Error:', e))
```

**Expected:** Should return a list of invoices or empty array
**If it fails:** Environment variables are not set correctly

### 2. Check Supabase connection

In browser console:

```javascript
// Check if Supabase URL is set
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

**Expected:** Should show your Supabase URL
**If undefined:** Environment variables not loaded

### 3. Test invoice creation with minimal data

In browser console (replace CLIENT_ID with an actual client ID):

```javascript
fetch('/api/invoices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: 'YOUR_CLIENT_ID_HERE',
    amount_paid: 1000,
    amount_remaining: 0,
    payment_date: '2024-12-02',
    subscription_months: 1
  })
})
.then(r => r.json())
.then(d => console.log('Create Response:', d))
.catch(e => console.error('Create Error:', e))
```

## Common Issues and Solutions

### Issue 1: "Missing Supabase environment variables"

**Cause:** Environment variables not set in Vercel

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add these variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```
3. Redeploy

### Issue 2: "Client does not have a registered email address"

**Cause:** The selected client doesn't have an email in the database

**Solution:**
1. Go to Dashboard → Clients
2. Edit the client and add an email address
3. Try creating the invoice again

### Issue 3: "Failed to generate invoice PDF"

**Cause:** Puppeteer/Chromium issues in production

**Solution:**
This is expected in development mode. The invoice will be created without PDF.
In production on Vercel, it should work with the serverless Chromium setup.

### Issue 4: Invoice creation hangs/freezes

**Cause:** Network timeout or API route not responding

**Check:**
1. Open Network tab in DevTools
2. Look for `/api/invoices` request
3. Check if it's pending for too long
4. Check the response status and body

**Solution:**
- If timeout: Check Vercel function logs
- If 500 error: Check error message in response
- If 404: API route not deployed correctly

### Issue 5: "Email failed to send"

**Cause:** Resend API key not configured or invalid

**Solution:**
1. Check if `RESEND_API_KEY` is set in Vercel
2. Verify the API key is valid in Resend dashboard
3. Check if `RESEND_FROM_EMAIL` is set correctly

**Note:** In development, emails won't actually send (dev mode)

## Step-by-Step Debugging Process

### Step 1: Check Environment Variables

Run locally:
```bash
npm run dev
```

Then check console for any environment variable warnings.

### Step 2: Check Database Connection

1. Go to Dashboard → Clients
2. If clients load, database connection is working
3. If not, check Supabase credentials

### Step 3: Check API Routes

1. Open browser DevTools → Network tab
2. Try creating an invoice
3. Look for the `/api/invoices` POST request
4. Click on it to see:
   - Request payload
   - Response status
   - Response body
   - Any error messages

### Step 4: Check Browser Console

1. Open DevTools → Console tab
2. Look for any JavaScript errors
3. Look for any network errors
4. Check for any warning messages

### Step 5: Check Vercel Logs (if deployed)

1. Go to Vercel Dashboard → Your Project
2. Click on "Functions" tab
3. Look for `/api/invoices` function
4. Check the logs for any errors

## What to Share for Help

If you're still having issues, please share:

1. **Exact error message** from browser console
2. **Network request details:**
   - Request URL
   - Request method
   - Request payload
   - Response status
   - Response body
3. **Vercel deployment logs** (if applicable)
4. **Screenshots** of the error (if visual)

## Quick Fixes

### Fix 1: Clear browser cache and reload
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### Fix 2: Restart development server
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### Fix 3: Clear Next.js cache
```bash
rm -rf .next
npm run build
npm run dev
```

### Fix 4: Check if client has email
```sql
-- Run this in Supabase SQL Editor
SELECT id, full_name, email FROM clients WHERE email IS NULL OR email = '';
```

If any clients are missing emails, update them:
```sql
UPDATE clients SET email = 'client@example.com' WHERE id = 'client_id_here';
```

## Testing Checklist

Before creating an invoice, verify:

- [ ] You're logged in as a Personal Trainer
- [ ] At least one active client exists
- [ ] The client has an email address
- [ ] Environment variables are set (in production)
- [ ] API routes are accessible
- [ ] No console errors on page load

## Still Not Working?

If none of the above helps, please provide:

1. The exact step where it fails
2. Any error messages (console, network, visual)
3. Whether it's happening locally or on Vercel
4. Screenshots if possible

I'll help you debug further!
