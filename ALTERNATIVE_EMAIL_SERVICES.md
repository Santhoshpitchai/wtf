# Alternative Email Services to Resend

If you don't want to use Resend, here are other email service options with their pros, cons, and integration guides.

## Comparison Table

| Service | Free Tier | Pricing | Ease of Setup | Best For |
|---------|-----------|---------|---------------|----------|
| **SendGrid** | 100 emails/day forever | $19.95/mo for 50k | Easy | Production apps |
| **Mailgun** | 5,000 emails/month (3 months) | $35/mo for 50k | Medium | Developers |
| **Amazon SES** | 62,000 emails/month (if on AWS) | $0.10 per 1,000 | Complex | AWS users |
| **Postmark** | 100 emails/month | $15/mo for 10k | Easy | Transactional |
| **Brevo (Sendinblue)** | 300 emails/day | $25/mo for 20k | Easy | Marketing + Transactional |
| **Gmail SMTP** | 500 emails/day | Free | Very Easy | Small projects |
| **Nodemailer + SMTP** | Depends on provider | Varies | Easy | Any SMTP server |

---

## Option 1: SendGrid (Recommended Alternative)

**Pros:**
- ✅ 100 emails/day free forever
- ✅ No domain verification required for testing
- ✅ Excellent deliverability
- ✅ Great documentation
- ✅ Easy to use

**Cons:**
- ❌ Requires account verification
- ❌ More expensive than Resend for high volume

### Setup Instructions

#### 1. Create SendGrid Account
1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Sign up for free account
3. Verify your email address

#### 2. Create API Key
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Name it (e.g., "WTF Fitness")
4. Select "Full Access" or "Restricted Access" with Mail Send permission
5. Copy the API key (starts with `SG.`)

#### 3. Install SendGrid Package
```bash
npm install @sendgrid/mail
```

#### 4. Update Environment Variables
```bash
# .env.local
SENDGRID_API_KEY=SG.your_api_key_here
EMAIL_SERVICE=sendgrid
```

#### 5. Update API Route

Create a new file `lib/email.ts`:

```typescript
import sgMail from '@sendgrid/mail'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  const apiKey = process.env.SENDGRID_API_KEY
  
  if (!apiKey) {
    console.log('📧 DEVELOPMENT MODE - Email not sent (SENDGRID_API_KEY not configured)')
    console.log('To:', to)
    console.log('Subject:', subject)
    return { success: false, devMode: true }
  }

  sgMail.setApiKey(apiKey)

  const msg = {
    to,
    from: from || 'noreply@yourdomain.com', // Use your verified sender
    subject,
    html,
  }

  try {
    await sgMail.send(msg)
    console.log('✅ Email sent successfully via SendGrid')
    return { success: true, devMode: false }
  } catch (error) {
    console.error('SendGrid error:', error)
    return { success: false, error, devMode: false }
  }
}
```

Then update `app/api/initiate-session-verification/route.ts`:

```typescript
import { sendEmail } from '@/lib/email'

// Replace the Resend code with:
const { success, error: emailError } = await sendEmail({
  to: client.email,
  subject: emailSubject,
  html: emailBody,
  from: 'WTF Fitness <noreply@yourdomain.com>'
})
```

---

## Option 2: Mailgun

**Pros:**
- ✅ 5,000 free emails for 3 months
- ✅ Good for developers
- ✅ Flexible API

**Cons:**
- ❌ Free tier expires after 3 months
- ❌ Requires credit card for verification

### Setup Instructions

