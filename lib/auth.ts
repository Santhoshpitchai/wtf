import { supabase } from './supabase'
import type { User } from '@/types'

export interface AuthUser extends User {
  trainer_id?: string
}

/**
 * Get the current authenticated user with their role and trainer info
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    // Get user details from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError || !userData) return null

    // If user is a PT, get their trainer_id
    let trainer_id: string | undefined
    if (userData.role === 'pt') {
      const { data: trainerData } = await supabase
        .from('trainers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      trainer_id = trainerData?.id
    }

    return {
      ...userData,
      trainer_id
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'admin'
}

/**
 * Check if the current user is a PT
 */
export async function isPT(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'pt'
}

/**
 * Get the trainer ID for the current PT user
 */
export async function getCurrentTrainerId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.trainer_id || null
}
