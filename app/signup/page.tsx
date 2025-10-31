'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Eye, EyeOff, Dumbbell, Zap, Mail, CheckCircle } from 'lucide-react'

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
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Left side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 to-green-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl shadow-lg">
                <Dumbbell className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-4xl font-black bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  WTF
                </div>
                <div className="text-xs font-bold text-gray-600 tracking-wider">
                  WITNESS THE FITNESS
                </div>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all transform hover:scale-105 ${
                role === 'admin'
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ADMIN
            </button>
            <button
              type="button"
              onClick={() => setRole('pt')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all transform hover:scale-105 ${
                role === 'pt'
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              PT
            </button>
          </div>

          <h1 className="text-3xl font-black mb-2 text-gray-900">Create your account</h1>
          <p className="text-gray-600 mb-6 flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            Start your fitness transformation today
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && showEmailVerification && (
            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl text-sm animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-green-900 mb-1">Account Created Successfully!</p>
                  <p className="text-green-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Please check your email to verify your account
                  </p>
                  <p className="text-gray-600 text-xs">
                    Redirecting to login page...
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                required
              />
            </div>

            <div>
              <input
                type="tel"
                placeholder="Phone Number (optional)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                isFormValid && !loading
                  ? 'bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60'
                  : 'bg-gray-400'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </span>
              ) : (
                'Sign up'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/" className="font-bold text-transparent bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text hover:from-orange-600 hover:to-purple-700 transition-all">
              Sign in →
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-purple-600/20 to-blue-600/20"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-orange-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
        
        <div className="text-center text-white max-w-lg relative z-10">
          <div className="w-64 h-64 mx-auto mb-8 bg-white/10 backdrop-blur-lg rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
            <Dumbbell className="w-32 h-32 text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-5xl font-black mb-4 leading-tight">
            Join The
            <span className="block bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
              Fitness Revolution
            </span>
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Create your account and start transforming lives today
          </p>
          <div className="flex gap-3 justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="w-3 h-3 bg-white/30 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