#### 1. Create Mailgun Account
1. Go to [https://mailgun.com](https://mailgun.com)
2. Sign up and verify your account
3. Add credit card (required even for free tier)

#### 2. Get API Credentials
1. Go to Settings → API Keys
2. Copy your Private API Key
3. Note your domain (e.g., `sandboxXXX.mailgun.org`)

#### 3. Install Mailgun Package
```bash
npm install mailgun.js form-data
```

#### 4. Update Environment Variables
```bash
# .env.local
MAILGUN_API_KEY=your_api_key_here
MAILGUN_DOMAIN=sandboxXXX.mailgun.org
EMAIL_SERVICE=mailgun
```

#### 5. Create Email Helper

```typescript
// lib/email.ts
import formData from 'form-data'
import Mailgun from 'mailgun.js'

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  const apiKey = process.env.MAILGUN_API_KEY
  const domain = process.env.MAILGUN_DOMAIN
  
  if (!apiKey || !domain) {
    console.log('📧 DEVELOPMENT MODE')
    return { success: false, devMode: true }
  }

  const mailgun = new Mailgun(formData)
  const mg = mailgun.client({ username: 'api', key: apiKey })

  try {
    await mg.messages.create(domain, {
      from: from || `WTF Fitness <mailgun@${domain}>`,
      to: [to],
      subject,
      html,
    })
    console.log('✅ Email sent via Mailgun')
    return { success: true, devMode: false }
  } catch (error) {
    console.error('Mailgun error:', error)
    return { success: false, error, devMode: false }
  }
}
```

---

## Option 3: Amazon SES (Best for AWS Users)

**Pros:**
- ✅ 62,000 free emails/month if hosted on AWS
- ✅ Very cheap ($0.10 per 1,000 emails)
- ✅ Highly scalable
- ✅ Excellent deliverability

**Cons:**
- ❌ Complex setup
- ❌ Requires AWS account
- ❌ Starts in sandbox mode (limited recipients)

### Setup Instructions

#### 1. Create AWS Account
1. Go to [https://aws.amazon.com](https://aws.amazon.com)
2. Sign up and verify your account

#### 2. Set Up SES
1. Go to AWS Console → SES
2. Verify your email address or domain
3. Request production access (to send to any email)
4. Create SMTP credentials or use AWS SDK

#### 3. Install AWS SDK
```bash
npm install @aws-sdk/client-ses
```

#### 4. Update Environment Variables
```bash
# .env.local
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
EMAIL_SERVICE=ses
```

#### 5. Create Email Helper

```typescript
// lib/email.ts
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  const client = new SESClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  const command = new SendEmailCommand({
    Source: from || 'noreply@yourdomain.com',
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: html } },
    },
  })

  try {
    await client.send(command)
    console.log('✅ Email sent via Amazon SES')
    return { success: true, devMode: false }
  } catch (error) {
    console.error('SES error:', error)
    return { success: false, error, devMode: false }
  }
}
```

---

## Option 4: Gmail SMTP (Easiest for Testing)

**Pros:**
- ✅ Completely free
- ✅ 500 emails/day
- ✅ Very easy setup
- ✅ No account verification needed
- ✅ Works immediately

**Cons:**
- ❌ Not recommended for production
- ❌ May be flagged as spam
- ❌ Requires app password (2FA)

### Setup Instructions

#### 1. Enable App Password
1. Go to [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. Go to App Passwords
4. Generate password for "Mail"
5. Copy the 16-character password

#### 2. Install Nodemailer
```bash
npm install nodemailer
```

#### 3. Update Environment Variables
```bash
# .env.local
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_password
EMAIL_SERVICE=gmail
```

#### 4. Create Email Helper

```typescript
// lib/email.ts
import nodemailer from 'nodemailer'

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  
  if (!user || !pass) {
    console.log('📧 DEVELOPMENT MODE')
    return { success: false, devMode: true }
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })

  try {
    await transporter.sendMail({
      from: from || `WTF Fitness <${user}>`,
      to,
      subject,
      html,
    })
    console.log('✅ Email sent via Gmail')
    return { success: true, devMode: false }
  } catch (error) {
    console.error('Gmail error:', error)
    return { success: false, error, devMode: false }
  }
}
```

---

## Option 5: Nodemailer with Any SMTP

**Pros:**
- ✅ Works with any SMTP server
- ✅ Very flexible
- ✅ Can use your hosting provider's SMTP

**Cons:**
- ❌ Requires SMTP credentials
- ❌ Configuration varies by provider

### Setup Instructions

#### 1. Get SMTP Credentials
From your hosting provider (GoDaddy, Bluehost, etc.) or email service

#### 2. Install Nodemailer
```bash
npm install nodemailer
```

#### 3. Update Environment Variables
```bash
# .env.local
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your_password
EMAIL_SERVICE=smtp
```

#### 4. Create Email Helper

```typescript
// lib/email.ts
import nodemailer from 'nodemailer'

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  try {
    await transporter.sendMail({
      from: from || process.env.SMTP_USER,
      to,
      subject,
      html,
    })
    console.log('✅ Email sent via SMTP')
    return { success: true, devMode: false }
  } catch (error) {
    console.error('SMTP error:', error)
    return { success: false, error, devMode: false }
  }
}
```

---

## Recommendation by Use Case

### For Quick Testing (Right Now)
**Use Gmail SMTP** - Easiest and fastest to set up, works immediately

### For Production (Small to Medium)
**Use SendGrid** - Best balance of features, pricing, and ease of use

### For Production (High Volume)
**Use Amazon SES** - Most cost-effective at scale

### For Existing AWS Infrastructure
**Use Amazon SES** - Already integrated with your stack

### For Marketing + Transactional
**Use Brevo** - Good for both types of emails

---

## Migration Steps from Resend

If you want to switch from Resend to another service:

### 1. Choose Your Service
Pick one from the options above

### 2. Install Required Package
```bash
npm install [package-name]
```

### 3. Create Email Helper
Create `lib/email.ts` with the code from your chosen service

### 4. Update API Route
Replace Resend code in `app/api/initiate-session-verification/route.ts`:

```typescript
// Remove this:
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

// Add this:
import { sendEmail } from '@/lib/email'

// Replace email sending code:
const { success, error: emailError } = await sendEmail({
  to: client.email,
  subject: emailSubject,
  html: emailBody,
})
```

### 5. Update Environment Variables
Add the new service's credentials to `.env.local`

### 6. Test
Restart your server and test email sending

---

## My Recommendation for You

Based on your needs, I recommend:

**For immediate testing**: **Gmail SMTP**
- Set up in 5 minutes
- No restrictions on recipient emails
- Free and works immediately

**For production**: **SendGrid**
- 100 emails/day free forever
- Professional and reliable
- Easy to scale when needed

Would you like me to help you implement one of these alternatives?
