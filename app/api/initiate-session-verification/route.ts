import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

// Create a Supabase client with service role for server-side operations
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    
    const { clientId, trainerId } = await request.json()

    if (!clientId || !trainerId) {
      return NextResponse.json(
        { error: 'Client ID and Trainer ID are required' },
        { status: 400 }
      )
    }

    // Fetch client details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, email, full_name')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      console.error('Client lookup error:', clientError)
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Fetch trainer details
    const { data: trainer, error: trainerError } = await supabase
      .from('trainers')
      .select('id, first_name, last_name')
      .eq('id', trainerId)
      .single()

    if (trainerError || !trainer) {
      return NextResponse.json(
        { error: 'Trainer not found' },
        { status: 404 }
      )
    }

    // Invalidate any existing pending verifications for this client-trainer pair
    // This ensures only the most recent token is valid (Requirements 8.3, 8.4)
    const { error: invalidateError } = await supabase
      .from('session_confirmations')
      .update({ status: 'expired' })
      .eq('client_id', clientId)
      .eq('trainer_id', trainerId)
      .eq('status', 'pending')

    if (invalidateError) {
      console.error('Error invalidating old tokens:', invalidateError)
      // Continue anyway - this is not critical
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Set expiration (30 minutes from now)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)

    // Create session confirmation record
    const { data: confirmation, error: confirmError } = await supabase
      .from('session_confirmations')
      .insert({
        client_id: clientId,
        trainer_id: trainerId,
        verification_token: verificationToken,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single()

    if (confirmError) {
      console.error('Error creating confirmation:', confirmError)
      return NextResponse.json(
        { error: 'Failed to create verification request' },
        { status: 500 }
      )
    }

    // Generate verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const verificationUrl = `${baseUrl}/verify-session?token=${verificationToken}`

    // Prepare email content
    const emailSubject = 'Session Start Approval Required'
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #14b8a6; margin-bottom: 20px;">Session Start Approval</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hello <strong>${client.full_name}</strong>,
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Your trainer <strong>${trainer.first_name} ${trainer.last_name}</strong> has initiated a session with you.
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Please click the button below to approve and start your session:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; background-color: #14b8a6; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
              Approve Session Start
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #14b8a6; font-size: 14px; word-break: break-all;">
            ${verificationUrl}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
              This link will expire in 30 minutes.<br>
              If you did not expect this request, please contact your trainer.
            </p>
          </div>
        </div>
      </div>
    `

    // Send email using configured email service (Gmail SMTP, Resend, or dev mode)
    const emailResult = await sendEmail({
      to: client.email,
      subject: emailSubject,
      html: emailBody,
      from: process.env.RESEND_FROM_EMAIL || 'WTF Fitness <noreply@wtffitness.com>',
    })

    // Log verification URL for development/testing
    if (emailResult.devMode) {
      console.log('Verification URL:', verificationUrl)
    }

    return NextResponse.json({
      success: true,
      message: emailResult.success
        ? 'Verification email sent successfully'
        : 'Verification created (email not sent - check console)',
      verificationUrl, // Return for testing purposes
      confirmationId: confirmation.id,
      emailSent: emailResult.success,
      emailError: emailResult.error,
      devMode: emailResult.devMode
    })

  } catch (error) {
    console.error('Error in initiate-session-verification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
