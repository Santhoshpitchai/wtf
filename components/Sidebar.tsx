'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, DollarSign, Calendar, Play, UserCircle, BarChart3, UserPlus, LogOut, Dumbbell, Menu, X, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getCurrentUser } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'

// Admin has access to trainer management and overview features
const adminMenuItems = [
  { name: 'Personal Trainers', href: '/dashboard/trainers', icon: UserCircle },
  { name: 'Client Details', href: '/dashboard/clients', icon: Users },
  { name: 'PT Sales', href: '/dashboard/sales', icon: BarChart3 },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
  { name: 'Create PT', href: '/dashboard/create-pt', icon: UserPlus },
]

// PT has access to client management, payments, and sessions
const ptMenuItems = [
  { name: 'Client Details', href: '/dashboard/clients', icon: Users },
  { name: 'Payments', href: '/dashboard/payments', icon: DollarSign },
  { name: 'Sessions', href: '/dashboard/sessions', icon: Calendar },
  { name: 'Start Session', href: '/dashboard/start-session', icon: Play },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const currentUser = await getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const menuItems = user?.role === 'admin' ? adminMenuItems : ptMenuItems

  return (
    <>
      {/* Mobile Menu Button - Minimum 44x44px touch target */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-2xl border border-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center hover:from-slate-800 hover:to-slate-700 transition-all duration-200"
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileMenuOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
      </button>

      {/* Overlay for mobile - z-40 to sit below sidebar (z-50) but above content */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - z-50 to sit above overlay (z-40) */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen flex flex-col shadow-2xl
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 pb-8 border-b border-slate-700/50">
          <div className="flex items-center justify-center">
            <img
              src="/wtf-logo-new.png"
              alt="WTF - Witness The Fitness"
              className="w-full h-auto max-w-[180px] object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 min-h-[44px] group ${isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                  }`}
              >
                <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
                <span className="text-sm font-semibold">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-700/50 mt-auto bg-slate-900/50">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <UserCircle size={28} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">
                {loading ? 'Loading...' : user?.role === 'admin' ? 'Admin' : 'Personal Trainer'}
              </div>
              {user?.email && (
                <div className="text-xs text-slate-400 truncate max-w-full">{user.email}</div>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-all duration-200 min-h-[44px] border border-red-500/20 hover:border-red-500/30"
            aria-label="Logout"
          >
            <LogOut size={16} />
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}
