'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, DollarSign, Calendar, Play, UserCircle, BarChart3, UserPlus, LogOut, Dumbbell, Menu, X } from 'lucide-react'
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
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              <span className="text-gray-800">WTF</span>
            </div>
            <div className="text-xs text-gray-600">
              <div>WITNESS THE</div>
              <div>FITNESS</div>
            </div>
          </div>
        </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 mt-auto">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
            <UserCircle size={24} className="text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {loading ? 'Loading...' : user?.role === 'admin' ? 'Admin' : 'Personal Trainer'}
            </div>
            {user?.email && (
              <div className="text-xs text-gray-500 truncate max-w-full">{user.email}</div>
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 mt-2 transition-colors"
            >
              <LogOut size={12} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
