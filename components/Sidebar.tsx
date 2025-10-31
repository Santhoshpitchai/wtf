'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, DollarSign, Calendar, Play, UserCircle, BarChart3, UserPlus, LogOut, Dumbbell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const menuItems = [
  { name: 'Personal Trainers', href: '/dashboard/trainers', icon: UserCircle },
  { name: 'Client Details', href: '/dashboard/clients', icon: Users },
  { name: 'PT Sales', href: '/dashboard/sales', icon: BarChart3 },
  { name: 'Create PT', href: '/dashboard/create-pt', icon: UserPlus },
  { name: 'Payments', href: '/dashboard/payments', icon: DollarSign },
  { name: 'Sessions', href: '/dashboard/sessions', icon: Calendar },
  { name: 'Start Session', href: '/dashboard/start-session', icon: Play },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <UserCircle size={24} className="text-gray-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">Personal Trainer</div>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
            >
              <LogOut size={12} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
