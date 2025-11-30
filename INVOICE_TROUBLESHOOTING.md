# Invoice Creation Troubleshooting Guide

## Quick Diagnostics

If you're still experiencing issues with invoice creation, follow these steps:

### 1. Check Browser Console

Open your browser's developer tools (F12) and look for errors:

**How to check:**
1. Press F12 to open developer tools
2. Click on the "Console" tab
3. Try creating an invoice
4. Look for red error messages

**Common errors and solutions:**
- `Failed to fetch` → Network issue, check your internet connection
- `401 Unauthorized` → Session expired, try logging out and back in
- `500 Internal Server Error` → Server issue, check server logs

### 2. Check Server Logs

If you're running the development server, check the terminal where you ran `npm run dev`:

**What to look for:**
- `Error generating PDF:` → PDF generation issue
- `Duplicate invoice number` → Race condition (should auto-retry)
- `Error creating invoice record:` → Database issue

### 3. Common Issues and Solutions

#### Issue: "Failed to generate invoice PDF"

**Possible causes:**
1. Puppeteer/Chromium not installed properly
2. Insufficient memory
3. Logo file missing

**Solutions:**
```bash
# Reinstall Puppeteer
npm install puppeteer

# Check if logo exists
ls public/wtf-logo-transparent.png
ls public/wtf-logo.png
```

#### Issue: "Failed to create invoice record after multiple attempts"

**Possible causes:**
1. All 5 retry attempts failed
2. Database connection issue
3. PDF generation keeps failing

**Solutions:**
1. Check your internet connection
2. Verify Supabase is accessible
3. Check server logs for specific error
4. Try again after a few seconds

#### Issue: Invoice created but email not sent

**Possible causes:**
1. Email service not configured
2. Client has no email address
3. Email service quota exceeded

**Solutions:**
1. Check `.env.local` for email configuration
2. Verify client has a valid email
3. Check email service dashboard for quota

### 4. Testing Steps

Try these in order:

**Step 1: Single Invoice**
- Create one invoice
- Wait for success message
- Check if it appears in the list

**Step 2: Multiple Invoices (Slow)**
- Create an invoice
- Wait 5 seconds
- Create another invoice
- Both should succeed

**Step 3: Multiple Invoices (Fast)**
- Create an invoice
- Immediately create another
- Both should succeed (this tests the retry logic)

### 5. Environment Check

Verify your environment variables:

```bash
# Check .env.local file
cat .env.local | grep -E "(SUPABASE|EMAIL)"
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Email service variables (if using email)

### 6. Database Check

Verify the invoices table exists:

1. Go to Supabase dashboard
2. Navigate to Table Editor
3. Check if `invoices` table exists
4. Verify it has these columns:
   - `id`
   - `invoice_number` (unique constraint)
   - `client_id`
   - `amount_paid`
   - `amount_remaining`
   - `payment_date`
   - `subscription_months`
   - `status`
   - `created_at`

### 7. Clear Browser Cache

Sometimes cached data causes issues:

1. Open developer tools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Try creating an invoice again

### 8. Restart Development Server

If all else fails:

```bash
# Stop the server (Ctrl+C)
# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

## Still Having Issues?

If none of the above helps, gather this information:

1. **Exact error message** from the UI
2. **Browser console errors** (screenshot or copy)
3. **Server logs** from terminal (last 50 lines)
4. **Steps to reproduce** the issue
5. **Environment** (development or production)

Then:
- Check the server terminal for detailed error logs
- Look for patterns (does it always fail? only sometimes?)
- Note if it works for some clients but not others

## Success Indicators

You'll know it's working when:
- ✅ Invoice appears in the list immediately
- ✅ Status shows as "Sent" (green)
- ✅ Invoice number is sequential (INV-YYYYMMDD-XXXX)
- ✅ No error messages in console or UI
- ✅ Can create multiple invoices rapidly without errors
