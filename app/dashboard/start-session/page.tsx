'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Filter, Calendar, Plus, Play, Square } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Client } from '@/types'
import { getCurrentUser } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'

interface ClientWithSession extends Client {
  total_duration: number
  remaining_days: number
  session_status: 'not_started' | 'in_progress' | 'completed'
  session_start_time?: string
}

export default function StartSessionPage() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientWithSession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
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

  const fetchClients = async (user: AuthUser | null) => {
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      // If PT, filter to only show their clients
      if (user?.role === 'pt' && user.trainer_id) {
        query = query.eq('trainer_id', user.trainer_id)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform clients with session data
      const clientsWithSessions: ClientWithSession[] = (data || []).map((client: Client) => {
        const totalDuration = calculateSessionDuration(client.session_type || '')
        const remainingDays = calculateRemainingDays(client.created_at, totalDuration)
        
        return {
          ...client,
          total_duration: totalDuration,
          remaining_days: remainingDays,
          session_status: 'not_started' as 'not_started'
        }
      })

      setClients(clientsWithSessions)
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = (clientId: string) => {
    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { ...client, session_status: 'in_progress', session_start_time: new Date().toISOString() }
        : client
    ))
  }

  const handleEndSession = (clientId: string) => {
    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { ...client, session_status: 'completed', session_start_time: undefined }
        : client
    ))
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = searchTerm === '' || 
      client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.client_id.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by ID, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg whitespace-nowrap">
            <Calendar size={18} className="flex-shrink-0" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="border-none focus:outline-none text-sm w-28"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="border-none focus:outline-none text-sm w-28"
            />
          </div>
        </div>
        
        <button 
          onClick={() => router.push('/dashboard/clients')}
          className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <Plus size={20} />
          <span>Add Client</span>
        </button>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {loading ? (
          <div className="col-span-full text-center p-8 text-gray-500">Loading clients...</div>
        ) : filteredClients.length === 0 ? (
          <div className="col-span-full text-center p-8 text-gray-500">
            {searchTerm ? 'No clients match your search' : 'No active clients found'}
          </div>
        ) : (
          filteredClients.map((client) => (
            <div 
              key={client.id} 
              className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-5 border-2 ${
                client.session_status === 'in_progress' 
                  ? 'border-teal-500' 
                  : client.session_status === 'completed'
                  ? 'border-green-500'
                  : 'border-transparent'
              }`}
            >
              {/* Client Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {client.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{client.full_name}</h3>
                    <span className="text-teal-500 flex-shrink-0">✓</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ID: {client.client_id}
                  </div>
                </div>
              </div>

              {/* Session Info */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Session Type</div>
                  <div className="text-sm font-semibold text-gray-900">{client.session_type || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Days Left</div>
                  <div className="text-sm font-semibold text-gray-900">{client.remaining_days} days</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-3">
                {client.session_status === 'not_started' && (
                  <>
                    <button 
                      onClick={() => handleStartSession(client.id)}
                      className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Play size={16} />
                      START
                    </button>
                    <button 
                      disabled
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                    >
                      END
                    </button>
                  </>
                )}
                
                {client.session_status === 'in_progress' && (
                  <>
                    <button 
                      disabled
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                    >
                      START
                    </button>
                    <button 
                      onClick={() => handleEndSession(client.id)}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Square size={16} />
                      END
                    </button>
                  </>
                )}
                
                {client.session_status === 'completed' && (
                  <>
                    <button 
                      onClick={() => handleStartSession(client.id)}
                      className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Play size={16} />
                      RESTART
                    </button>
                    <button 
                      disabled
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                    >
                      END
                    </button>
                  </>
                )}
              </div>

              {/* Status Badge */}
              <div className="text-center">
                {client.session_status === 'not_started' && (
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    Ready to Start
                  </span>
                )}
                {client.session_status === 'in_progress' && (
                  <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full animate-pulse">
                    Session In Progress
                  </span>
                )}
                {client.session_status === 'completed' && (
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    ✓ Session Completed
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
