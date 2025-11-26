# Email Configuration Guide

This guide explains how to configure and test email delivery for the client session verification feature.

## Overview

The WTF Fitness application uses [Resend](https://resend.com) to send verification emails to clients when personal trainers initiate sessions. This document covers setup, configuration, and testing.

## Environment Variables

### Required Variables

#### `RESEND_API_KEY`
- **Required**: Yes (for production)
- **Purpose**: Authenticates with Resend API to send emails
- **How to get**:
  1. Sign up at [https://resend.com](https://resend.com)
  2. Navigate to API Keys section
  3. Create a new API key
  4. Copy the key (starts with `re_`)

```bash
RESEND_API_KEY=re_your_api_key_here
```

#### `NEXT_PUBLIC_APP_URL`
- **Required**: Yes
- **Purpose**: Generates correct verification links in emails
- **Values**:
  - Development: `http://localhost:3000`
  - Production: `https://your-domain.com`

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional Variables

#### `RESEND_FROM_EMAIL`
- **Required**: No
- **Default**: `WTF Fitness <onboarding@resend.dev>`
- **Purpose**: Customizes the sender email address
- **Recommendation**: Use a verified domain for production

```bash
RESEND_FROM_EMAIL=WTF Fitness <noreply@yourdomain.com>
```

## Development Mode

When `RESEND_API_KEY` is not configured, the system runs in development mode:

- ✅ Verification records are still created in the database
- ✅ Verification URLs are logged to the console
- ❌ No actual emails are sent
- 💡 Console displays setup instructions

### Development Mode Console Output

```
📧 DEVELOPMENT MODE - Email not sent (RESEND_API_KEY not configured)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: client@example.com
Subject: Session Start Approval Required
Verification URL: http://localhost:3000/verify-session?token=abc123...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 To enable email sending:
1. Sign up at https://resend.com
2. Get your API key
3. Add to .env.local: RESEND_API_KEY=re_your_key_here
4. Run: npm install resend
5. Restart your dev server
```

## Production Setup

### Step 1: Verify Your Domain

For production use, you should verify your own domain with Resend:

1. Go to [https://resend.com/domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records provided by Resend to your domain's DNS settings:
   - SPF record
   - DKIM record
   - DMARC record (optional but recommended)
5. Wait for verification (usually 5-15 minutes)
6. Once verified, you can send from any email address at that domain

### Step 2: Update Environment Variables

Update your production environment variables:

```bash
# Production .env
RESEND_API_KEY=re_your_production_api_key
RESEND_FROM_EMAIL=WTF Fitness <noreply@yourdomain.com>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 3: Test Email Delivery

1. Deploy your application to staging/production
2. Initiate a test session with a real client email
3. Verify the email is received
4. Check email deliverability:
   - Inbox placement (not spam)
   - Email formatting
   - Links work correctly
   - Mobile responsiveness

## Email Template

The verification email includes:

- ✅ Client's full name
- ✅ Trainer's full name
- ✅ Clickable verification button
- ✅ Plain text link (fallback)
- ✅ 30-minute expiration notice
- ✅ Branded styling with WTF Fitness colors
- ✅ Mobile-responsive design

### Email Preview

```
Subject: Session Start Approval Required

Hello [Client Name],

Your trainer [Trainer Name] has initiated a session with you.

Please click the button below to approve and start your session:

[Approve Session Start Button]

Or copy and paste this link into your browser:
http://localhost:3000/verify-session?token=...

This link will expire in 30 minutes.
If you did not expect this request, please contact your trainer.
```

## Testing Checklist

### Local Development Testing

- [ ] Start application without `RESEND_API_KEY`
- [ ] Click START button for a client
- [ ] Verify console shows verification URL
- [ ] Copy URL from console and test in browser
- [ ] Verify session approval works

### Staging Environment Testing

- [ ] Configure `RESEND_API_KEY` in staging
- [ ] Use test email address (your own)
- [ ] Click START button for test client
- [ ] Verify email is received
- [ ] Check email formatting in multiple clients:
  - [ ] Gmail
  - [ ] Outlook
  - [ ] Apple Mail
  - [ ] Mobile devices
- [ ] Click verification link
- [ ] Verify session starts successfully

### Production Testing

- [ ] Verify domain is configured in Resend
- [ ] Update `RESEND_FROM_EMAIL` to verified domain
- [ ] Test with real client email
- [ ] Monitor email delivery rates
- [ ] Check spam folder placement
- [ ] Verify links use HTTPS

## Monitoring and Troubleshooting

### Check Email Delivery Status

1. Log in to [Resend Dashboard](https://resend.com/emails)
2. View recent emails sent
3. Check delivery status:
   - ✅ Delivered
   - ⏳ Pending
   - ❌ Failed
   - 🚫 Bounced

### Common Issues

#### Emails Not Sending

**Symptom**: No emails received, console shows development mode

**Solution**:
1. Verify `RESEND_API_KEY` is set in `.env.local`
2. Restart development server
3. Check API key is valid in Resend dashboard

#### Emails Going to Spam

**Symptom**: Emails delivered but in spam folder

**Solution**:
1. Verify your domain with Resend
2. Add SPF, DKIM, and DMARC records
3. Use verified domain in `RESEND_FROM_EMAIL`
4. Avoid spam trigger words in email content

#### Invalid Token Errors

**Symptom**: Verification link shows "Invalid token"

**Solution**:
1. Check `NEXT_PUBLIC_APP_URL` matches your domain
2. Verify token hasn't expired (30 minutes)
3. Check database for confirmation record

#### Email Delivery Failures

**Symptom**: API returns email error

**Solution**:
1. Check Resend API key is valid
2. Verify recipient email is valid
3. Check Resend account status (not suspended)
4. Review Resend logs for specific error

## API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Verification email sent successfully",
  "verificationUrl": "http://localhost:3000/verify-session?token=...",
  "confirmationId": "uuid",
  "emailSent": true,
  "devMode": false
}
```

### Development Mode Response

```json
{
  "success": true,
  "message": "Verification created (email not sent - check console)",
  "verificationUrl": "http://localhost:3000/verify-session?token=...",
  "confirmationId": "uuid",
  "emailSent": false,
  "devMode": true
}
```

### Error Response

```json
{
  "success": true,
  "message": "Verification created but email failed to send",
  "verificationUrl": "http://localhost:3000/verify-session?token=...",
  "confirmationId": "uuid",
  "emailSent": false,
  "emailError": "Invalid API key",
  "devMode": false
}
```

## Security Considerations

### Email Security

- ✅ Verification tokens are cryptographically secure (32 bytes)
- ✅ Tokens expire after 30 minutes
- ✅ Tokens are single-use only
- ✅ HTTPS required for production verification links
- ✅ Email addresses validated before sending

### API Key Security

- ⚠️ Never commit `RESEND_API_KEY` to version control
- ⚠️ Use different API keys for development and production
- ⚠️ Rotate API keys periodically
- ⚠️ Restrict API key permissions if possible

## Rate Limits

Resend has the following rate limits (as of 2024):

- **Free Plan**: 100 emails/day
- **Paid Plans**: Higher limits based on plan

Monitor your usage in the Resend dashboard to avoid hitting limits.

## Support

### Resend Support

- Documentation: [https://resend.com/docs](https://resend.com/docs)
- Support: [https://resend.com/support](https://resend.com/support)
- Status: [https://status.resend.com](https://status.resend.com)

### Application Support

For issues specific to the WTF Fitness application, check:
- Application logs
- Supabase database records
- Browser console for frontend errors
