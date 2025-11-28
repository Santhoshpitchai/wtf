import nodemailer from 'nodemailer'
import { Resend } from 'resend'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType?: string
  }>
}

interface SendEmailResult {
  success: boolean
  error?: string
  devMode: boolean
}

/**
 * Send email using configured email service (Gmail SMTP or Resend)
 * Falls back to development mode if no service is configured
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
  attachments,
}: SendEmailParams): Promise<SendEmailResult> {
  // Check which email service is configured
  const gmailUser = process.env.GMAIL_USER
  const gmailPassword = process.env.GMAIL_APP_PASSWORD
  const resendApiKey = process.env.RESEND_API_KEY

  // Option 1: Gmail SMTP (Recommended for testing)
  if (gmailUser && gmailPassword) {
    return sendViaGmail({ to, subject, html, from, attachments })
  }

  // Option 2: Resend (Original service)
  if (resendApiKey) {
    return sendViaResend({ to, subject, html, from, attachments })
  }

  // Option 3: Development mode (no email service configured)
  return developmentMode({ to, subject, attachments })
}

/**
 * Send email via Gmail SMTP
 */
async function sendViaGmail({
  to,
  subject,
  html,
  from,
  attachments,
}: SendEmailParams): Promise<SendEmailResult> {
  const gmailUser = process.env.GMAIL_USER!
  const gmailPassword = process.env.GMAIL_APP_PASSWORD!

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    })

    await transporter.sendMail({
      from: from || `WTF Fitness <${gmailUser}>`,
      to,
      subject,
      html,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType || 'application/octet-stream',
      })),
    })

    console.log('✅ Email sent successfully via Gmail SMTP')
    console.log(`   To: ${to}`)
    console.log(`   Subject: ${subject}`)

    return { success: true, devMode: false }
  } catch (error) {
    console.error('❌ Gmail SMTP error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      devMode: false,
    }
  }
}

/**
 * Send email via Resend
 */
async function sendViaResend({
  to,
  subject,
  html,
  from,
  attachments,
}: SendEmailParams): Promise<SendEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY!

  try {
    const resend = new Resend(resendApiKey)
    const fromEmail =
      from ||
      process.env.RESEND_FROM_EMAIL ||
      'WTF Fitness <onboarding@resend.dev>'

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
      })),
    })

    if (error) {
      console.error('❌ Resend error:', error)
      return {
        success: false,
        error: error.message,
        devMode: false,
      }
    }

    console.log('✅ Email sent successfully via Resend')
    console.log(`   To: ${to}`)
    console.log(`   Subject: ${subject}`)

    return { success: true, devMode: false }
  } catch (error) {
    console.error('❌ Resend error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      devMode: false,
    }
  }
}

/**
 * Development mode - log email details to console
 */
function developmentMode({
  to,
  subject,
  attachments,
}: Omit<SendEmailParams, 'from' | 'html'>): SendEmailResult {
  console.log('📧 DEVELOPMENT MODE - Email not sent (no email service configured)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('To:', to)
  console.log('Subject:', subject)
  if (attachments && attachments.length > 0) {
    console.log('Attachments:', attachments.map(a => a.filename).join(', '))
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n💡 To enable email sending, configure one of:')
  console.log('   1. Gmail SMTP (Recommended for testing):')
  console.log('      GMAIL_USER=your-email@gmail.com')
  console.log('      GMAIL_APP_PASSWORD=your_16_char_password')
  console.log('   2. Resend:')
  console.log('      RESEND_API_KEY=re_your_key_here')
  console.log('\n   Then restart your dev server\n')

  return { success: false, devMode: true }
}
