import { NextRequest, NextResponse } from 'next/server'
import { generateInvoiceReactPDF } from '@/lib/pdf-generator-react'
import { InvoiceEmailData } from '@/types'

/**
 * GET /api/test-pdf
 * Test endpoint to verify PDF generation is working
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Test PDF] Starting PDF generation test...')
    
    // Create test invoice data
    const testInvoiceData: InvoiceEmailData = {
      clientName: 'Test Client',
      clientEmail: 'test@example.com',
      invoiceNumber: 'INV-TEST-0001',
      amountPaid: 1500,
      amountRemaining: 1500,
      totalAmount: 3000,
      paymentDate: new Date().toISOString(),
      subscriptionMonths: 3,
    }
    
    // Try to generate PDF with React-PDF
    const pdfBuffer = await generateInvoiceReactPDF(testInvoiceData)
    
    console.log(`[Test PDF] PDF generated successfully, size: ${pdfBuffer.length} bytes`)
    
    // Return the PDF as a downloadable file
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test-invoice.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
    
  } catch (error) {
    console.error('[Test PDF] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
