# Gmail SMTP Setup Guide

## Why Gmail SMTP?
- ✅ **No email restrictions** - Send to ANY email address
- ✅ **Completely FREE** - 500 emails/day
- ✅ **Works immediately** - No domain verification needed
- ✅ **Perfect for testing** - Test with real client emails

## Setup Steps (5 minutes)

### Step 1: Enable 2-Factor Authentication

1. Go to [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Scroll down to "2-Step Verification"
3. Click "Get Started" and follow the prompts
4. Complete the 2FA setup (you'll need your phone)

### Step 2: Generate App Password

1. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Or: Google Account → Security → 2-Step Verification → App passwords
2. You may need to sign in again
3. In the "Select app" dropdown, choose **"Mail"**
4. In the "Select device" dropdown, choose **"Other (Custom name)"**
5. Type: **"WTF Fitness"**
6. Click **"Generate"**
7. Google will show you a 16-character password like: `abcd efgh ijkl mnop`
8. **Copy this password** (you won't see it again!)

### Step 3: Update Environment Variables

Open your `.env.local` file and add:

```bash
# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

**Important:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `abcdefghijklmnop` with the 16-character password (remove spaces)
- The app password should be 16 characters with no spaces

**Example:**
```bash
GMAIL_USER=santhoshpitchai13@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

### Step 4: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 5: Test It!

1. Go to the Start Session page
2. Click START on any client (with any email address!)
3. Check the client's email inbox
4. You should receive the verification email

## What Changed?

The system now supports multiple email services:

1. **Gmail SMTP** (if `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set) ← **You're using this now!**
2. **Resend** (if `RESEND_API_KEY` is set)
3. **Development Mode** (if neither is set - logs to console)

The system automatically detects which service to use based on your environment variables.

## Troubleshooting

### "Invalid credentials" error

**Problem:** Gmail rejects the login

**Solutions:**
1. Make sure you enabled 2-Factor Authentication first
2. Generate a new App Password
3. Copy the password without spaces: `abcdefghijklmnop` not `abcd efgh ijkl mnop`
4. Make sure you're using your correct Gmail address

### "Less secure app access" message

**Problem:** Gmail says the app is less secure

**Solution:** 
- This is normal! App Passwords are designed for this
- Make sure you're using an App Password, not your regular Gmail password
- App Passwords are actually MORE secure than using your regular password

### Emails going to spam

**Problem:** Verification emails land in spam folder

**Solutions:**
1. This is normal for the first few emails
2. Mark the email as "Not Spam"
3. Add your Gmail address to the client's contacts
4. After a few emails, Gmail will learn it's legitimate

### "Username and Password not accepted"

**Problem:** Authentication fails

**Solutions:**
1. Double-check your Gmail address is correct
2. Make sure you copied the entire 16-character app password
3. Remove any spaces from the app password
4. Try generating a new app password
5. Make sure 2FA is enabled on your Google account

### Still not working?

1. Check the server console for error messages
2. Verify your `.env.local` file has the correct format
3. Make sure you restarted the dev server after adding the credentials
4. Try generating a new app password

## Security Notes

### Is this secure?

✅ **Yes!** App Passwords are designed for this purpose:
- They're separate from your main Gmail password
- You can revoke them anytime without changing your main password
- They only work for the specific app you created them for
- They're stored in environment variables (not in your code)

### Best Practices

- ✅ Never commit `.env.local` to version control (it's in `.gitignore`)
- ✅ Use different app passwords for different applications
- ✅ Revoke app passwords you're no longer using
- ✅ Keep your app password secret (like any password)

### Revoking Access

If you need to revoke access:
1. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Find "WTF Fitness" in the list
3. Click the trash icon to revoke
4. The app will immediately stop being able to send emails

## Switching to Production

When you're ready to go to production, consider:

1. **SendGrid** - 100 emails/day free forever
2. **Amazon SES** - Very cheap at scale
3. **Keep Gmail** - Works fine for small-scale production too!

Gmail SMTP is actually fine for production if you're sending less than 500 emails/day.

## Testing Checklist

- [ ] 2-Factor Authentication enabled on Google account
- [ ] App Password generated
- [ ] `GMAIL_USER` added to `.env.local`
- [ ] `GMAIL_APP_PASSWORD` added to `.env.local` (no spaces)
- [ ] Development server restarted
- [ ] Tested sending to your own email
- [ ] Tested sending to a different email address
- [ ] Verified email received (check spam folder if needed)
- [ ] Clicked verification link and confirmed it works

## Current Configuration

Your system is now configured to:
- ✅ Send emails via Gmail SMTP
- ✅ Send to ANY email address (no restrictions!)
- ✅ Use your Gmail address as the sender
- ✅ Work immediately without domain verification

## Support

### Gmail/Google Support
- App Passwords Help: [https://support.google.com/accounts/answer/185833](https://support.google.com/accounts/answer/185833)
- 2FA Help: [https://support.google.com/accounts/answer/185839](https://support.google.com/accounts/answer/185839)

### Need Help?
If you're still having issues, check:
1. Server console logs for error messages
2. Gmail account security settings
3. Make sure 2FA is properly enabled
4. Try generating a fresh app password

---

**You're all set!** 🎉

You can now send verification emails to any email address without restrictions!
