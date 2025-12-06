import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, renderToBuffer } from '@react-pdf/renderer'
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

// Define modern, professional styles
const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#2d3748',
    backgroundColor: '#ffffff',
  },
  // Header section with gradient-like effect
  header: {
    backgroundColor: '#14b8a6',
    padding: 30,
    paddingBottom: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoSection: {
    flex: 1,
  },
  logo: {
    width: 120,
    height: 'auto',
    marginBottom: 12,
  },
  companyName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  companyTagline: {
    fontSize: 10,
    color: '#e0f2f1',
    fontStyle: 'italic',
  },
  invoiceSection: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 11,
    color: '#e0f2f1',
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 11,
    color: '#e0f2f1',
  },
  // Company address section
  addressSection: {
    backgroundColor: '#f0fdfa',
    padding: 20,
    paddingTop: 25,
    paddingBottom: 25,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addressBlock: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#14b8a6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 10,
    color: '#4a5568',
    lineHeight: 1.5,
    marginBottom: 2,
  },
  addressTextBold: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 3,
  },
  // Content area
  content: {
    padding: 30,
  },
  // Bill To section
  billToSection: {
    marginBottom: 25,
    padding: 18,
    backgroundColor: '#f7fafc',
    borderLeft: '4px solid #14b8a6',
  },
  billToTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#14b8a6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  clientName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 5,
  },
  clientEmail: {
    fontSize: 10,
    color: '#718096',
  },
  // Table section
  table: {
    marginTop: 25,
    marginBottom: 25,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2d3748',
    padding: 12,
    paddingTop: 14,
    paddingBottom: 14,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e2e8f0',
    padding: 14,
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1px solid #e2e8f0',
    padding: 14,
    backgroundColor: '#f7fafc',
  },
  tableText: {
    fontSize: 10,
    color: '#4a5568',
  },
  tableTextBold: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  // Summary section
  summarySection: {
    marginTop: 20,
    marginLeft: 'auto',
    width: '45%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottom: '1px solid #e2e8f0',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#4a5568',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#14b8a6',
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Payment info section
  paymentInfoSection: {
    marginTop: 30,
    padding: 18,
    backgroundColor: '#fffbeb',
    borderLeft: '4px solid #f59e0b',
  },
  paymentInfoTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#f59e0b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  paymentInfoText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    paddingTop: 20,
    borderTop: '2px solid #e2e8f0',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thankYou: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#14b8a6',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 8,
    color: '#718096',
    lineHeight: 1.4,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  // Column widths
  col1: {
    width: '50%',
  },
  col2: {
    width: '20%',
    textAlign: 'center',
  },
  col3: {
    width: '30%',
    textAlign: 'right',
  },
})

/**
 * Modern, Professional Invoice PDF Document Component
 */
