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

  // Calculate data for visualizations
  const sessionTypeData = {
    '1 month': filteredClients.filter(c => c.session_type === '1 month').length,
    '3 months': filteredClients.filter(c => c.session_type === '3 months').length,
    '6 months': filteredClients.filter(c => c.session_type === '6 months').length,
    '12 months': filteredClients.filter(c => c.session_type === '12 months').length,
  }

  const paymentStatusData = {
    paid: filteredClients.filter(c => (c.balance || 0) === 0).length,
    pending: filteredClients.filter(c => (c.balance || 0) > 0).length,
  }

  const totalClients = filteredClients.length
  const paidPercentage = totalClients > 0 ? (paymentStatusData.paid / totalClients) * 100 : 0
  const pendingPercentage = totalClients > 0 ? (paymentStatusData.pending / totalClients) * 100 : 0

  // Calculate collection rate
  const totalExpected = filteredClients.reduce((sum, c) => sum + (c.first_payment || 0) + (c.balance || 0), 0)
  const collectionRate = totalExpected > 0 ? (totalSales / totalExpected) * 100 : 0

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Stats Cards - Responsive grid with modern gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-xs md:text-sm text-blue-100 mb-2">Total Sales</div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">₹{totalSales.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-xs md:text-sm text-blue-100">
            <TrendingUp size={16} />
            <span>+{totalSalesChange}%</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-xs md:text-sm text-purple-100 mb-2">Monthly Sales</div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">₹{monthlySales.toLocaleString()}</div>
          <div className={`flex items-center gap-1 text-xs md:text-sm text-purple-100`}>
            {parseFloat(monthlySalesChange) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{monthlySalesChange}%</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-xs md:text-sm text-teal-100 mb-2">New Users</div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">{newUsersThisMonth}</div>
          <div className={`flex items-center gap-1 text-xs md:text-sm text-teal-100`}>
            {parseFloat(newUsersChange) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{newUsersChange}%</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-xs md:text-sm text-orange-100 mb-2">Balance Payment</div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">₹{balancePayment.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-xs md:text-sm text-orange-100">
            <TrendingUp size={16} />
            <span>+{balanceChange}%</span>
          </div>
        </div>
      </div>

      {/* Data Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Payment Status Donut Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-base md:text-lg font-bold text-gray-900 mb-6">Payment Status</h3>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              {/* Donut Chart using SVG */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="12"
                />
                {/* Paid segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray={`${paidPercentage * 2.51} ${251 - paidPercentage * 2.51}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                {/* Pending segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="12"
                  strokeDasharray={`${pendingPercentage * 2.51} ${251 - pendingPercentage * 2.51}`}
                  strokeDashoffset={`-${paidPercentage * 2.51}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-gray-900">{totalClients}</div>
                <div className="text-xs text-gray-500">Total Clients</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Paid</span>
              </div>
              <div className="text-sm font-semibold text-gray-900">{paymentStatusData.paid} ({paidPercentage.toFixed(0)}%)</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <div className="text-sm font-semibold text-gray-900">{paymentStatusData.pending} ({pendingPercentage.toFixed(0)}%)</div>
            </div>
          </div>
        </div>

        {/* Session Type Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-base md:text-lg font-bold text-gray-900 mb-6">Session Types</h3>
          <div className="space-y-4">
            {Object.entries(sessionTypeData).map(([type, count], index) => {
              const percentage = totalClients > 0 ? (count / totalClients) * 100 : 0
              const colors = ['bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-pink-500']
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{type}</span>
                    <span className="text-sm font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full ${colors[index]} rounded-full transition-all duration-1000`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Collection Rate Gauge */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-base md:text-lg font-bold text-gray-900 mb-6">Collection Rate</h3>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-24">
              {/* Semi-circle gauge */}
              <svg className="w-full h-full" viewBox="0 0 100 50">
                {/* Background arc */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Progress arc */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke={collectionRate >= 75 ? '#10b981' : collectionRate >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(collectionRate / 100) * 125.6} 125.6`}
                  className="transition-all duration-1000"
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                <div className="text-3xl font-bold text-gray-900">{collectionRate.toFixed(0)}%</div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Collected</span>
              <span className="font-semibold text-green-600">₹{totalSales.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-amber-600">₹{balancePayment.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="text-gray-600">Total Expected</span>
              <span className="font-bold text-gray-900">₹{totalExpected.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search - Stack vertically on mobile */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 order-2 lg:order-1">
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <Plus size={20} />
          </button>
          <button 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="relative p-2 border border-gray-300 rounded-lg hover:bg-gray-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Filter size={20} />
            {(statusFilter !== 'all' || monthFilter !== 'all') && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 text-white text-xs rounded-full flex items-center justify-center">
                {(statusFilter !== 'all' ? 1 : 0) + (monthFilter !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <Calendar size={20} />
          </button>
        </div>
        <div className="relative flex-1 max-w-full lg:max-w-md order-1 lg:order-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 min-h-[44px] text-sm md:text-base"
          />
        </div>
      </div>

      {/* Filter Menu */}
      {showFilterMenu && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 min-h-[44px]"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 min-h-[44px]"
              >
                <option value="all">All Time</option>
                <option value="current">Current Month</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Bar */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-4 md:p-6 mb-6 border border-teal-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xs md:text-sm text-gray-600 mb-1">Active Clients</div>
            <div className="text-xl md:text-2xl font-bold text-teal-600">{filteredClients.filter(c => c.status === 'active').length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs md:text-sm text-gray-600 mb-1">Avg. Session</div>
            <div className="text-xl md:text-2xl font-bold text-blue-600">
              {totalClients > 0 ? Math.round(filteredClients.reduce((sum, c) => sum + c.total_days, 0) / totalClients) : 0} days
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs md:text-sm text-gray-600 mb-1">Collection Rate</div>
            <div className={`text-xl md:text-2xl font-bold ${collectionRate >= 75 ? 'text-green-600' : collectionRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
              {collectionRate.toFixed(0)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs md:text-sm text-gray-600 mb-1">Avg. Payment</div>
            <div className="text-xl md:text-2xl font-bold text-purple-600">
              ₹{totalClients > 0 ? Math.round(totalSales / totalClients) : 0}
            </div>
          </div>
        </div>
      </div>

      {/* Table - Horizontally scrollable on mobile */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left p-3 md:p-4"><input type="checkbox" className="rounded" /></th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Client ID</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Client Name</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Session Type</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Amount Collected</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Remaining Amt</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Days Left</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Status</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Payment</th>
              </tr>
            </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center p-8 text-gray-500 text-sm md:text-base">Loading...</td>
              </tr>
            ) : paginatedClients.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center p-8 text-gray-500 text-sm md:text-base">No clients found</td>
              </tr>
            ) : (
              paginatedClients.map((client) => (
                <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 md:p-4"><input type="checkbox" className="rounded" /></td>
                  <td className="p-3 md:p-4">
                    <span className="text-blue-600 font-medium text-xs md:text-sm">{client.client_id}</span>
                  </td>
                  <td className="p-3 md:p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs md:text-sm font-medium flex-shrink-0">
                        {client.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs md:text-sm font-medium">{client.full_name}</span>
                    </div>
                  </td>
                  <td className="p-3 md:p-4 text-xs md:text-sm text-gray-600">{client.session_type || '-'}</td>
                  <td className="p-3 md:p-4 text-xs md:text-sm font-medium text-gray-900">₹{client.first_payment || 0}</td>
                  <td className="p-3 md:p-4 text-xs md:text-sm font-medium text-gray-900">₹{client.balance || 0}</td>
                  <td className="p-3 md:p-4">
                    <span className={`text-xs md:text-sm font-medium ${
                      client.remaining_days > 30 ? 'text-green-600' :
                      client.remaining_days > 7 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {client.remaining_days} days
                    </span>
                  </td>
                  <td className="p-3 md:p-4">
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
                      client.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-3 md:p-4">
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
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
        </div>

        {/* Pagination - Optimized for mobile */}
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
                    ? 'bg-teal-500 text-white border-teal-500'
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
                      ? 'bg-teal-500 text-white border-teal-500'
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
