'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { HelpCircle, Shield, FileText, Mail, Phone, RefreshCw } from 'lucide-react'

interface DashboardFooterProps {
  userRole: 'admin' | 'pt'
}

export default function DashboardFooter({ userRole }: DashboardFooterProps) {
  const [stats, setStats] = useState({
    activeClients: 0,
    sessionsThisMonth: 0,
    revenue: 0,
    pendingInvoices: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [userRole])

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current month start date
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      if (userRole === 'admin') {
        // Admin stats - all clients and sessions
        const [clientsRes, sessionsRes, invoicesRes] = await Promise.all([
          supabase.from('clients').select('id', { count: 'exact' }),
          supabase
            .from('sessions')
            .select('id', { count: 'exact' })
            .gte('session_date', monthStart.toISOString()),
          supabase.from('invoices').select('amount, status'),
        ])

        const pendingInvoices = invoicesRes.data?.filter(
          (inv) => inv.status === 'pending'
        ).length || 0

        const totalRevenue = invoicesRes.data
          ?.filter((inv) => inv.status === 'paid')
          .reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

        setStats({
          activeClients: clientsRes.count || 0,
          sessionsThisMonth: sessionsRes.count || 0,
          revenue: totalRevenue,
          pendingInvoices,
        })
      } else {
        // PT stats - only their clients and sessions
        const { data: trainer } = await supabase
          .from('trainers')
          .select('id')
          .eq('email', user.email)
          .single()

        if (trainer) {
          const [clientsRes, sessionsRes, invoicesRes] = await Promise.all([
            supabase
              .from('clients')
              .select('id', { count: 'exact' })
              .eq('trainer_id', trainer.id),
            supabase
              .from('sessions')
              .select('id', { count: 'exact' })
              .eq('trainer_id', trainer.id)
              .gte('session_date', monthStart.toISOString()),
            supabase
              .from('invoices')
              .select('amount, status')
              .eq('trainer_id', trainer.id),
          ])

          const pendingInvoices = invoicesRes.data?.filter(
            (inv) => inv.status === 'pending'
          ).length || 0

          const totalRevenue = invoicesRes.data
            ?.filter((inv) => inv.status === 'paid')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

          setStats({
            activeClients: clientsRes.count || 0,
            sessionsThisMonth: sessionsRes.count || 0,
            revenue: totalRevenue,
            pendingInvoices,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching footer stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-end items-center mb-2">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Active Clients</p>
              <p className="text-lg font-bold text-gray-900">
                {loading ? '...' : stats.activeClients}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Sessions (MTD)</p>
              <p className="text-lg font-bold text-gray-900">
                {loading ? '...' : stats.sessionsThisMonth}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Revenue (MTD)</p>
              <p className="text-lg font-bold text-green-600">
                {loading ? '...' : `$${stats.revenue.toFixed(2)}`}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Pending Invoices</p>
              <p className="text-lg font-bold text-orange-600">
                {loading ? '...' : stats.pendingInvoices}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard/help"
                  className="text-sm text-gray-600 hover:text-cyan-600 transition-colors flex items-center gap-2"
                >
                  <HelpCircle size={14} />
                  Help & Support
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/privacy"
                  className="text-sm text-gray-600 hover:text-cyan-600 transition-colors flex items-center gap-2"
                >
                  <Shield size={14} />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/terms"
                  className="text-sm text-gray-600 hover:text-cyan-600 transition-colors flex items-center gap-2"
                >
                  <FileText size={14} />
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Us</h3>
            <ul className="space-y-2">
              <li className="text-sm text-gray-600 flex items-center gap-2">
                <Mail size={14} />
                <a
                  href="mailto:info@dscape.co"
                  className="hover:text-cyan-600 transition-colors"
                >
                  info@dscape.co
                </a>
              </li>
              <li className="text-sm text-gray-600 flex items-center gap-2">
                <Phone size={14} />
                <a
                  href="tel:+919945299618"
                  className="hover:text-cyan-600 transition-colors"
                >
                  +91 99452 99618
                </a>
              </li>
              <li className="text-sm text-gray-600">
                <span className="font-medium">Hours:</span> Mon-Fri, 9AM-6PM IST
              </li>
            </ul>
          </div>

          {/* System Info & Branding */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">System Info</h3>
            <ul className="space-y-2">
              <li className="text-sm text-gray-600">
                <span className="font-medium">Version:</span> 1.2.0
              </li>
              <li className="text-sm text-gray-600">
                <span className="font-medium">Status:</span>{' '}
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Online
                </span>
              </li>
              <li className="text-sm text-gray-600">
                <span className="font-medium">Role:</span>{' '}
                <span className="capitalize font-semibold text-cyan-600">
                  {userRole === 'admin' ? 'Administrator' : 'Personal Trainer'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} WTF - Witness The Fitness. All rights reserved.
            </p>
            <p className="text-xs text-gray-500">
              Built with <span className="text-red-500">❤️</span> at{' '}
              <span className="font-semibold text-cyan-600">Dscape</span> by{' '}
              <span className="font-semibold text-gray-700">Santhosh Pitchai</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
