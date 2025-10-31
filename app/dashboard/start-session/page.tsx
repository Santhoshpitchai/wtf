'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Filter, Calendar, Plus, Star } from 'lucide-react'
import type { Client } from '@/types'

export default function StartSessionPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center p-8 text-gray-500">Loading...</div>
        ) : clients.length === 0 ? (
          <div className="col-span-3 text-center p-8 text-gray-500">No clients found</div>
        ) : (
          clients.map((client) => (
            <div key={client.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                  {client.full_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{client.full_name}</h3>
                    <span className="text-blue-500">✓</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span>4.3 (18 Reviews)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Session Type</div>
                  <div className="text-sm font-medium">1/23 MILES AWAY</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Total Days</div>
                  <div className="text-sm font-medium">AVERAGE DAILY RATE</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  START
                </button>
                <button className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark">
                  END
                </button>
              </div>

              <div className="mt-4 text-center">
                <span className="text-sm text-green-600">Session Completed</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
