import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateInvoiceNumber } from '@/lib/invoice-utils'
import { generateInvoicePDF } from '@/lib/pdf-generator'
import { sendEmail } from '@/lib/email'
import { InvoiceFormData, InvoiceEmailData } from '@/types'

// Create a Supabase client with service role for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/invoices
 * Retrieves invoice list with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
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
    const authHeader = request.headers.get('authorization')
    let createdBy: string | undefined
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      createdBy = user?.id
    }

    // Generate unique invoice number and create invoice record with retry logic
    // This handles race conditions where multiple invoices are created simultaneously
    const maxRetries = 5
    let invoice: any = null
    let invoiceNumber: string = ''
    let pdfBuffer: Buffer | null = null
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Generate unique invoice number
        invoiceNumber = await generateInvoiceNumber()
        
        // Calculate total amount
        const totalAmount = body.amount_paid + body.amount_remaining
        
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
        
        // Generate PDF
        try {
          pdfBuffer = await generateInvoicePDF(invoiceEmailData)
        } catch (error) {
          console.error('Error generating PDF:', error)
          return NextResponse.json(
            { success: false, error: 'Failed to generate invoice PDF' },
            { status: 500 }
          )
        }
        
        // Create invoice record in database (initially with 'draft' status)
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
          // If it's a duplicate key error (race condition), retry with a new invoice number
          if (insertError.code === '23505') {
            console.warn(`Duplicate invoice number ${invoiceNumber} detected, retrying... (attempt ${attempt + 1}/${maxRetries})`)
            // Wait a bit before retrying to reduce collision probability
            await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)))
            continue
          }
          
          // For other errors, fail immediately
          console.error('Error creating invoice record:', insertError)
          return NextResponse.json(
            { success: false, error: 'Failed to create invoice record' },
            { status: 500 }
          )
        }
        
        // Success! Break out of retry loop
        invoice = createdInvoice
        break
        
      } catch (error) {
        console.error(`Error in invoice creation attempt ${attempt + 1}:`, error)
        
        // If this is the last attempt, fail
        if (attempt === maxRetries - 1) {
          return NextResponse.json(
            { success: false, error: 'Failed to create invoice after multiple attempts' },
            { status: 500 }
          )
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)))
      }
    }
    
    // If we exhausted all retries without success
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Failed to create invoice record after multiple attempts' },
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
    
    // Calculate total amount for email
    const totalAmount = body.amount_paid + body.amount_remaining
    
    // Send email with PDF attachment
    const emailResult = await sendEmail({
      to: client.email,
      subject: `Invoice ${invoiceNumber} - ${formattedDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #14b8a6;">Invoice from Witness The Fitness</h2>
          <p>Dear ${client.full_name},</p>
          <p>Thank you for your payment! Please find your invoice attached to this email.</p>
          <div style="background-color: #f0fdfa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
            <p style="margin: 5px 0;"><strong>Payment Date:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₹${body.amount_paid.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Amount Remaining:</strong> ₹${body.amount_remaining.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${totalAmount.toFixed(2)}</p>
          </div>
          <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>Witness The Fitness Team</strong></p>
        </div>
      `,
      attachments: [
        {
          filename: `Invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer!,
          contentType: 'application/pdf',
        },
      ],
    })
    
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