const InvoicePDF = ({ data, logoBase64 }: { data: InvoiceEmailData; logoBase64?: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header Section with Company Branding */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Left: Logo and Company Name */}
          <View style={styles.logoSection}>
            {logoBase64 && <Image src={logoBase64} style={styles.logo} />}
            <Text style={styles.companyName}>WITNESS THE FITNESS</Text>
            <Text style={styles.companyTagline}>Your Fitness Partner</Text>
          </View>
          
          {/* Right: Invoice Title and Number */}
          <View style={styles.invoiceSection}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{data.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>Date: {formatDate(data.paymentDate)}</Text>
          </View>
        </View>
      </View>

      {/* Company and Client Address Section */}
      <View style={styles.addressSection}>
        <View style={styles.addressRow}>
          {/* Company Address */}
          <View style={styles.addressBlock}>
            <Text style={styles.addressTitle}>From</Text>
            <Text style={styles.addressTextBold}>Witness The Fitness</Text>
            <Text style={styles.addressText}>No 45, Omkar Orchid</Text>
            <Text style={styles.addressText}>Nanjundaiah Layout, Begur</Text>
            <Text style={styles.addressText}>Bengaluru, Karnataka 560114</Text>
            <Text style={styles.addressText}>India</Text>
          </View>
          
          {/* Client Address */}
          <View style={styles.addressBlock}>
            <Text style={styles.addressTitle}>Bill To</Text>
            <Text style={styles.addressTextBold}>{data.clientName}</Text>
            <Text style={styles.addressText}>{data.clientEmail}</Text>
          </View>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {/* Invoice Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>Duration</Text>
            <Text style={[styles.tableHeaderText, styles.col3]}>Amount</Text>
          </View>

          {/* Table Row: Training Package */}
          <View style={styles.tableRow}>
            <View style={styles.col1}>
              <Text style={styles.tableTextBold}>Personal Training Package</Text>
              <Text style={[styles.tableText, { fontSize: 9, marginTop: 3 }]}>
                Professional fitness training sessions
              </Text>
            </View>
            <Text style={[styles.tableText, styles.col2]}>
              {data.subscriptionMonths} {data.subscriptionMonths === 1 ? 'Month' : 'Months'}
            </Text>
            <Text style={[styles.tableTextBold, styles.col3]}>
              {formatCurrency(data.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.totalAmount)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount Paid</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
              {formatCurrency(data.amountPaid)}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount Remaining</Text>
            <Text style={[styles.summaryValue, { color: data.amountRemaining > 0 ? '#f59e0b' : '#10b981' }]}>
              {formatCurrency(data.amountRemaining)}
            </Text>
          </View>
          
          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.totalAmount)}</Text>
          </View>
        </View>

        {/* Payment Status Info */}
        {data.amountRemaining > 0 && (
          <View style={styles.paymentInfoSection}>
            <Text style={styles.paymentInfoTitle}>Payment Status</Text>
            <Text style={styles.paymentInfoText}>
              A balance of {formatCurrency(data.amountRemaining)} is pending. Please complete the payment at your earliest convenience.
            </Text>
          </View>
        )}

        {data.amountRemaining === 0 && (
          <View style={[styles.paymentInfoSection, { backgroundColor: '#f0fdf4', borderLeft: '4px solid #10b981' }]}>
            <Text style={[styles.paymentInfoTitle, { color: '#10b981' }]}>Payment Complete</Text>
            <Text style={[styles.paymentInfoText, { color: '#14532d' }]}>
              Thank you! Your payment has been received in full.
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View>
            <Text style={styles.thankYou}>Thank You For Your Business!</Text>
            <Text style={styles.footerText}>
              For any queries, please contact us at witnessthefitnessblr@gmail.com
            </Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={[styles.footerText, { fontWeight: 'bold', color: '#14b8a6' }]}>
              Witness The Fitness
            </Text>
            <Text style={styles.footerText}>Bengaluru, Karnataka</Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
)

/**
 * Loads the logo image and converts it to base64 data URI
 * @returns Base64 data URI of the logo or undefined if not found
 */
async function loadLogoAsBase64(): Promise<string | undefined> {
  try {
    // Try to load the transparent logo first
    let logoPath = path.join(process.cwd(), 'public', 'wtf-logo-transparent.png')
    
    if (!fs.existsSync(logoPath)) {
      logoPath = path.join(process.cwd(), 'public', 'wtf-logo.png')
    }
    
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath)
      const base64Logo = logoBuffer.toString('base64')
      return `data:image/png;base64,${base64Logo}`
    }
    
    console.warn('[React-PDF Generator] Logo not found, generating PDF without logo')
    return undefined
  } catch (error) {
    console.error('[React-PDF Generator] Error loading logo:', error)
    return undefined
  }
}

/**
 * Generates a PDF invoice using React-PDF (reliable and serverless-friendly)
 * @param invoiceData - The invoice data to generate PDF from
 * @returns Promise<Buffer> - PDF file as a buffer
 */
export async function generateInvoiceReactPDF(
  invoiceData: InvoiceEmailData
): Promise<Buffer> {
  try {
    console.log('[React-PDF Generator] Starting PDF generation...')
    
    // Load logo as base64
    const logoBase64 = await loadLogoAsBase64()
    
    // Create the PDF document
    const pdfBuffer = await renderToBuffer(
      <InvoicePDF data={invoiceData} logoBase64={logoBase64} />
    )
    
    console.log(`[React-PDF Generator] PDF generated successfully, size: ${pdfBuffer.length} bytes`)
    
    return pdfBuffer
  } catch (error) {
    console.error('[React-PDF Generator] Error generating PDF:', error)
    throw error
  }
}
