'use client'

import { useState } from 'react'
import { X, AlertCircle, CheckCircle, Loader2, Mail, Calendar, DollarSign, User, FileText, Clock } from 'lucide-react'
import type { Invoice } from '@/types'

interface InvoiceDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: Invoice | null
  onResendSuccess?: () => void
}

export default function InvoiceDetailsModal({ 
  isOpen, 
  onClose, 
  invoice,
  onResendSuccess 
}: InvoiceDetailsModalProps) {
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  if (!isOpen || !invoice) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} at ${hours}:${minutes}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle size={20} className="text-green-600" />
      case 'failed':
        return <AlertCircle size={20} className="text-red-600" />
      case 'draft':
        return <FileText size={20} className="text-gray-600" />
      default:
        return null
    }
  }

  const handleResend = async () => {
    setResending(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/resend`, {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'Invoice resent successfully!' })
        if (onResendSuccess) {
          setTimeout(() => {
            onResendSuccess()
          }, 1500)
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to resend invoice' })
      }
    } catch (error) {
      console.error('Error resending invoice:', error)
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Invoice Details</h2>
            <p className="text-sm text-gray-500 mt-1">{invoice.invoice_number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message Display */}
          {message && (
            <div className={`flex items-start gap-3 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(invoice.status)}`}>
              {getStatusIcon(invoice.status)}
              <span className="font-medium capitalize">{invoice.status}</span>
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User size={18} />
              Client Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="text-sm text-gray-600 w-32 flex-shrink-0">Name:</span>
                <span className="text-sm font-medium text-gray-900">{invoice.client?.full_name || 'Unknown'}</span>
              </div>
              <div className="flex items-start">
                <span className="text-sm text-gray-600 w-32 flex-shrink-0">Email:</span>
                <span className="text-sm font-medium text-gray-900">{invoice.client?.email || 'No email'}</span>
              </div>
              <div className="flex items-start">
                <span className="text-sm text-gray-600 w-32 flex-shrink-0">Client ID:</span>
                <span className="text-sm font-medium text-gray-900">{invoice.client?.client_id || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign size={18} />
              Payment Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Amount Paid:</span>
                <span className="text-sm font-medium text-gray-900">₹{invoice.amount_paid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Amount Remaining:</span>
                <span className="text-sm font-medium text-gray-900">₹{invoice.amount_remaining.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-semibold text-gray-900">Total Amount:</span>
                <span className="text-lg font-bold text-cyan-600">₹{invoice.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Subscription & Date Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar size={18} />
                Payment Date
              </h3>
              <p className="text-sm font-medium text-gray-900">{formatDate(invoice.payment_date)}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock size={18} />
                Subscription Duration
              </h3>
              <p className="text-sm font-medium text-gray-900">
                {invoice.subscription_months} {invoice.subscription_months === 1 ? 'month' : 'months'}
              </p>
            </div>
          </div>

          {/* Email Delivery Status */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Mail size={18} />
              Email Delivery Status
            </h3>
            <div className="space-y-2">
              {invoice.email_sent_at ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm text-gray-900">Email sent successfully</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-sm text-gray-600 w-32 flex-shrink-0">Sent at:</span>
                    <span className="text-sm font-medium text-gray-900">{formatDateTime(invoice.email_sent_at)}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-gray-600" />
                  <span className="text-sm text-gray-600">Email not sent yet</span>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Metadata */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText size={18} />
              Invoice Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="text-sm text-gray-600 w-32 flex-shrink-0">Invoice Number:</span>
                <span className="text-sm font-medium text-gray-900">{invoice.invoice_number}</span>
              </div>
              <div className="flex items-start">
                <span className="text-sm text-gray-600 w-32 flex-shrink-0">Created at:</span>
                <span className="text-sm font-medium text-gray-900">{formatDateTime(invoice.created_at)}</span>
              </div>
              {invoice.updated_at && invoice.updated_at !== invoice.created_at && (
                <div className="flex items-start">
                  <span className="text-sm text-gray-600 w-32 flex-shrink-0">Last updated:</span>
                  <span className="text-sm font-medium text-gray-900">{formatDateTime(invoice.updated_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={resending}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] font-medium"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="flex-1 px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] font-medium flex items-center justify-center gap-2"
          >
            {resending ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Resending...
              </>
            ) : (
              <>
                <Mail size={20} />
                Resend Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
