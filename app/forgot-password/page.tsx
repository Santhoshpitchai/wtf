'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Mail, ArrowLeft, Dumbbell, CheckCircle, Zap } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) throw resetError

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 to-green-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        
        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-8">
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

          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to login
          </Link>

          <h1 className="text-3xl font-black mb-2 text-gray-900">Reset your password</h1>
          <p className="text-gray-600 mb-8 flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            We'll send you a reset link
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-green-900 mb-1">Check your email!</p>
                  <p className="text-green-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  <p className="text-gray-600 text-xs">
                    Click the link in the email to reset your password. The link will expire in 1 hour.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                required
                disabled={success}
              />
            </div>

            <button
              type="submit"
              disabled={loading || success || !email}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                email && !loading && !success
                  ? 'bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60'
                  : 'bg-gray-400'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </span>
              ) : success ? (
                'Email Sent!'
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {success && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                className="text-sm text-purple-600 hover:text-orange-500 font-semibold transition-colors"
              >
                Send to a different email
              </button>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-gray-600">
            Remember your password?{' '}
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
            <Mail className="w-32 h-32 text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-5xl font-black mb-4 leading-tight">
            Don't Worry,
            <span className="block bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
              We've Got You
            </span>
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Reset your password and get back to crushing your fitness goals
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
