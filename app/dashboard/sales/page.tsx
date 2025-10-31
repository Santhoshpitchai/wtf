'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, TrendingUp, TrendingDown } from 'lucide-react'
import type { PTSale } from '@/types'

export default function SalesPage() {
  const [sales, setSales] = useState<PTSale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('pt_sales')
        .select(`
          *,
          trainer:trainers(first_name, last_name),
          client:clients(full_name)
        `)
        .order('sale_date', { ascending: false })

      if (error) throw error
      setSales(data || [])
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Total Sales</div>
          <div className="text-3xl font-bold mb-2">7,265</div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp size={16} />
            <span>+11.01%</span>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Monthly Sales</div>
          <div className="text-3xl font-bold mb-2">3,671</div>
          <div className="flex items-center gap-1 text-sm text-red-600">
            <TrendingDown size={16} />
            <span>-0.03%</span>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">New Users</div>
          <div className="text-3xl font-bold mb-2">156</div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp size={16} />
            <span>+15.03%</span>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Balance Payment</div>
          <div className="text-3xl font-bold mb-2">2,318</div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp size={16} />
            <span>+6.08%</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-left p-4"><input type="checkbox" className="rounded" /></th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Order ID</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Personal Trainer</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Client Name</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Session type</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Total Days</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Status</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Payment</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center p-8 text-gray-500">Loading...</td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-8 text-gray-500">No sales found</td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4"><input type="checkbox" className="rounded" /></td>
                  <td className="p-4 text-sm text-gray-900">{sale.order_id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-300" />
                      <span className="text-sm">{sale.trainer?.first_name} {sale.trainer?.last_name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-300" />
                      <span className="text-sm">{sale.client?.full_name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{sale.session_type}</td>
                  <td className="p-4 text-sm text-gray-600">{sale.total_days || 0}</td>
                  <td className="p-4">
                    <span className={`text-sm ${
                      sale.status === 'in_progress' ? 'text-blue-600' :
                      sale.status === 'complete' ? 'text-green-600' :
                      sale.status === 'approved' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {sale.status.charAt(0).toUpperCase() + sale.status.slice(1).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm ${sale.payment_status === 'paid' ? 'text-green-600' : 'text-gray-600'}`}>
                      {sale.payment_status.charAt(0).toUpperCase() + sale.payment_status.slice(1)}
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
