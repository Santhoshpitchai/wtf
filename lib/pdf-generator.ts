import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { InvoiceEmailData } from '@/types'
import path from 'path'
import fs from 'fs'

/**
 * Formats a number as currency with ₹ symbol and 2 decimal places
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "₹1,234.56")
 */
function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

/**
 * Formats a date string as DD/MM/YYYY
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "25/12/2024")
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Generates the HTML template for the invoice PDF
 * @param data - Invoice data to populate the template
 * @param logoBase64 - Base64 encoded logo image
 * @returns HTML string for the invoice
 */
function generateInvoiceHTML(data: InvoiceEmailData, logoBase64: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #333;
      line-height: 1.6;
    }
    
    .letterhead {
      text-align: center;
      border-bottom: 3px solid #14b8a6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .logo {
      max-width: 200px;
      height: auto;
      margin-bottom: 10px;
    }
    
    .company-name {
      font-size: 28px;
      font-weight: bold;
      color: #14b8a6;
      letter-spacing: 1px;
    }
    
    .invoice-header {
      margin: 30px 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .invoice-number {
      font-size: 24px;
      font-weight: bold;
      color: #14b8a6;
    }
    
    .invoice-date {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
    
    .details-section {
      margin: 30px 0;
      padding: 20px;
      background-color: #f9fafb;
      border-radius: 8px;
    }
    
    .details-section h3 {
      font-size: 16px;
      color: #14b8a6;
      margin-bottom: 10px;
      font-weight: 600;
    }
    
    .client-info {
      font-size: 14px;
    }
    
    .client-info p {
      margin: 5px 0;
    }
    
    .client-name {
      font-weight: bold;
      font-size: 16px;
      color: #333;
    }
    
    .payment-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .payment-table th {
      background-color: #14b8a6;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
    }
    
    .payment-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    
    .payment-table tr:last-child td {
      border-bottom: none;
    }
    
    .payment-table tbody tr:hover {
      background-color: #f9fafb;
    }
    
    .total-row {
      font-weight: bold;
      font-size: 16px;
      background-color: #f0fdfa !important;
    }
    
    .total-row td {
      color: #14b8a6;
      padding: 15px 12px;
    }
    
    .amount-cell {
      text-align: right;
      font-weight: 500;
    }
    
    .footer {
      margin-top: 50px;
      text-align: center;
      color: #666;
      font-size: 13px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer p {
      margin: 5px 0;
    }
    
    .thank-you {
      font-weight: 600;
      color: #14b8a6;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <!-- Letterhead -->
  <div class="letterhead">
    <img src="${logoBase64}" alt="Witness The Fitness" class="logo" />
    <div class="company-name">WITNESS THE FITNESS</div>
  </div>
  
  <!-- Invoice Header -->
  <div class="invoice-header">
    <div>
      <div class="invoice-number">Invoice #${data.invoiceNumber}</div>
      <div class="invoice-date">Date: ${formatDate(data.paymentDate)}</div>
    </div>
  </div>
  
  <!-- Client Details -->
  <div class="details-section">
    <h3>Bill To:</h3>
    <div class="client-info">
      <p class="client-name">${data.clientName}</p>
      <p>${data.clientEmail}</p>
    </div>
  </div>
  
  <!-- Payment Details -->
  <table class="payment-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Duration</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Training Session Package</td>
        <td>${data.subscriptionMonths} month${data.subscriptionMonths !== 1 ? 's' : ''}</td>
        <td class="amount-cell">${formatCurrency(data.totalAmount)}</td>
      </tr>
      <tr>
        <td colspan="2">Amount Paid</td>
        <td class="amount-cell">${formatCurrency(data.amountPaid)}</td>
      </tr>
      <tr>
        <td colspan="2">Amount Remaining</td>
        <td class="amount-cell">${formatCurrency(data.amountRemaining)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="2"><strong>Total Amount</strong></td>
        <td class="amount-cell"><strong>${formatCurrency(data.totalAmount)}</strong></td>
      </tr>
    </tbody>
  </table>
  
  <!-- Footer -->
  <div class="footer">
    <p class="thank-you">Thank you for your business!</p>
    <p>Witness The Fitness - Your Fitness Partner</p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Loads the logo image and converts it to base64 data URI
 * @returns Base64 data URI of the logo
 */
async function loadLogoAsBase64(): Promise<string> {
  try {
    // Try to load the transparent logo first
    const logoPath = path.join(process.cwd(), 'public', 'wtf-logo-transparent.png')
    
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath)
      const base64Logo = logoBuffer.toString('base64')
      return `data:image/png;base64,${base64Logo}`
    }
    
    // Fallback to regular logo
    const fallbackLogoPath = path.join(process.cwd(), 'public', 'wtf-logo.png')
    if (fs.existsSync(fallbackLogoPath)) {
      const logoBuffer = fs.readFileSync(fallbackLogoPath)
      const base64Logo = logoBuffer.toString('base64')
      return `data:image/png;base64,${base64Logo}`
    }
    
    // If no logo found, return empty string (PDF will be generated without logo)
    console.warn('Logo file not found, generating PDF without logo')
    return ''
  } catch (error) {
    console.error('Error loading logo:', error)
    return ''
  }
}

/**
 * Generates a PDF invoice from invoice data with retry logic
 * @param invoiceData - The invoice data to generate PDF from
 * @param retryCount - Current retry attempt (internal use)
 * @returns Promise<Buffer> - PDF file as a buffer
 * @throws Error if PDF generation fails after all retries
 */
export async function generateInvoicePDF(
  invoiceData: InvoiceEmailData,
  retryCount: number = 0
): Promise<Buffer> {
  const maxRetries = 2 // Reduced retries for faster failure
  let browser = null
  
  try {
    console.log(`[PDF Generator] Starting PDF generation (attempt ${retryCount + 1}/${maxRetries + 1})`)
    
    // Load logo as base64
    const logoBase64 = await loadLogoAsBase64()
    
    // Generate HTML content
    const htmlContent = generateInvoiceHTML(invoiceData, logoBase64)
    
    // Get Chromium executable path first
    const executablePath = await chromium.executablePath()
    console.log(`[PDF Generator] Chromium executable path: ${executablePath}`)
    
    // Launch Puppeteer browser with optimized settings for serverless
    console.log('[PDF Generator] Launching browser...')
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    })
    
    console.log('[PDF Generator] Browser launched successfully')
    
    const page = await browser.newPage()
    console.log('[PDF Generator] New page created')
    
    // Set content with reduced wait time
    await page.setContent(htmlContent, {
      waitUntil: 'domcontentloaded', // Changed from 'networkidle0' for faster loading
    })
    
    console.log('[PDF Generator] Content set, generating PDF...')
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    })
    
    console.log(`[PDF Generator] PDF generated successfully, size: ${pdfBuffer.length} bytes`)
    
    return Buffer.from(pdfBuffer)
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[PDF Generator] Error (attempt ${retryCount + 1}/${maxRetries + 1}):`, errorMessage)
    console.error('[PDF Generator] Full error:', error)
    
    // Close browser if it was opened
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.error('[PDF Generator] Error closing browser:', closeError)
      }
      browser = null
    }
    
    // Retry if we haven't exceeded max retries
    if (retryCount < maxRetries) {
      console.log(`[PDF Generator] Retrying... (attempt ${retryCount + 2}/${maxRetries + 1})`)
      // Wait a bit before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)))
      return generateInvoicePDF(invoiceData, retryCount + 1)
    }
    
    // If all retries failed, throw detailed error
    let detailedError = `Failed to generate invoice PDF after ${maxRetries + 1} attempts. `
    
    if (errorMessage.includes('timeout')) {
      detailedError += 'Timeout error - Puppeteer took too long to respond. This may be due to system resources or Chromium issues.'
    } else if (errorMessage.includes('Browser') || errorMessage.includes('Could not find')) {
      detailedError += 'Browser launch error - Failed to start Chromium. This may be due to missing dependencies or system configuration.'
    } else if (errorMessage.includes('Protocol error')) {
      detailedError += 'Protocol error - Communication with Chromium failed. This may be due to system instability.'
    } else {
      detailedError += `Error: ${errorMessage}`
    }
    
    throw new Error(detailedError)
  } finally {
    // Always close the browser
    if (browser) {
      try {
        await browser.close()
        console.log('[PDF Generator] Browser closed successfully')
      } catch (closeError) {
        console.error('[PDF Generator] Error closing browser in finally block:', closeError)
      }
    }
  }
}
