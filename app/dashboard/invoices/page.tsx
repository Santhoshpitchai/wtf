'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Filter, Plus, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import type { Invoice } from '@/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import CreateInvoiceModal from '@/components/CreateInvoiceModal'
import InvoiceDetailsModal from '@/components/InvoiceDetailsModal'

function InvoicesPageContent() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed' | 'draft'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const itemsPerPage = 10

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          client:clients(
            id,
            client_id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Calculate statistics
  const totalInvoices = invoices.length
  const sentInvoices = invoices.filter(inv => inv.status === 'sent').length
  const failedInvoices = invoices.filter(inv => inv.status === 'failed').length
  const draftInvoices = invoices.filter(inv => inv.status === 'draft').length

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      case 'draft':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle size={16} className="text-green-600" />
      case 'failed':
        return <AlertCircle size={16} className="text-red-600" />
      case 'draft':
        return <FileText size={16} className="text-gray-600" />
      default:
        return null
    }
  }

  const handleInvoiceClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowDetailsModal(true)
  }

  const handleDetailsModalClose = () => {
    setShowDetailsModal(false)
    setSelectedInvoice(null)
  }

  const handleResendSuccess = () => {
    fetchInvoices()
    setShowDetailsModal(false)
    setSelectedInvoice(null)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-xs md:text-sm text-blue-100 mb-2">Total Invoices</div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">{totalInvoices}</div>
          <div className="flex items-center gap-1 text-xs md:text-sm text-blue-100">
            <FileText size={16} />
            <span>All time</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-xs md:text-sm text-green-100 mb-2">Sent</div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">{sentInvoices}</div>
          <div className="flex items-center gap-1 text-xs md:text-sm text-green-100">
            <CheckCircle size={16} />
            <span>Successfully delivered</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-xs md:text-sm text-red-100 mb-2">Failed</div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">{failedInvoices}</div>
          <div className="flex items-center gap-1 text-xs md:text-sm text-red-100">
            <AlertCircle size={16} />
            <span>Delivery failed</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-xs md:text-sm text-gray-100 mb-2">Draft</div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">{draftInvoices}</div>
          <div className="flex items-center gap-1 text-xs md:text-sm text-gray-100">
            <FileText size={16} />
            <span>Not sent yet</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 order-2 lg:order-1">
          <button 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="relative p-2 border border-gray-300 rounded-lg hover:bg-gray-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Filter size={20} />
            {statusFilter !== 'all' && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-white text-xs rounded-full flex items-center justify-center">
                1
              </span>
            )}
          </button>
        </div>

        <div className="relative flex-1 max-w-full lg:max-w-md order-1 lg:order-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by invoice number or client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 min-h-[44px] text-sm md:text-base"
          />
        </div>

        <button 
          onClick={() => setShowCreateModal(true)}
          className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm md:text-base font-medium order-3"
        >
          <Plus size={20} />
          Create Invoice
        </button>
      </div>

      {/* Filter Menu */}
      {showFilterMenu && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'sent' | 'failed' | 'draft')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 min-h-[44px]"
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Invoice History Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left p-3 md:p-4"><input type="checkbox" className="rounded" /></th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Invoice Number</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Client Name</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Amount Paid</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Payment Date</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-500 text-sm md:text-base">Loading...</td>
                </tr>
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-500 text-sm md:text-base">
                    {searchTerm || statusFilter !== 'all' ? 'No invoices match your search' : 'No invoices found'}
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <tr 
                    key={invoice.id} 
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleInvoiceClick(invoice)}
                  >
                    <td className="p-3 md:p-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="p-3 md:p-4">
                      <span className="text-blue-600 font-medium text-xs md:text-sm">{invoice.invoice_number}</span>
                    </td>
                    <td className="p-3 md:p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs md:text-sm font-medium flex-shrink-0">
                          {invoice.client?.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="text-xs md:text-sm font-medium">{invoice.client?.full_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-3 md:p-4 text-xs md:text-sm font-medium text-gray-900">
                      ₹{invoice.amount_paid.toLocaleString()}
                    </td>
                    <td className="p-3 md:p-4 text-xs md:text-sm text-gray-600">
                      {formatDate(invoice.payment_date)}
                    </td>
                    <td className="p-3 md:p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invoice.status)}
                        <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm text-gray-600">Show result</span>
            <select className="border border-gray-300 rounded px-2 py-1 text-xs md:text-sm">
              <option>{itemsPerPage}</option>
            </select>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-2 sm:px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 min-w-[36px] min-h-[36px]"
            >
              &lt;
            </button>
            {[...Array(Math.min(3, totalPages))].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-2 sm:px-3 py-1 border rounded min-w-[36px] min-h-[36px] ${
                  currentPage === i + 1
                    ? 'bg-cyan-500 text-white border-cyan-500'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            {totalPages > 3 && (
              <>
                <span className="px-1">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`px-2 sm:px-3 py-1 border rounded min-w-[36px] min-h-[36px] ${
                    currentPage === totalPages
                      ? 'bg-cyan-500 text-white border-cyan-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-2 sm:px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 min-w-[36px] min-h-[36px]"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchInvoices()
          setShowCreateModal(false)
        }}
      />

      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        isOpen={showDetailsModal}
        onClose={handleDetailsModalClose}
        invoice={selectedInvoice}
        onResendSuccess={handleResendSuccess}
      />
    </div>
  )
}

export default function InvoicesPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <InvoicesPageContent />
    </ProtectedRoute>
  )
}
