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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, ID, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter size={20} />
              Filters
              {statusFilter !== 'all' && (
                <span className="ml-1 px-2 py-0.5 bg-teal-500 text-white text-xs rounded-full">1</span>
              )}
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
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
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
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
        <button 
          onClick={() => router.push('/dashboard/clients')}
          className="flex items-center gap-2 px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <Plus size={20} />
          Add Client
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Total Collected</div>
          <div className="text-3xl font-bold text-green-600">₹{totalCollected.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">{filteredClients.length} clients</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Total Pending</div>
          <div className="text-3xl font-bold text-orange-600">₹{totalPending.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">Outstanding balance</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Active Clients</div>
          <div className="text-3xl font-bold text-blue-600">{filteredClients.filter(c => c.status === 'active').length}</div>
          <div className="text-xs text-gray-500 mt-1">of {filteredClients.length} total</div>
        </div>
      </div>

      {/* Payments Table */}
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
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-8 text-gray-500">
                  {searchTerm || statusFilter !== 'all' || dateRange.start ? 'No payments match your search' : 'No payments found'}
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4"><input type="checkbox" className="rounded" /></td>
                  <td className="p-4">
                    <span className="text-blue-600 font-medium">{client.client_id}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(client.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm text-gray-900">{client.full_name}</td>
                  <td className="p-4 text-sm text-gray-600">{client.phone_number || '-'}</td>
                  <td className="p-4 text-sm font-medium text-green-600">₹{client.first_payment || 0}</td>
                  <td className="p-4 text-sm font-medium text-orange-600">₹{client.balance || 0}</td>
                  <td className="p-4">
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
