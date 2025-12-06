import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateInvoiceNumber } from '@/lib/invoice-utils'
import { generateInvoiceReactPDF } from '@/lib/pdf-generator-react'
import { sendEmail } from '@/lib/email'
import { InvoiceFormData, InvoiceEmailData } from '@/types'

// Helper function to create Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * GET /api/invoices
 * Retrieves invoice list with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    
    // Build query
    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients (
          id,
          full_name,
          email
        )
      `, { count: 'exact' })
    
    // Apply filters
    if (clientId) {
      query = query.eq('client_id', clientId)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    // Apply sorting (descending by created_at)
    query = query.order('created_at', { ascending: false })
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1)
    
    // Execute query
    const { data: invoices, error, count } = await query
    
    if (error) {
      console.error('Error fetching invoices:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch invoices' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      invoices: invoices || [],
      total: count || 0,
    })
    
  } catch (error) {
    console.error('Error in GET /api/invoices:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/invoices
 * Creates a new invoice and sends it via email
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    
    // Parse request body
    const body: InvoiceFormData = await request.json()
    
    // Validate required fields
    const validationErrors: string[] = []
    
    if (!body.client_id) {
      validationErrors.push('Client ID is required')
    }
    
    if (body.amount_paid === undefined || body.amount_paid === null) {
      validationErrors.push('Amount paid is required')
    } else if (body.amount_paid <= 0) {
      validationErrors.push('Amount paid must be greater than zero')
    }
    
    if (body.amount_remaining === undefined || body.amount_remaining === null) {
      validationErrors.push('Amount remaining is required')
    } else if (body.amount_remaining < 0) {
      validationErrors.push('Amount remaining cannot be negative')
    }
    
    if (!body.payment_date) {
      validationErrors.push('Payment date is required')
    }
    
    if (!body.subscription_months || body.subscription_months <= 0) {
      validationErrors.push('Subscription duration must be a positive number')
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      )
    }
    
    // Fetch client details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, full_name, email')
      .eq('id', body.client_id)
      .single()
    
    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: 'Selected client does not exist' },
        { status: 404 }
      )
    }
    
    // Validate client has email
    if (!client.email || client.email.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Selected client does not have a registered email address' },
        { status: 400 }
      )
    }
    
    // Get current user from session (for created_by field)
    // Note: We use service role key, so auth is optional for this operation
    let createdBy: string | undefined
    
    try {
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (!authError && user) {
          createdBy = user.id
        }
      }
    } catch (authError) {
      // Auth is optional, continue without it
      console.warn('Could not get user from auth header:', authError)
    }

    // Generate unique invoice number (now uses random generation for guaranteed uniqueness)
    let invoice: any = null
    let invoiceNumber: string = ''
    let pdfBuffer: Buffer | null = null
    
    // Calculate total amount
    const totalAmount = body.amount_paid + body.amount_remaining
    
    try {
      // Generate unique invoice number (guaranteed unique by random generation)
      invoiceNumber = await generateInvoiceNumber()
      console.log(`[Invoice Creation] Generated invoice number: ${invoiceNumber}`)
      
      // Create invoice record in database (initially with 'draft' status)
      // This ensures we have the invoice even if PDF generation fails
      console.log(`[Invoice Creation] Creating invoice record in database...`)
      const { data: createdInvoice, error: insertError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          client_id: body.client_id,
          amount_paid: body.amount_paid,
          amount_remaining: body.amount_remaining,
          payment_date: body.payment_date,
          subscription_months: body.subscription_months,
          status: 'draft',
          created_by: createdBy,
        })
        .select()
        .single()
      
      // Check if insert was successful
      if (insertError) {
        console.error(`[Invoice Creation] Database insert error:`, insertError)
        
        // Return detailed error
        return NextResponse.json(
          { 
            success: false, 
            error: `Failed to create invoice: ${insertError.message}` 
          },
          { status: 500 }
        )
      }
      
      // Success! Invoice created in database
      console.log(`[Invoice Creation] Invoice created successfully: ${invoiceNumber}`)
      invoice = createdInvoice
        
        // Now try to generate PDF (non-blocking - if it fails, we still have the invoice)
        // Prepare invoice email data
        const invoiceEmailData: InvoiceEmailData = {
          clientName: client.full_name,
          clientEmail: client.email,
          invoiceNumber,
          amountPaid: body.amount_paid,
          amountRemaining: body.amount_remaining,
          totalAmount,
          paymentDate: body.payment_date,
          subscriptionMonths: body.subscription_months,
        }
        
        try {
          console.log(`[Invoice Creation] Starting PDF generation with React-PDF...`)
          pdfBuffer = await generateInvoiceReactPDF(invoiceEmailData)
          console.log(`[Invoice Creation] PDF generated successfully, size: ${pdfBuffer.length} bytes`)
        } catch (pdfError) {
          console.error(`[Invoice Creation] PDF generation failed:`, pdfError)
          console.warn('[Invoice Creation] Continuing without PDF attachment')
          pdfBuffer = null // Will send email without PDF
        }

      
    } catch (error) {
      console.error('[Invoice Creation] Unexpected error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to create invoice' 
        },
        { status: 500 }
      )
    }
    
    // Format payment date for email subject
    const paymentDate = new Date(body.payment_date)
    const formattedDate = paymentDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    
    // Send email with PDF attachment (if available)
    const emailOptions: any = {
      to: client.email,
      subject: `Invoice ${invoiceNumber} - ${formattedDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #14b8a6;">Invoice from Witness The Fitness</h2>
          <p>Dear ${client.full_name},</p>
          <p>Thank you for your payment! ${pdfBuffer ? 'Please find your invoice attached to this email.' : 'Your invoice details are below.'}</p>
          <div style="background-color: #f0fdfa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
            <p style="margin: 5px 0;"><strong>Payment Date:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₹${body.amount_paid.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Amount Remaining:</strong> ₹${body.amount_remaining.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${totalAmount.toFixed(2)}</p>
          </div>
          ${!pdfBuffer ? '<p style="color: #f59e0b;"><em>Note: PDF attachment could not be generated. Please contact us if you need a PDF copy.</em></p>' : ''}
          <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>Witness The Fitness Team</strong></p>
        </div>
      `,
    }
    
    // Add PDF attachment only if it was successfully generated
    if (pdfBuffer) {
      emailOptions.attachments = [
        {
          filename: `Invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ]
    }
    
    const emailResult = await sendEmail(emailOptions)
    
    // Update invoice status based on email result
    let finalStatus: 'sent' | 'failed' = 'failed'
    let emailSentAt: string | undefined
    
    if (emailResult.success) {
      finalStatus = 'sent'
      emailSentAt = new Date().toISOString()
    } else if (emailResult.devMode) {
      // In dev mode, consider it sent for testing purposes
      finalStatus = 'sent'
      emailSentAt = new Date().toISOString()
    }
    
    // Update invoice with final status
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: finalStatus,
        email_sent_at: emailSentAt,
      })
      .eq('id', invoice.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating invoice status:', updateError)
      // Don't fail the request, invoice was created
    }
    
    // Return response
    if (!emailResult.success && !emailResult.devMode) {
      return NextResponse.json(
        {
          success: false,
          error: `Invoice created but email failed to send: ${emailResult.error}`,
          invoice: updatedInvoice || invoice,
        },
        { status: 207 } // Multi-status: partial success
      )
    }
    
    return NextResponse.json({
      success: true,
      invoice: updatedInvoice || invoice,
      message: emailResult.devMode 
        ? 'Invoice created successfully (email not sent - dev mode)' 
        : 'Invoice created and sent successfully',
    })
    
  } catch (error) {
    console.error('Error in POST /api/invoices:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
