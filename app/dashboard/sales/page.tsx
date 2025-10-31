'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, TrendingUp, TrendingDown, Filter, Plus, Calendar } from 'lucide-react'
import type { Client } from '@/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getCurrentUser } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'

interface ClientSalesData extends Client {
  remaining_days: number
  days_elapsed: number
  total_days: number
}

function SalesPageContent() {
  const [clients, setClients] = useState<ClientSalesData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [monthFilter, setMonthFilter] = useState<'all' | 'current'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadUserAndData()
  }, [])

  const loadUserAndData = async () => {
    const user = await getCurrentUser()
    setCurrentUser(user)
    await fetchClients(user)
  }

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

  const fetchClients = async (user: AuthUser | null) => {
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      // If PT, filter to only show their clients
      if (user?.role === 'pt' && user.trainer_id) {
        query = query.eq('trainer_id', user.trainer_id)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform clients with sales data
      const clientsWithSalesData: ClientSalesData[] = (data || []).map((client: Client) => {
        const totalDays = calculateSessionDays(client.session_type || '')
        const daysElapsed = calculateDaysElapsed(client.created_at)
        const remainingDays = Math.max(0, totalDays - daysElapsed)

        return {
          ...client,
          total_days: totalDays,
          days_elapsed: daysElapsed,
          remaining_days: remainingDays
        }
      })

      setClients(clientsWithSalesData)
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const filteredClients = clients.filter(client => {
    const matchesSearch = searchTerm === '' || 
      client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.client_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    
    const matchesMonth = monthFilter === 'all' || 
      (monthFilter === 'current' && new Date(client.created_at).getMonth() === new Date().getMonth())
    
    return matchesSearch && matchesStatus && matchesMonth
  })

  const totalSales = filteredClients.reduce((sum, client) => sum + (client.first_payment || 0), 0)
  
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlySales = clients
    .filter(c => {
      const date = new Date(c.created_at)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    .reduce((sum, client) => sum + (client.first_payment || 0), 0)
  
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const lastMonthSales = clients
    .filter(c => {
      const date = new Date(c.created_at)
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
    })
    .reduce((sum, client) => sum + (client.first_payment || 0), 0)
  
  const monthlySalesChange = lastMonthSales > 0 
    ? ((monthlySales - lastMonthSales) / lastMonthSales * 100).toFixed(2)
    : '0.00'

  const newUsersThisMonth = clients.filter(c => {
    const date = new Date(c.created_at)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).length

  const newUsersLastMonth = clients.filter(c => {
    const date = new Date(c.created_at)
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
  }).length

  const newUsersChange = newUsersLastMonth > 0
    ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(2)
    : '0.00'

  const balancePayment = filteredClients.reduce((sum, client) => sum + (client.balance || 0), 0)
  
  const totalSalesChange = clients.length > 0 ? '+11.01' : '0.00'
  const balanceChange = '+6.08'

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Total Sales</div>
          <div className="text-3xl font-bold mb-2">₹{totalSales.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp size={16} />
            <span>+{totalSalesChange}%</span>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Monthly Sales</div>
          <div className="text-3xl font-bold mb-2">₹{monthlySales.toLocaleString()}</div>
          <div className={`flex items-center gap-1 text-sm ${parseFloat(monthlySalesChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {parseFloat(monthlySalesChange) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{monthlySalesChange}%</span>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">New Users</div>
          <div className="text-3xl font-bold mb-2">{newUsersThisMonth}</div>
          <div className={`flex items-center gap-1 text-sm ${parseFloat(newUsersChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {parseFloat(newUsersChange) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{newUsersChange}%</span>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Balance Payment</div>
          <div className="text-3xl font-bold mb-2">₹{balancePayment.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp size={16} />
            <span>+{balanceChange}%</span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4 flex-1">
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Plus size={20} />
          </button>
          <button 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="relative p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter size={20} />
            {(statusFilter !== 'all' || monthFilter !== 'all') && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 text-white text-xs rounded-full flex items-center justify-center">
                {(statusFilter !== 'all' ? 1 : 0) + (monthFilter !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Calendar size={20} />
          </button>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
      </div>

      {/* Filter Menu */}
      {showFilterMenu && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value as 'all' | 'current')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                <option value="all">All Time</option>
                <option value="current">Current Month</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-left p-4"><input type="checkbox" className="rounded" /></th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Client ID</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Client Name</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Session Type</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Amount Collected</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Remaining Amt</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Days Left</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Status</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Payment</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center p-8 text-gray-500">Loading...</td>
              </tr>
            ) : paginatedClients.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center p-8 text-gray-500">No clients found</td>
              </tr>
            ) : (
              paginatedClients.map((client) => (
                <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4"><input type="checkbox" className="rounded" /></td>
                  <td className="p-4">
                    <span className="text-blue-600 font-medium text-sm">{client.client_id}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                        {client.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{client.full_name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{client.session_type || '-'}</td>
                  <td className="p-4 text-sm font-medium text-gray-900">₹{client.first_payment || 0}</td>
                  <td className="p-4 text-sm font-medium text-gray-900">₹{client.balance || 0}</td>
                  <td className="p-4">
                    <span className={`text-sm font-medium ${
                      client.remaining_days > 30 ? 'text-green-600' :
                      client.remaining_days > 7 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {client.remaining_days} days
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      client.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      (client.balance || 0) === 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {(client.balance || 0) === 0 ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show result</span>
            <select className="border border-gray-300 rounded px-2 py-1 text-sm">
              <option>{itemsPerPage}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              &lt;
            </button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 border rounded ${
                  currentPage === i + 1
                    ? 'bg-teal-500 text-white border-teal-500'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SalesPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'pt']}>
      <SalesPageContent />
    </ProtectedRoute>
  )
}
