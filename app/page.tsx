'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import SplashScreen from '@/components/SplashScreen'
import { formatTime } from '@/lib/utils'

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
  const [currentTime, setCurrentTime] = useState(formatTime())

  useEffect(() => {
    // Hide splash screen - start fading at 2500ms for seamless transition
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Update time every 60 seconds
    const interval = setInterval(() => {
      setCurrentTime(formatTime())
    }, 60000)

    return () => clearInterval(interval)
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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Enhanced Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-spin-slow"></div>
          
          {/* Floating Particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400/40 rounded-full animate-float"></div>
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-blue-400/30 rounded-full animate-float-delayed"></div>
          <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-cyan-300/40 rounded-full animate-float"></div>
          <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-blue-300/30 rounded-full animate-float-delayed"></div>
        </div>

        {/* Responsive Container */}
        <div className="relative z-10 w-full px-4">
          {/* Mobile: Direct Form | Desktop: Phone Mockup */}
          <div className="lg:hidden w-full max-w-md mx-auto">
            {/* Mobile View - Direct Form with Glassmorphism */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 hover:shadow-cyan-500/10 hover:shadow-3xl transition-all duration-500">
              <div className="animate-fade-in">
                {/* Logo */}
                <div className="mb-6">
                  <div className="w-48 h-24 flex items-center justify-center mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-3 shadow-lg">
                    <img
                      src="/wtf-logo-new.png"
                      alt="WTF - Witness The Fitness"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div className="flex gap-3 mb-6 p-1 bg-gray-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all duration-300 ${role === 'admin'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <span className="flex items-center justify-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      ADMIN
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('pt')}
                    className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all duration-300 ${role === 'pt'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <span className="flex items-center justify-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      PT
                    </span>
                  </button>
                </div>

                <h1 className="text-2xl font-black mb-2 text-gray-900">Login to your account</h1>
                <p className="text-gray-500 text-sm mb-6">Welcome back! Please enter your details</p>

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

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-cyan-600">Email</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 text-sm hover:border-gray-300 hover:shadow-md bg-white/50"
                      required
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-cyan-600">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 text-sm hover:border-gray-300 hover:shadow-md bg-white/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-600 transition-all duration-200 hover:scale-110"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-600">Remember me</span>
                    </label>
                    <Link href="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                      Forgot Password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/50 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/signup" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                      Sign up for free
                    </Link>
                  </p>
                </div>

                {/* Footer - Mobile View */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-500">
                    Built with <span className="text-red-500">❤️</span> at{' '}
                    <span className="font-semibold text-cyan-600">Dscape</span> by{' '}
                    <span className="font-semibold text-gray-700">Santhosh Pitchai</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Phone Mockup */}
          <div className="hidden lg:block">
            <div className="relative w-[380px] h-[780px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-8 border-slate-800 mx-auto">
              {/* Phone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-900 rounded-b-3xl z-20"></div>
              
              {/* Phone Screen */}
              <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                {/* Status Bar */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-white z-10 flex items-center justify-between px-8 pt-2">
                  <span className="text-xs font-semibold text-gray-900">{currentTime}</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                    </svg>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="h-full overflow-y-auto pt-12 pb-6 px-6">
                  <div className="animate-fade-in">
                    {/* Same content as mobile but inside phone frame */}
                    {/* Logo */}
                    <div className="mb-6">
                      <div className="w-48 h-24 flex items-center justify-center mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-3 shadow-lg">
                        <img
                          src="/wtf-logo-new.png"
                          alt="WTF - Witness The Fitness"
                          className="w-full h-auto object-contain"
                        />
                      </div>
                    </div>

                    {/* Role Selection */}
                    <div className="flex gap-3 mb-6 p-1 bg-gray-100 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setRole('admin')}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all duration-300 ${role === 'admin'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                          : 'text-gray-600 hover:text-gray-900'
                          }`}
                      >
                        <span className="flex items-center justify-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          ADMIN
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('pt')}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all duration-300 ${role === 'pt'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                          : 'text-gray-600 hover:text-gray-900'
                          }`}
                      >
                        <span className="flex items-center justify-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          PT
                        </span>
                      </button>
                    </div>

                    <h1 className="text-2xl font-black mb-2 text-gray-900">Login to your account</h1>
                    <p className="text-gray-500 text-sm mb-6">Welcome back! Please enter your details</p>

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

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
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
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-sm font-medium text-gray-600">Remember me</span>
                        </label>
                        <Link href="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                          Forgot Password?
                        </Link>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !isFormValid}
                        className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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

                    <div className="mt-6 text-center">
                      <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link href="/signup" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                          Sign up for free
                        </Link>
                      </p>
                    </div>

                    {/* Footer - Desktop Phone Mockup */}
                    <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                      <p className="text-xs text-gray-500">
                        Built with <span className="text-red-500">❤️</span> at{' '}
                        <span className="font-semibold text-cyan-600">Dscape</span> by{' '}
                        <span className="font-semibold text-gray-700">Santhosh Pitchai</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Outside (for full page background) */}
        <div className="absolute bottom-4 left-0 right-0 text-center z-20 px-4 lg:hidden">
          <p className="text-xs text-gray-300/90 font-medium">
            Built with <span className="text-red-400">❤️</span> at{' '}
            <span className="font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Dscape
            </span>{' '}
            by <span className="font-bold text-white">Santhosh Pitchai</span>
          </p>
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

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-30px) translateX(-15px);
            opacity: 0.5;
          }
        }

        @keyframes spin-slow {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
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
