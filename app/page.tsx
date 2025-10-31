'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<'admin' | 'pt'>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isFormValid, setIsFormValid] = useState(false)

  useEffect(() => {
    setIsFormValid(email.length > 0 && password.length > 0)
  }, [email, password])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      // Check user role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user?.id)
        .single()

      if (userError) throw userError

      if (userData.role !== role) {
        setError(`Please select the correct role. You are registered as ${userData.role}.`)
        await supabase.auth.signOut()
        return
      }

      // Redirect based on role
      if (role === 'admin') {
        router.push('/dashboard/clients')
      } else {
        router.push('/dashboard/clients')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">WTF</div>
                <div className="text-xs text-gray-600 uppercase">Witness The Fitness</div>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="flex gap-4 mb-8">
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`flex-1 py-3 rounded-full font-semibold transition-all ${
                role === 'admin'
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              ADMIN
            </button>
            <button
              type="button"
              onClick={() => setRole('pt')}
              className={`flex-1 py-3 rounded-full font-semibold transition-all ${
                role === 'pt'
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              PT
            </button>
          </div>

          <h1 className="text-3xl font-bold mb-2 text-gray-900">Login to your account</h1>
          <p className="text-orange-500 text-sm mb-8 flex items-center gap-1">
            <span>⚡</span> Power up your fitness journey
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-purple-600 hover:underline">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium text-white bg-gray-400 hover:bg-gray-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-orange-500 hover:underline font-medium">
              Get Started →
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-gradient-to-br from-purple-600 to-purple-800">
        <div className="text-center text-white max-w-lg">
          <div className="w-48 h-48 mx-auto mb-8 bg-purple-700/50 rounded-3xl flex items-center justify-center">
            <TrendingUp className="w-24 h-24 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-5xl font-bold mb-4">
            Transform Your
            <span className="block text-orange-400">
              Fitness Journey
            </span>
          </h2>
          <p className="text-lg text-purple-200 mb-8">
            Track progress, manage clients, and achieve goals with powerful analytics
          </p>
          <div className="flex gap-2 justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
