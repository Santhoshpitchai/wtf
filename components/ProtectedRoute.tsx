'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { AuthUser } from '@/lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: ('admin' | 'pt')[]
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/dashboard/clients' 
}: ProtectedRouteProps) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      router.push('/')
      return
    }

    if (!allowedRoles.includes(currentUser.role)) {
      router.push(redirectTo)
      return
    }

    // Additional check for PT users - ensure they have a valid trainer record
    if (currentUser.role === 'pt') {
      const { data: trainerData, error: trainerError } = await supabase
        .from('trainers')
        .select('id, status, email')
        .eq('email', currentUser.email)
        .single()

      if (trainerError || !trainerData) {
        // No trainer record found, sign out and redirect
        await supabase.auth.signOut()
        router.push('/')
        return
      }

      if (trainerData.status !== 'active') {
        // Trainer account is inactive, sign out and redirect
        await supabase.auth.signOut()
        router.push('/')
        return
      }
    }

    setUser(currentUser)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
