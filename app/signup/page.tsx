'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Eye, EyeOff, Zap, Mail, CheckCircle } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [role, setRole] = useState<'admin' | 'pt'>('pt')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)

  useEffect(() => {
    const isValid =
      email.length > 0 &&
      password.length >= 6 &&
      confirmPassword.length > 0 &&
      password === confirmPassword &&
      firstName.length > 0 &&
      lastName.length > 0
    setIsFormValid(isValid)
  }, [email, password, confirmPassword, firstName, lastName])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      // For PT role, check if email exists in trainers table
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

      // Sign up the user with metadata
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber,
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        // User record and trainer record (for PT) are automatically created by database trigger
        setSuccess(true)
        setShowEmailVerification(true)

        // Redirect after showing the message
        setTimeout(() => {
          router.push('/')
        }, 5000)
      }
    } catch (err: any) {
      // Check if error is related to PT email validation
      const errorMessage = err.message || 'Failed to create account'
      if (errorMessage.includes('PT email not registered') || errorMessage.includes('not registered')) {
        setError('This email is not registered as a Personal Trainer. Please contact your administrator to register your email first.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Responsive Container */}
      <div className="relative z-10 w-full px-4">
        {/* Mobile: Direct Form */}
        <div className="lg:hidden w-full max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            {/* Logo */}
            <div className="mb-4">
              <div className="w-48 h-24 flex items-center justify-center mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-3 shadow-lg">
                <img
                  src="/wtf-logo-new.png"
                  alt="WTF - Witness The Fitness"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="flex gap-3 mb-4 p-1 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all ${role === 'admin'
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-200'
                  }`}
              >
                ADMIN
              </button>
              <button
                type="button"
                onClick={() => setRole('pt')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all ${role === 'pt'
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-200'
                  }`}
              >
                PT
              </button>
            </div>

            <h1 className="text-2xl font-black mb-2 text-gray-900">Create your account</h1>
            <p className="text-gray-600 mb-4 flex items-center gap-2 text-sm">
              <Zap className="w-3 h-3 text-orange-500" />
              Start your fitness transformation today
            </p>

            {error && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs">
                {error}
              </div>
            )}

            {success && showEmailVerification && (
              <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-green-900 mb-1">Account Created!</p>
                    <p className="text-green-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Check your email to verify
                    </p>
                    <p className="text-gray-600 text-xs">
                      Redirecting...
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                  required
                />
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="Phone Number (optional)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className={`w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isFormValid && !loading
                  ? 'bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 shadow-lg'
                  : 'bg-gray-400'
                  }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating account...
                  </span>
                ) : (
                  'Sign up'
                )}
              </button>
            </form>

            <div className="mt-4 text-center text-xs text-gray-600">
              Already have an account?{' '}
              <Link href="/" className="font-bold text-transparent bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text hover:from-orange-600 hover:to-purple-700 transition-all">
                Sign in →
              </Link>
            </div>

            {/* Footer - Mobile View */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                Built with <span className="text-red-500">❤️</span> at{' '}
                <span className="font-semibold text-purple-600">Dscape</span> by{' '}
                <span className="font-semibold text-gray-700">Santhosh Pitchai</span>
              </p>
            </div>
          </div>
        </div>

        {/* Desktop: Phone Mockup - Same content in phone frame */}
        <div className="hidden lg:block">
          <div className="relative w-[380px] h-[780px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-8 border-slate-800 mx-auto">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-900 rounded-b-3xl z-20"></div>
            <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-12 bg-white z-10 flex items-center justify-between px-8 pt-2">
                <span className="text-xs font-semibold text-gray-900">9:41</span>
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
              <div className="h-full overflow-y-auto pt-12 pb-6 px-6">
                {/* Duplicate form content for desktop phone view */}
                <div className="mb-4">
                  <div className="w-48 h-24 flex items-center justify-center mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-3 shadow-lg">
                    <img src="/wtf-logo-new.png" alt="WTF - Witness The Fitness" className="w-full h-auto object-contain" />
                  </div>
                </div>
                <div className="flex gap-3 mb-4 p-1 bg-gray-100 rounded-2xl">
                  <button type="button" onClick={() => setRole('admin')} className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all ${role === 'admin' ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-200'}`}>ADMIN</button>
                  <button type="button" onClick={() => setRole('pt')} className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all ${role === 'pt' ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-200'}`}>PT</button>
                </div>
                <h1 className="text-2xl font-black mb-2 text-gray-900">Create your account</h1>
                <p className="text-gray-600 mb-4 flex items-center gap-2 text-sm"><Zap className="w-3 h-3 text-orange-500" />Start your fitness transformation today</p>
                {error && <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs">{error}</div>}
                {success && showEmailVerification && (
                  <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl text-xs">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-green-900 mb-1">Account Created!</p>
                        <p className="text-green-700 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" />Check your email to verify</p>
                        <p className="text-gray-600 text-xs">Redirecting...</p>
                      </div>
                    </div>
                  </div>
                )}
                <form onSubmit={handleSignup} className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm" required />
                    <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm" required />
                  </div>
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm" required />
                  <input type="tel" placeholder="Phone Number (optional)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm" />
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm" required />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                  <button type="submit" disabled={loading || !isFormValid} className={`w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isFormValid && !loading ? 'bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 shadow-lg' : 'bg-gray-400'}`}>
                    {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Creating account...</span> : 'Sign up'}
                  </button>
                </form>
                <div className="mt-4 text-center text-xs text-gray-600">Already have an account? <Link href="/" className="font-bold text-transparent bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text hover:from-orange-600 hover:to-purple-700 transition-all">Sign in →</Link></div>

                {/* Footer - Desktop Phone Mockup */}
                <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-500">
                    Built with <span className="text-red-500">❤️</span> at{' '}
                    <span className="font-semibold text-purple-600">Dscape</span> by{' '}
                    <span className="font-semibold text-gray-700">Santhosh Pitchai</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
