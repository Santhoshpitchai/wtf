'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import DashboardFooter from '@/components/DashboardFooter'
import { supabase } from '@/lib/supabase'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userRole, setUserRole] = useState<'admin' | 'pt'>('admin')

  useEffect(() => {
    const getUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (userData) {
          setUserRole(userData.role as 'admin' | 'pt')
        }
      }
    }
    getUserRole()
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto w-full lg:w-auto flex flex-col">
        <div className="flex-1 pt-16 lg:pt-0 p-4 md:p-6 lg:p-8">
          {children}
        </div>
        <DashboardFooter userRole={userRole} />
      </main>
    </div>
  )
}
