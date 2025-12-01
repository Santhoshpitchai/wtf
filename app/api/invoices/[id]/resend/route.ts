import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateInvoicePDF } from '@/lib/pdf-generator'
import { sendEmail } from '@/lib/email'
import { Invoice, InvoiceEmailData } from '@/types'

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
 * POST /api/invoices/[id]/resend
 * Resends an existing invoice via email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient()
    const invoiceId = params.id

    // Validate invoice ID
    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Fetch existing invoice from database with client details
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients (
          id,
          full_name,
          email
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (fetchError || !invoice) {
      console.error('Error fetching invoice:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Validate client has email
    if (!invoice.client?.email || invoice.client.email.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Client does not have a registered email address' },
        { status: 400 }
      )
    }

    // Calculate total amount
    const totalAmount = invoice.amount_paid + invoice.amount_remaining

    // Prepare invoice email data
    const invoiceEmailData: InvoiceEmailData = {
      clientName: invoice.client.full_name,
      clientEmail: invoice.client.email,
      invoiceNumber: invoice.invoice_number,
      amountPaid: invoice.amount_paid,
      amountRemaining: invoice.amount_remaining,
      totalAmount,
      paymentDate: invoice.payment_date,
      subscriptionMonths: invoice.subscription_months,
    }

    // Regenerate PDF
    let pdfBuffer: Buffer
    try {
      pdfBuffer = await generateInvoicePDF(invoiceEmailData)
    } catch (error) {
      console.error('Error generating PDF:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to generate invoice PDF' },
        { status: 500 }
      )
    }

    // Format payment date for email subject
    const paymentDate = new Date(invoice.payment_date)
    const formattedDate = paymentDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    // Resend email with PDF attachment
    const emailResult = await sendEmail({
      to: invoice.client.email,
      subject: `Invoice ${invoice.invoice_number} - ${formattedDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #14b8a6;">Invoice from Witness The Fitness</h2>
          <p>Dear ${invoice.client.full_name},</p>
          <p>Thank you for your payment! Please find your invoice attached to this email.</p>
          <div style="background-color: #f0fdfa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
            <p style="margin: 5px 0;"><strong>Payment Date:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₹${invoice.amount_paid.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Amount Remaining:</strong> ₹${invoice.amount_remaining.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${totalAmount.toFixed(2)}</p>
          </div>
          <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>Witness The Fitness Team</strong></p>
        </div>
      `,
      attachments: [
        {
          filename: `Invoice-${invoice.invoice_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    })

    // Update invoice status and email_sent_at timestamp based on email result
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
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: finalStatus,
        email_sent_at: emailSentAt,
      })
      .eq('id', invoiceId)

    if (updateError) {
      console.error('Error updating invoice status:', updateError)
      // Don't fail the request if update fails
    }

    // Return response
    if (!emailResult.success && !emailResult.devMode) {
      return NextResponse.json(
        {
          success: false,
          error: `Email failed to send: ${emailResult.error}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: emailResult.devMode
        ? 'Invoice resend completed (email not sent - dev mode)'
        : 'Invoice resent successfully',
    })

  } catch (error) {
    console.error('Error in POST /api/invoices/[id]/resend:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
