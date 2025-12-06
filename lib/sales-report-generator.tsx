import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import * as XLSX from 'xlsx'

export interface SalesReportData {
  // Dashboard columns (main)
  clientId: string
  clientName: string
  sessionType: string
  amountCollected: number
  remainingAmount: number
  daysLeft: number
  status: string
  paymentStatus: string
  // Additional fields for complete export
  email: string
  phoneNumber: string
  age: string
  gender: string
  trainerId: string
  totalAmount: number
  paymentMode: string
  daysElapsed: number
  totalDays: number
  createdAt: string
  updatedAt: string
}

export interface SalesReportSummary {
  totalSales: number
  monthlySales: number
  newUsers: number
  balancePayment: number
  collectionRate: number
  totalClients: number
  activeClients: number
  reportDate: string
  reportPeriod: string
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    backgroundColor: '#14b8a6',
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#e0f2f1',
  },
  summarySection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0fdfa',
    borderLeft: '4px solid #14b8a6',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#14b8a6',
    marginBottom: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryItem: {
    width: '48%',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2d3748',
    padding: 8,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e2e8f0',
    padding: 8,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1px solid #e2e8f0',
    padding: 8,
    backgroundColor: '#f7fafc',
  },
  col1: { width: '12%', fontSize: 8 },
  col2: { width: '18%', fontSize: 8 },
  col3: { width: '12%', fontSize: 8 },
  col4: { width: '13%', fontSize: 8 },
  col5: { width: '13%', fontSize: 8 },
  col6: { width: '10%', fontSize: 8 },
  col7: { width: '11%', fontSize: 8 },
  col8: { width: '11%', fontSize: 8 },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#718096',
    borderTop: '1px solid #e2e8f0',
    paddingTop: 10,
  },
})

