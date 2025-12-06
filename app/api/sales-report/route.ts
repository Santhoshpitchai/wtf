import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  generateSalesReportPDF,
  generateSalesReportCSV,
  generateSalesReportExcel,
  type SalesReportData,
  type SalesReportSummary,
} from '@/lib/sales-report-generator'

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
 * GET /api/sales-report
 * Generates sales report in specified format (PDF, CSV, or Excel)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf' // pdf, csv, or excel
    const period = searchParams.get('period') || 'all' // all or current
    const status = searchParams.get('status') || 'all' // all, active, or inactive
    
    // Fetch clients data
    let query = supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status)
    }
    
    const { data: clients, error } = await query
    
    if (error) {
      console.error('[Sales Report] Error fetching clients:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch client data' },
        { status: 500 }
      )
    }
    
    // Helper functions
    const calculateSessionDays = (sessionType: string): number => {
      switch (sessionType) {
        case '1 month': return 30
        case '3 months': return 90
        case '6 months': return 180
        case '12 months': return 365
        default: return 0
      }
    }
    
    const calculateDaysElapsed = (createdAt: string): number => {
      const startDate = new Date(createdAt)
      const today = new Date()
      return Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    }
    
    // Filter by period
    let filteredClients = clients || []
    if (period === 'current') {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      filteredClients = filteredClients.filter(c => {
        const date = new Date(c.created_at)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })
    }
    
    // Transform data for report with ALL client fields
    const reportData: SalesReportData[] = filteredClients.map(client => {
      const totalDays = calculateSessionDays(client.session_type || '')
      const daysElapsed = calculateDaysElapsed(client.created_at)
      const remainingDays = Math.max(0, totalDays - daysElapsed)
      const totalAmount = (client.first_payment || 0) + (client.balance || 0)
      
      return {
        clientId: client.client_id,
        clientName: client.full_name,
        email: client.email || '-',
        phoneNumber: client.phone_number || '-',
        age: client.age ? client.age.toString() : '-',
        gender: client.gender ? client.gender.charAt(0).toUpperCase() + client.gender.slice(1) : '-',
        trainerId: client.trainer_id || '-',
        sessionType: client.session_type || '-',
        amountCollected: client.first_payment || 0,
        remainingAmount: client.balance || 0,
        totalAmount: totalAmount,
        paymentMode: client.payment_mode ? client.payment_mode.charAt(0).toUpperCase() + client.payment_mode.slice(1).replace('_', ' ') : '-',
        daysLeft: remainingDays,
        daysElapsed: daysElapsed,
        totalDays: totalDays,
        status: client.status.charAt(0).toUpperCase() + client.status.slice(1),
        paymentStatus: (client.balance || 0) === 0 ? 'Paid' : 'Pending',
        createdAt: new Date(client.created_at).toLocaleDateString(),
        updatedAt: new Date(client.updated_at).toLocaleDateString(),
      }
    })
    
    // Calculate summary
    const totalSales = filteredClients.reduce((sum, c) => sum + (c.first_payment || 0), 0)
    const balancePayment = filteredClients.reduce((sum, c) => sum + (c.balance || 0), 0)
    const totalExpected = totalSales + balancePayment
    const collectionRate = totalExpected > 0 ? (totalSales / totalExpected) * 100 : 0
    
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthlySales = (clients || [])
      .filter(c => {
        const date = new Date(c.created_at)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })
      .reduce((sum, c) => sum + (c.first_payment || 0), 0)
    
    const newUsers = (clients || []).filter(c => {
      const date = new Date(c.created_at)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    }).length
    
    const summary: SalesReportSummary = {
      totalSales,
      monthlySales,
      newUsers,
      balancePayment,
      collectionRate,
      totalClients: filteredClients.length,
      activeClients: filteredClients.filter(c => c.status === 'active').length,
      reportDate: new Date().toLocaleDateString(),
      reportPeriod: period === 'current' ? 'Current Month' : 'All Time',
    }
    
    // Generate report based on format
    if (format === 'pdf') {
      const pdfBuffer = await generateSalesReportPDF(reportData, summary)
      
      return new NextResponse(pdfBuffer as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="sales-report-${Date.now()}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      })
    } else if (format === 'csv') {
      const csvContent = generateSalesReportCSV(reportData, summary)
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="sales-report-${Date.now()}.csv"`,
        },
      })
    } else if (format === 'excel') {
      const excelBuffer = generateSalesReportExcel(reportData, summary)
      
      return new NextResponse(excelBuffer as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="sales-report-${Date.now()}.xlsx"`,
        },
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Use pdf, csv, or excel' },
        { status: 400 }
      )
    }
    
  } catch (error) {
    console.error('[Sales Report] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
