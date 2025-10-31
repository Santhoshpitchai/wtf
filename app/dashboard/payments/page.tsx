'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Filter, Calendar, Plus } from 'lucide-react'
import type { Payment } from '@/types'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          client:clients(client_id, full_name, phone_number)
        `)
        .order('payment_date', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by ID, product, or others..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={20} />
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Calendar size={20} />
            April 11 - April 24
          </button>
        </div>
        <button className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
          <Plus size={20} />
          Add Client
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-left p-4"><input type="checkbox" className="rounded" /></th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Client ID</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Date</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Full Name</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Contact Number</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">1st Payment</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Pending Payment</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center p-8 text-gray-500">Loading...</td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-8 text-gray-500">No payments found</td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4"><input type="checkbox" className="rounded" /></td>
                  <td className="p-4">
                    <span className="text-blue-600 font-medium">{payment.client?.client_id}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm text-gray-900">{payment.client?.full_name}</td>
                  <td className="p-4 text-sm text-gray-600">{payment.client?.phone_number || '1234567899'}</td>
                  <td className="p-4 text-sm text-gray-600">${payment.amount_paid}</td>
                  <td className="p-4 text-sm text-gray-600">${payment.amount_pending}</td>
                  <td className="p-4">
                    <span className={`text-sm ${payment.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                      {payment.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
