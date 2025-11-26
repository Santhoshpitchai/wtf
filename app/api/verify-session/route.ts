import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const supabase = getSupabaseClient()
    try {
        const { token } = await request.json()

        // Task 4.1: Validate token format and existence
        if (!token) {
            return NextResponse.json(
                { 
                    success: false,
                    error: 'Verification token is required' 
                },
                { status: 400 }
            )
        }

        // Validate token format (should be 64-character hex string)
        const tokenRegex = /^[a-f0-9]{64}$/i
        if (!tokenRegex.test(token)) {
            return NextResponse.json(
                { 
                    success: false,
                    error: 'Invalid verification token format' 
                },
                { status: 400 }
            )
        }

        // Find the confirmation record
        const { data: confirmation, error: confirmError } = await supabase
            .from('session_confirmations')
            .select('*')
            .eq('verification_token', token)
            .single()

        if (confirmError || !confirmation) {
            return NextResponse.json(
                { 
                    success: false,
                    error: 'Invalid verification token' 
                },
                { status: 404 }
            )
        }

        // Task 4.1: Check if token already used
        if (confirmation.status === 'approved') {
            // Task 4.4: Return alreadyApproved flag for used tokens
            return NextResponse.json(
                { 
                    success: false,
                    error: 'This session has already been approved',
                    alreadyApproved: true 
                },
                { status: 400 }
            )
        }

        // Task 4.1: Check token expiration status
        const now = new Date()
        const expiresAt = new Date(confirmation.expires_at)

        if (now > expiresAt || confirmation.status === 'expired') {
            // Task 4.1: Update status to expired when appropriate
            if (confirmation.status !== 'expired') {
                await supabase
                    .from('session_confirmations')
                    .update({ 
                        status: 'expired',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', confirmation.id)
            }

            // Task 4.4: Return expired flag for expired tokens
            return NextResponse.json(
                { 
                    success: false,
                    error: 'This verification link has expired. Please ask your trainer to send a new verification request.',
                    expired: true 
                },
                { status: 400 }
            )
        }

        // Task 4.3: Update confirmation status to approved
        const { error: updateError } = await supabase
            .from('session_confirmations')
            .update({
                status: 'approved',
                verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', confirmation.id)

        if (updateError) {
            console.error('Error updating confirmation:', updateError)
            return NextResponse.json(
                { 
                    success: false,
                    error: 'Failed to approve session. Please try again.' 
                },
                { status: 500 }
            )
        }

        // Task 4.3: Fetch client and trainer details for response
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('full_name, client_id')
            .eq('id', confirmation.client_id)
            .single()

        const { data: trainer, error: trainerError } = await supabase
            .from('trainers')
            .select('first_name, last_name')
            .eq('id', confirmation.trainer_id)
            .single()

        if (clientError || trainerError) {
            console.error('Error fetching details:', { clientError, trainerError })
            // Still return success since the approval was recorded
            return NextResponse.json({
                success: true,
                message: 'Session approved successfully',
                confirmationId: confirmation.id
            })
        }

        // Task 4.3: Return client and trainer details
        return NextResponse.json({
            success: true,
            message: 'Session approved successfully',
            client: client,
            trainer: trainer,
            confirmationId: confirmation.id
        })

    } catch (error) {
        console.error('Error in verify-session:', error)
        return NextResponse.json(
            { 
                success: false,
                error: 'An unexpected error occurred. Please try again.' 
            },
            { status: 500 }
        )
    }
}
