'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Filter, Calendar, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Client } from '@/types'
import { getCurrentUser } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'

export default function PaymentsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    loadUserAndData()
  }, [])

  const loadUserAndData = async () => {
    const user = await getCurrentUser()
    setCurrentUser(user)
    await fetchClients(user)
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
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.client_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone_number && client.phone_number.includes(searchTerm))
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    
    // Date range filter
    let matchesDate = true
    if (dateRange.start && dateRange.end) {
      const clientDate = new Date(client.created_at)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999)
      matchesDate = clientDate >= startDate && clientDate <= endDate
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })

  // Calculate totals
  const totalCollected = filteredClients.reduce((sum, client) => sum + (client.first_payment || 0), 0)
  const totalPending = filteredClients.reduce((sum, client) => sum + (client.balance || 0), 0)

  // Calculate visualization data
  const totalClients = filteredClients.length
  const activeClients = filteredClients.filter(c => c.status === 'active').length
  const inactiveClients = totalClients - activeClients
  
  const paidClients = filteredClients.filter(c => (c.balance || 0) === 0).length
  const pendingClients = totalClients - paidClients
  
  const totalExpected = totalCollected + totalPending
  const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0
  
  // Payment status percentages for pie chart
  const paidPercentage = totalClients > 0 ? (paidClients / totalClients) * 100 : 0
  const pendingPercentage = totalClients > 0 ? (pendingClients / totalClients) * 100 : 0
  
  // Monthly breakdown (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - i))
    const month = date.toLocaleString('default', { month: 'short' })
    const collected = filteredClients
      .filter(c => {
        const clientDate = new Date(c.created_at)
        return clientDate.getMonth() === date.getMonth() && clientDate.getFullYear() === date.getFullYear()
      })
      .reduce((sum, c) => sum + (c.first_payment || 0), 0)
    return { month, collected }
  })
  
  const maxMonthlyCollection = Math.max(...monthlyData.map(d => d.collected), 1)

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Search and Filter Controls - Stack vertically on mobile */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, ID, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm md:text-base"
          />
        </div>

        {/* Filter and Date Range - Stack on mobile, inline on larger screens */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 sm:flex-initial">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm md:text-base"
            >
              <Filter size={20} />
              Filters
              {statusFilter !== 'all' && (
                <span className="ml-1 px-2 py-0.5 bg-teal-500 text-white text-xs rounded-full">1</span>
              )}
            </button>
            {showFilterMenu && (
              <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 px-3 py-2">Status</div>
                  <button
                    onClick={() => { setStatusFilter('all'); setShowFilterMenu(false) }}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm ${statusFilter === 'all' ? 'bg-gray-100 font-medium' : ''}`}
                  >
                    All Status
                  </button>
                  <button
                    onClick={() => { setStatusFilter('active'); setShowFilterMenu(false) }}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm ${statusFilter === 'active' ? 'bg-gray-100 font-medium' : ''}`}
                  >
                    Active Only
                  </button>
                  <button
                    onClick={() => { setStatusFilter('inactive'); setShowFilterMenu(false) }}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm ${statusFilter === 'inactive' ? 'bg-gray-100 font-medium' : ''}`}
                  >
                    Inactive Only
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Date Range Picker - Hidden on mobile, visible on md+ */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
            <Calendar size={20} />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="border-none focus:outline-none text-sm"
              placeholder="Start date"
            />
            <span>-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="border-none focus:outline-none text-sm"
              placeholder="End date"
            />
          </div>
        </div>

        {/* Add Client Button - Full width on mobile */}
        <button 
          onClick={() => router.push('/dashboard/clients')}
          className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm md:text-base font-medium"
        >
          <Plus size={20} />
          Add Client
        </button>
      </div>

      {/* Clean Summary Cards - 1 column on mobile, 3 on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-gray-500">Total Collected</div>
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">₹{totalCollected.toLocaleString()}</div>
          <div className="text-xs text-gray-500">{filteredClients.length} clients</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-gray-500">Total Pending</div>
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">₹{totalPending.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Outstanding balance</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-gray-500">Active Clients</div>
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-teal-500"></div>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{activeClients}</div>
          <div className="text-xs text-gray-500">of {filteredClients.length} total</div>
        </div>
      </div>

      {/* Clean Data Visualization - Only for PT users */}
      {currentUser?.role === 'pt' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Payment Distribution */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Payment Distribution</h3>
              <div className="text-sm text-gray-500">{totalClients} clients</div>
            </div>
            
            <div className="space-y-4">
              {/* Paid Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    <span className="text-sm font-medium text-gray-700">Fully Paid</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{paidClients} ({paidPercentage.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="h-full bg-teal-500 rounded-full transition-all duration-1000"
                    style={{ width: `${paidPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Pending Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-sm font-medium text-gray-700">Pending Payment</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{pendingClients} ({pendingPercentage.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: `${pendingPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Collection Rate */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Collection Rate</span>
                  <span className={`text-2xl font-bold ${collectionRate >= 75 ? 'text-teal-600' : collectionRate >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
                    {collectionRate.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${collectionRate >= 75 ? 'bg-teal-500' : collectionRate >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                    style={{ width: `${collectionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Trend</h3>
              <div className="text-sm text-gray-500">Last 6 months</div>
            </div>
            
            <div className="space-y-3">
              {monthlyData.map((data, index) => {
                const barWidth = (data.collected / maxMonthlyCollection) * 100
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-12 text-xs font-medium text-gray-600">{data.month}</div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                        <div 
                          className="h-full bg-teal-500 rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(barWidth, 5)}%` }}
                        >
                          {data.collected > 0 && (
                            <span className="text-xs font-medium text-white">₹{data.collected.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Payments Table - Horizontal scroll container on mobile */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-left p-3 md:p-4"><input type="checkbox" className="rounded" /></th>
              <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Client ID</th>
              <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Date</th>
              <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Full Name</th>
              <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Contact Number</th>
              <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">1st Payment</th>
              <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Pending Payment</th>
              <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center p-8 text-gray-500 text-sm md:text-base">Loading...</td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-8 text-gray-500 text-sm md:text-base">
                  {searchTerm || statusFilter !== 'all' || dateRange.start ? 'No payments match your search' : 'No payments found'}
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 md:p-4"><input type="checkbox" className="rounded" /></td>
                  <td className="p-3 md:p-4">
                    <span className="text-blue-600 font-medium text-xs md:text-sm">{client.client_id}</span>
                  </td>
                  <td className="p-3 md:p-4 text-xs md:text-sm text-gray-600">
                    {new Date(client.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 md:p-4 text-xs md:text-sm text-gray-900">{client.full_name}</td>
                  <td className="p-3 md:p-4 text-xs md:text-sm text-gray-600">{client.phone_number || '-'}</td>
                  <td className="p-3 md:p-4 text-xs md:text-sm font-medium text-green-600">₹{client.first_payment || 0}</td>
                  <td className="p-3 md:p-4 text-xs md:text-sm font-medium text-orange-600">₹{client.balance || 0}</td>
                  <td className="p-3 md:p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      client.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {client.status === 'active' ? 'Active' : 'Inactive'}
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
