'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Filter, Calendar, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Client } from '@/types'
import { getCurrentUser } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'

interface ClientSession {
  id: string
  client_id: string
  full_name: string
  phone_number: string
  session_type: string
  session_date: string
  total_duration: number
  remaining_days: number
  status: 'booked' | 'confirmed' | 'pending'
  created_at: string
}

export default function SessionsPage() {
  const router = useRouter()
  const [clientSessions, setClientSessions] = useState<ClientSession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'booked' | 'pending'>('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    loadUserAndData()
  }, [])

  const loadUserAndData = async () => {
    const user = await getCurrentUser()
    setCurrentUser(user)
    await fetchClientSessions(user)
  }

  const calculateSessionDuration = (sessionType: string): number => {
    switch (sessionType) {
      case '1 month': return 30
      case '3 months': return 90
      case '6 months': return 180
      case '12 months': return 365
      default: return 0
    }
  }

  const calculateRemainingDays = (createdAt: string, totalDays: number): number => {
    const startDate = new Date(createdAt)
    const today = new Date()
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const remaining = totalDays - daysPassed
    return remaining > 0 ? remaining : 0
  }

  const fetchClientSessions = async (user: AuthUser | null) => {
    try {
      // Fetch clients with their session status
      let query = supabase
        .from('clients')
        .select(`
          *,
          client_sessions(status)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      // If PT, filter to only show their clients
      if (user?.role === 'pt' && user.trainer_id) {
        query = query.eq('trainer_id', user.trainer_id)
      }

      const { data: clients, error: clientsError } = await query

      if (clientsError) throw clientsError

      // Transform clients into session format
      const sessions: ClientSession[] = await Promise.all(
        (clients || []).map(async (client: any) => {
          const totalDuration = calculateSessionDuration(client.session_type || '')
          const remainingDays = calculateRemainingDays(client.created_at, totalDuration)
          
          // Get or create session status
          let sessionStatus: 'pending' | 'booked' | 'confirmed' = 'pending'
          
          if (client.client_sessions && client.client_sessions.length > 0) {
            sessionStatus = client.client_sessions[0].status
          } else {
            // Create initial session status
            const { error: insertError } = await supabase
              .from('client_sessions')
              .insert({ client_id: client.id, status: 'pending' })
            
            if (insertError) console.error('Error creating session status:', insertError)
          }
          
          return {
            id: client.id,
            client_id: client.client_id,
            full_name: client.full_name,
            phone_number: client.phone_number || '',
            session_type: client.session_type || 'N/A',
            session_date: client.created_at,
            total_duration: totalDuration,
            remaining_days: remainingDays,
            status: sessionStatus,
            created_at: client.created_at
          }
        })
      )

      setClientSessions(sessions)
    } catch (error) {
      console.error('Error fetching client sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (sessionId: string, newStatus: 'booked' | 'confirmed' | 'pending') => {
    try {
      // Update the status in the database
      const { error } = await supabase
        .from('client_sessions')
        .upsert({ 
          client_id: sessionId, 
          status: newStatus 
        }, {
          onConflict: 'client_id'
        })
      
      if (error) throw error

      // Update the status in the local state
      setClientSessions(prev => 
        prev.map(session => 
          session.id === sessionId ? { ...session, status: newStatus } : session
        )
      )
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const filteredSessions = clientSessions.filter(session => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      session.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.client_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.session_type.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter
    
    // Date range filter
    let matchesDate = true
    if (dateRange.start && dateRange.end) {
      const sessionDate = new Date(session.session_date)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999)
      matchesDate = sessionDate >= startDate && sessionDate <= endDate
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600'
      case 'booked': return 'text-red-600'
      case 'pending': return 'text-gray-400'
      default: return 'text-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search - Full width on mobile */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by ID, name, or session type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm md:text-base"
          />
        </div>
        
        {/* Filters and Date Range - Stack on mobile */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
            >
              <Filter size={20} />
              <span className="text-sm md:text-base">Filters</span>
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
                    className={`w-full text-left px-3 py-2.5 rounded hover:bg-gray-100 text-sm min-h-[44px] flex items-center ${statusFilter === 'all' ? 'bg-gray-100 font-medium' : ''}`}
                  >
                    All Status
                  </button>
                  <button
                    onClick={() => { setStatusFilter('confirmed'); setShowFilterMenu(false) }}
                    className={`w-full text-left px-3 py-2.5 rounded hover:bg-gray-100 text-sm min-h-[44px] flex items-center ${statusFilter === 'confirmed' ? 'bg-gray-100 font-medium' : ''}`}
                  >
                    Confirmed
                  </button>
                  <button
                    onClick={() => { setStatusFilter('booked'); setShowFilterMenu(false) }}
                    className={`w-full text-left px-3 py-2.5 rounded hover:bg-gray-100 text-sm min-h-[44px] flex items-center ${statusFilter === 'booked' ? 'bg-gray-100 font-medium' : ''}`}
                  >
                    Booked
                  </button>
                  <button
                    onClick={() => { setStatusFilter('pending'); setShowFilterMenu(false) }}
                    className={`w-full text-left px-3 py-2.5 rounded hover:bg-gray-100 text-sm min-h-[44px] flex items-center ${statusFilter === 'pending' ? 'bg-gray-100 font-medium' : ''}`}
                  >
                    Pending
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Date Range - Hidden on mobile, shown on tablet+ */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg whitespace-nowrap">
            <Calendar size={18} className="flex-shrink-0" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="border-none focus:outline-none text-sm w-28"
              placeholder="Start date"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="border-none focus:outline-none text-sm w-28"
              placeholder="End date"
            />
          </div>
        </div>
        
        {/* Add Client Button - Full width on mobile */}
        <button 
          onClick={() => router.push('/dashboard/clients')}
          className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors min-h-[44px] font-medium"
        >
          <Plus size={20} />
          <span>Add Client</span>
        </button>
      </div>

      {/* Table Container with Horizontal Scroll on Mobile */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="text-left p-3 md:p-4">
                  <input type="checkbox" className="rounded w-4 h-4 cursor-pointer" />
                </th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Client ID</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Session Date</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Full Name</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Contact Number</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Session Type</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Total Duration</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Remaining Days</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center p-8 text-gray-500 text-sm md:text-base">Loading...</td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-8 text-gray-500 text-sm md:text-base">No sessions found</td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3 md:p-4">
                      <input type="checkbox" className="rounded w-4 h-4 cursor-pointer" />
                    </td>
                    <td className="p-3 md:p-4">
                      <span className="text-blue-600 font-medium text-xs md:text-sm">{session.client_id}</span>
                    </td>
                    <td className="p-3 md:p-4 text-xs md:text-sm text-gray-600 whitespace-nowrap">
                      {new Date(session.session_date).toLocaleDateString('en-US', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="p-3 md:p-4 text-xs md:text-sm text-gray-900 font-medium">{session.full_name}</td>
                    <td className="p-3 md:p-4 text-xs md:text-sm text-gray-600">{session.phone_number || 'N/A'}</td>
                    <td className="p-3 md:p-4 text-xs md:text-sm text-gray-600">{session.session_type}</td>
                    <td className="p-3 md:p-4 text-xs md:text-sm text-gray-600 font-medium">{session.total_duration}</td>
                    <td className="p-3 md:p-4 text-xs md:text-sm text-gray-600 font-medium">{session.remaining_days}</td>
                    <td className="p-3 md:p-4">
                      <select
                        value={session.status}
                        onChange={(e) => handleStatusChange(session.id, e.target.value as 'booked' | 'confirmed' | 'pending')}
                        className={`text-xs md:text-sm px-2 py-2 min-h-[44px] border border-gray-200 rounded cursor-pointer font-medium ${getStatusColor(session.status)} bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      >
                        <option value="pending">Pending</option>
                        <option value="booked">Booked</option>
                        <option value="confirmed">Confirmed</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
