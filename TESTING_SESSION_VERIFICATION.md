# Quick Testing Guide - Session Verification

## Step-by-Step Testing (Without Email)

### 1. Run Database Migration

Go to your Supabase Dashboard → SQL Editor and run:

```sql
-- Copy from migration-session-confirmations.sql
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

CREATE INDEX idx_session_confirmations_client_id ON public.session_confirmations(client_id);
CREATE INDEX idx_session_confirmations_trainer_id ON public.session_confirmations(trainer_id);
CREATE INDEX idx_session_confirmations_token ON public.session_confirmations(verification_token);
CREATE INDEX idx_session_confirmations_status ON public.session_confirmations(status);

ALTER TABLE public.session_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view session confirmations" ON public.session_confirmations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert session confirmations" ON public.session_confirmations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anyone can update session confirmations" ON public.session_confirmations
  FOR UPDATE USING (true);

CREATE TRIGGER update_session_confirmations_updated_at 
  BEFORE UPDATE ON public.session_confirmations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test the Flow

**A. Initiate Session Start**:
1. Navigate to: http://localhost:3000/dashboard/start-session
2. Find any active client card
3. Click the "START" button
4. You should see:
   - Alert: "Verification email sent to client! Waiting for approval..."
   - Button changes to "WAITING FOR APPROVAL" with spinner
   - Status badge shows "⏳ Waiting for Client Approval"

**B. Check Console for Verification URL**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. You should see something like:
   ```
   Verification email would be sent to: client@example.com
   Verification URL: http://localhost:3000/verify-session?token=abc123...
   ```
4. **Copy this URL**

**C. Simulate Client Approval**:
1. Open a new browser tab
2. Paste the verification URL
3. You should see the verification page with a loading spinner
4. After a moment, you should see:
   - ✓ Success message
   - Client and trainer names
   - "Session approved successfully!"

**D. Watch Auto-Start**:
1. Go back to the Start Session page tab
2. Within 5 seconds, you should see:
   - Alert: "Session approved by client! Session started."
   - Button changes to "END" (enabled)
   - Status shows "Session In Progress" with green pulse
   - Card border turns teal

### 4. Test Edge Cases

**Test Expired Link**:
   - In the database, manually set `expires_at` to past date
   - Try to verify → Should show "Link Expired" message

**Test Already Approved**:
   - Click the same verification link again
   - Should show "Already Approved" message

**Test Timeout**:
   - Click "START" but don't verify
   - Wait 5+ minutes
   - Should automatically reset to "Ready to Start"

## Expected Console Output

### When PT Clicks START:
```
Verification email would be sent to: kavya@example.com
Verification URL: http://localhost:3000/verify-session?token=abc123def456...
```

### When Client Clicks Link:
```
Verifying session...
Session approved successfully!
```

### During Polling (every 5 seconds):
```
Checking approval status...
Status: pending
```

### When Approved:
```
Status: approved
Session started!
```

## Visual Checklist

✅ **Before START**:
- [ ] Button says "START" (green/teal)
- [ ] Status: "Ready to Start"
- [ ] No border on card

✅ **After clicking START**:
- [ ] Alert shows
- [ ] Button changes to "WAITING FOR APPROVAL"
- [ ] Amber/yellow spinner visible
- [ ] Status: "⏳ Waiting for Client Approval"
- [ ] Console shows verification URL

✅ **Verification Page**:
- [ ] Shows loading spinner initially
- [ ] Shows success icon when done
- [ ] Displays client name
- [ ] Displays trainer name
- [ ] Professional styling

✅ **After Approval**:
- [ ] Auto-start alert appears
- [ ] Button changes to "END" (red)
- [ ] Status: "Session In Progress"
- [ ] Card gets teal border
- [ ] Pulse animation on status badge

## Troubleshooting Quick Fixes

### "Client not found" error:
- Ensure the client_id exists in your clients table
- Check that client has an email address

### "Trainer not found" error:
- Ensure trainer_id is set on the client
- Verify trainer exists in trainers table

### Polling doesn't stop:
- Refresh the page
- Check browser console for errors
- Verify database connection

### Session doesn't auto-start:
- Check if verification actually succeeded (check verification page)
- Look for errors in console
- Verify polling is active (should see API calls every 5s in Network tab)

## Database Verification

Check if records are created:
```sql
-- See all confirmation requests
SELECT * FROM session_confirmations ORDER BY created_at DESC LIMIT 10;

-- Check specific client
SELECT c.full_name, sc.status, sc.created_at, sc.verified_at
FROM session_confirmations sc
JOIN clients c ON c.id = sc.client_id
WHERE c.full_name = 'Client Name';
```

## Success Criteria

Your implementation is working if:
1. ✅ Clicking START creates a record in `session_confirmations`
2. ✅ Verification URL is generated
3. ✅ Verification page loads and works
4. ✅ Approval updates database status to 'approved'
5. ✅ Session auto-starts within 5 seconds of approval
6. ✅ UI updates correctly at each stage
7. ✅ Error states display properly

---

**Tips**:
- Keep DevTools open to see console output
- Use Network tab to see API calls
- Check Supabase dashboard to verify database changes
- Test with multiple clients to ensure it works reliably
