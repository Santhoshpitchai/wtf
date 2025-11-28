'use client'

import { useState, useEffect } from 'react'
import { X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Client, InvoiceFormData } from '@/types'

interface CreateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateInvoiceModal({ isOpen, onClose, onSuccess }: CreateInvoiceModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState<InvoiceFormData>({
    client_id: '',
    amount_paid: 0,
    amount_remaining: 0,
    payment_date: new Date().toISOString().split('T')[0],
    subscription_months: 1,
  })
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  
  const [errors, setErrors] = useState<{
    client_id?: string
    amount_paid?: string
    amount_remaining?: string
    payment_date?: string
    subscription_months?: string
  }>({})

  useEffect(() => {
    if (isOpen) {
      fetchClients()
      // Reset form when modal opens
      setFormData({
        client_id: '',
        amount_paid: 0,
        amount_remaining: 0,
        payment_date: new Date().toISOString().split('T')[0],
        subscription_months: 1,
      })
      setSelectedClient(null)
      setSearchTerm('')
      setErrors({})
      setMessage(null)
    }
  }, [isOpen])

  const fetchClients = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('full_name')

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
      setMessage({ type: 'error', text: 'Failed to load clients' })
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.client_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setFormData(prev => ({ ...prev, client_id: client.id }))
    setSearchTerm(client.full_name)
    setShowClientDropdown(false)
    
    // Clear client_id error when client is selected
    if (errors.client_id) {
      setErrors(prev => ({ ...prev, client_id: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}
    
    // Client validation
    if (!formData.client_id) {
      newErrors.client_id = 'Please select a client'
    } else if (selectedClient && (!selectedClient.email || selectedClient.email.trim() === '')) {
      newErrors.client_id = 'Selected client does not have a registered email address'
    }
    
    // Amount paid validation
    if (formData.amount_paid === undefined || formData.amount_paid === null) {
      newErrors.amount_paid = 'Amount paid is required'
    } else if (formData.amount_paid <= 0) {
      newErrors.amount_paid = 'Amount paid must be greater than zero'
    }
    
    // Amount remaining validation
    if (formData.amount_remaining === undefined || formData.amount_remaining === null) {
      newErrors.amount_remaining = 'Amount remaining is required'
    } else if (formData.amount_remaining < 0) {
      newErrors.amount_remaining = 'Amount remaining cannot be negative'
    }
    
    // Payment date validation
    if (!formData.payment_date) {
      newErrors.payment_date = 'Payment date is required'
    } else {
      const paymentDate = new Date(formData.payment_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (paymentDate > today) {
        // Warning but not error
        setMessage({ 
          type: 'error', 
          text: 'Payment date is in the future. Are you sure you want to continue?' 
        })
      }
    }
    
    // Subscription months validation
    if (!formData.subscription_months || formData.subscription_months <= 0) {
      newErrors.subscription_months = 'Subscription duration must be a positive number'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setSubmitting(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Invoice created and sent successfully!' })
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create invoice' })
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const totalAmount = formData.amount_paid + formData.amount_remaining

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Invoice</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowClientDropdown(true)
                }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Search for a client..."
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] ${
                  errors.client_id ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              
              {/* Dropdown */}
              {showClientDropdown && searchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center text-gray-500">Loading clients...</div>
                  ) : filteredClients.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No clients found</div>
                  ) : (
                    filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleClientSelect(client)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 min-h-[44px]"
                      >
                        <div className="font-medium text-gray-900">{client.full_name}</div>
                        <div className="text-sm text-gray-500">{client.email || 'No email'}</div>
                        <div className="text-xs text-gray-400">ID: {client.client_id}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {/* Selected Client Info */}
            {selectedClient && (
              <div className="mt-2 p-3 bg-teal-50 rounded-lg border border-teal-200">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{selectedClient.full_name}</div>
                  <div className="text-gray-600">{selectedClient.email || 'No email'}</div>
                </div>
              </div>
            )}
            
            {errors.client_id && (
              <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>
            )}
          </div>

          {/* Amount Paid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount Paid (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount_paid || ''}
              onChange={(e) => handleInputChange('amount_paid', parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] ${
                errors.amount_paid ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.amount_paid && (
              <p className="mt-1 text-sm text-red-600">{errors.amount_paid}</p>
            )}
          </div>

          {/* Amount Remaining */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount Remaining (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount_remaining || ''}
              onChange={(e) => handleInputChange('amount_remaining', parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] ${
                errors.amount_remaining ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.amount_remaining && (
              <p className="mt-1 text-sm text-red-600">{errors.amount_remaining}</p>
            )}
          </div>

          {/* Total Amount Display */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Amount:</span>
              <span className="text-xl font-bold text-gray-900">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.payment_date}
              onChange={(e) => handleInputChange('payment_date', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] ${
                errors.payment_date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.payment_date && (
              <p className="mt-1 text-sm text-red-600">{errors.payment_date}</p>
            )}
          </div>

          {/* Subscription Months */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subscription Duration (months) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.subscription_months || ''}
              onChange={(e) => handleInputChange('subscription_months', parseInt(e.target.value) || 1)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] ${
                errors.subscription_months ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="1"
            />
            {errors.subscription_months && (
              <p className="mt-1 text-sm text-red-600">{errors.subscription_months}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] font-medium flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Invoice'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
