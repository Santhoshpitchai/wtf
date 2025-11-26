'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'
import SplashScreen from '@/components/SplashScreen'

export default function LoginPage() {
  const router = useRouter()
  const [showSplash, setShowSplash] = useState(true)
  const [role, setRole] = useState<'admin' | 'pt'>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isFormValid, setIsFormValid] = useState(false)

  useEffect(() => {
    // Hide splash screen after 3.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    setIsFormValid(email.length > 0 && password.length > 0)
  }, [email, password])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // For PT role, check if email exists in trainers table before attempting login
      if (role === 'pt') {
        const { data: isRegistered, error: checkError } = await supabase
          .rpc('is_pt_email_registered', { pt_email: email })

        if (checkError) {
          throw new Error('Failed to verify PT email. Please try again.')
        }

        if (!isRegistered) {
          setError('This email is not registered as a Personal Trainer. Please contact your administrator to register your email first.')
          setLoading(false)
          return
        }
      }

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

      // For PT users, verify they have a trainer record
      if (role === 'pt') {
        const { data: trainerData, error: trainerError } = await supabase
          .from('trainers')
          .select('id, status')
          .eq('email', email)
          .single()

        if (trainerError || !trainerData) {
          setError('No trainer record found. Please contact your administrator.')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        if (trainerData.status !== 'active') {
          setError('Your trainer account is inactive. Please contact your administrator.')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }
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
    <>
      {showSplash && <SplashScreen />}
      <div className={`min-h-screen flex relative overflow-hidden transition-opacity duration-1000 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Left side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative z-10">
          <div className="w-full max-w-md animate-fade-in">
            {/* Logo */}
            <div className="mb-10">
              <div className="w-56 h-28 flex items-center justify-center mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 shadow-lg">
                <img
                  src="/wtf-logo-new.png"
                  alt="WTF - Witness The Fitness"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="flex gap-3 mb-8 p-1 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-300 transform ${role === 'admin'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  ADMIN
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole('pt')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-300 transform ${role === 'pt'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  PT
                </span>
              </button>
            </div>

            <h1 className="text-4xl font-black mb-2 text-gray-900">Login to your account</h1>
            <p className="text-gray-500 text-sm mb-8">Welcome back! Please enter your details</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm animate-shake">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 group-hover:border-gray-300"
                  required
                />
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 group-hover:border-gray-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-lg hover:bg-blue-50"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/signup" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
          {/* Animated gradient orbs */}
          <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="text-center text-white max-w-lg relative z-10">
            <div className="w-64 h-64 mx-auto mb-12 bg-gradient-to-br from-slate-800 to-slate-700 rounded-[3rem] flex items-center justify-center shadow-2xl border border-slate-700/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <svg className="w-32 h-32 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-5xl font-black mb-6 leading-tight">
              The perfect analytics tool
              <span className="block bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                for your business
              </span>
            </h2>
            <p className="text-xl text-slate-400 mb-10 leading-relaxed">
              Track progress, manage clients, and achieve goals with powerful real-time analytics and insights
            </p>
            <div className="flex gap-3 justify-center">
              <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-3 h-3 bg-slate-600 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>

        <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .delay-100 {
          animation-delay: 0.1s;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
      </div>
    </>
  )
}