// PDF Document Component
const SalesReportPDF = ({ data, summary }: { data: SalesReportData[]; summary: SalesReportSummary }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Sales Report</Text>
        <Text style={styles.subtitle}>Witness The Fitness - {summary.reportPeriod}</Text>
      </View>

      {/* Summary Section */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Sales</Text>
            <Text style={styles.summaryValue}>₹{summary.totalSales.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Monthly Sales</Text>
            <Text style={styles.summaryValue}>₹{summary.monthlySales.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>New Users</Text>
            <Text style={styles.summaryValue}>{summary.newUsers}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Balance Payment</Text>
            <Text style={styles.summaryValue}>₹{summary.balancePayment.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Collection Rate</Text>
            <Text style={styles.summaryValue}>{summary.collectionRate.toFixed(1)}%</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Clients</Text>
            <Text style={styles.summaryValue}>{summary.totalClients}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Active Clients</Text>
            <Text style={styles.summaryValue}>{summary.activeClients}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Report Date</Text>
            <Text style={styles.summaryValue}>{summary.reportDate}</Text>
          </View>
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        {/* Header - Matches Dashboard */}
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Client ID</Text>
          <Text style={styles.col2}>Client Name</Text>
          <Text style={styles.col3}>Session Type</Text>
          <Text style={styles.col4}>Amount Collected</Text>
          <Text style={styles.col5}>Remaining Amt</Text>
          <Text style={styles.col6}>Days Left</Text>
          <Text style={styles.col7}>Status</Text>
          <Text style={styles.col8}>Payment</Text>
        </View>

        {/* Rows */}
        {data.map((row, index) => (
          <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={styles.col1}>{row.clientId}</Text>
            <Text style={styles.col2}>{row.clientName}</Text>
            <Text style={styles.col3}>{row.sessionType}</Text>
            <Text style={styles.col4}>₹{row.amountCollected}</Text>
            <Text style={styles.col5}>₹{row.remainingAmount}</Text>
            <Text style={styles.col6}>{row.daysLeft} days</Text>
            <Text style={styles.col7}>{row.status}</Text>
            <Text style={styles.col8}>{row.paymentStatus}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Witness The Fitness - No 45, Omkar Orchid, Nanjundaiah Layout, Begur, Bengaluru, Karnataka 560114</Text>
        <Text>Generated on {new Date().toLocaleString()}</Text>
      </View>
    </Page>
  </Document>
)

/**
 * Generate PDF sales report
 */
export async function generateSalesReportPDF(
  data: SalesReportData[],
  summary: SalesReportSummary
): Promise<Buffer> {
  try {
    console.log('[Sales Report] Generating PDF...')
    const pdfBuffer = await renderToBuffer(
      <SalesReportPDF data={data} summary={summary} />
    )
    console.log(`[Sales Report] PDF generated successfully, size: ${pdfBuffer.length} bytes`)
    return pdfBuffer
  } catch (error) {
    console.error('[Sales Report] Error generating PDF:', error)
    throw error
  }
}

/**
 * Generate CSV sales report
 */
export function generateSalesReportCSV(
  data: SalesReportData[],
  summary: SalesReportSummary
): string {
  try {
    console.log('[Sales Report] Generating CSV...')
    
    // Summary section
    let csv = 'SALES REPORT - WITNESS THE FITNESS\n'
    csv += `Report Period: ${summary.reportPeriod}\n`
    csv += `Generated: ${new Date().toLocaleString()}\n\n`
    
    csv += 'SUMMARY\n'
    csv += `Total Sales,₹${summary.totalSales}\n`
    csv += `Monthly Sales,₹${summary.monthlySales}\n`
    csv += `New Users,${summary.newUsers}\n`
    csv += `Balance Payment,₹${summary.balancePayment}\n`
    csv += `Collection Rate,${summary.collectionRate.toFixed(1)}%\n`
    csv += `Total Clients,${summary.totalClients}\n`
    csv += `Active Clients,${summary.activeClients}\n\n`
    
    // Data table - Dashboard columns + additional fields
    csv += 'CLIENT DATA\n'
    csv += 'Client ID,Client Name,Session Type,Amount Collected,Remaining Amt,Days Left,Status,Payment,Email,Phone Number,Age,Gender,Trainer ID,Total Amount,Payment Mode,Days Elapsed,Total Days,Created Date,Updated Date\n'
    
    data.forEach(row => {
      csv += `${row.clientId},"${row.clientName}",${row.sessionType},${row.amountCollected},${row.remainingAmount},${row.daysLeft},${row.status},${row.paymentStatus},"${row.email}","${row.phoneNumber}",${row.age},${row.gender},${row.trainerId},${row.totalAmount},${row.paymentMode},${row.daysElapsed},${row.totalDays},"${row.createdAt}","${row.updatedAt}"\n`
    })
    
    console.log('[Sales Report] CSV generated successfully')
    return csv
  } catch (error) {
    console.error('[Sales Report] Error generating CSV:', error)
    throw error
  }
}

/**
 * Generate Excel sales report
 */
export function generateSalesReportExcel(
  data: SalesReportData[],
  summary: SalesReportSummary
): ArrayBuffer {
  try {
    console.log('[Sales Report] Generating Excel...')
    
    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Summary sheet
    const summaryData = [
      ['SALES REPORT - WITNESS THE FITNESS'],
      [`Report Period: ${summary.reportPeriod}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['SUMMARY'],
      ['Metric', 'Value'],
      ['Total Sales', `₹${summary.totalSales}`],
      ['Monthly Sales', `₹${summary.monthlySales}`],
      ['New Users', summary.newUsers],
      ['Balance Payment', `₹${summary.balancePayment}`],
      ['Collection Rate', `${summary.collectionRate.toFixed(1)}%`],
      ['Total Clients', summary.totalClients],
      ['Active Clients', summary.activeClients],
    ]
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')
    
    // Data sheet - Dashboard columns first, then additional fields
    const dataRows = data.map(row => ({
      'Client ID': row.clientId,
      'Client Name': row.clientName,
      'Session Type': row.sessionType,
      'Amount Collected': row.amountCollected,
      'Remaining Amt': row.remainingAmount,
      'Days Left': row.daysLeft,
      'Status': row.status,
      'Payment': row.paymentStatus,
      'Email': row.email,
      'Phone Number': row.phoneNumber,
      'Age': row.age,
      'Gender': row.gender,
      'Trainer ID': row.trainerId,
      'Total Amount': row.totalAmount,
      'Payment Mode': row.paymentMode,
      'Days Elapsed': row.daysElapsed,
      'Total Days': row.totalDays,
      'Created Date': row.createdAt,
      'Updated Date': row.updatedAt,
    }))
    const dataSheet = XLSX.utils.json_to_sheet(dataRows)
    XLSX.utils.book_append_sheet(wb, dataSheet, 'Client Data')
    
    // Generate buffer
    const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    
    console.log('[Sales Report] Excel generated successfully')
    return excelBuffer
  } catch (error) {
    console.error('[Sales Report] Error generating Excel:', error)
    throw error
  }
}
