'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Filter, Calendar, Plus } from 'lucide-react'
import type { Session } from '@/types'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          client:clients(client_id, full_name, phone_number)
        `)
        .order('session_date', { ascending: false })

      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

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
              <th className="text-left p-4 text-sm font-medium text-gray-700">Session Date</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Full Name</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Contact Number</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Session Type</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Total Duration</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Remaining Days</th>
              <th className="text-left p-4 text-sm font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center p-8 text-gray-500">Loading...</td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center p-8 text-gray-500">No sessions found</td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4"><input type="checkbox" className="rounded" /></td>
                  <td className="p-4">
                    <span className="text-blue-600 font-medium">{session.client?.client_id}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(session.session_date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm text-gray-900">{session.client?.full_name}</td>
                  <td className="p-4 text-sm text-gray-600">{session.client?.phone_number || '1234567899'}</td>
                  <td className="p-4 text-sm text-gray-600">{session.session_type}</td>
                  <td className="p-4 text-sm text-gray-600">${session.total_duration || 0}</td>
                  <td className="p-4 text-sm text-gray-600">${session.remaining_days || 0}</td>
                  <td className="p-4">
                    <span className={`text-sm ${getStatusColor(session.status)}`}>
                      {getStatusText(session.status)}
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
