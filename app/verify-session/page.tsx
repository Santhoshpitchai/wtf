'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

function VerifySessionContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token')

    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired' | 'already_approved'>('loading')
    const [message, setMessage] = useState('')
    const [clientName, setClientName] = useState('')
    const [trainerName, setTrainerName] = useState('')

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage('Invalid verification link. The link appears to be incomplete or malformed.')
            return
        }

        verifySession()
    }, [token])

    const verifySession = async () => {
        try {
            const response = await fetch('/api/verify-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            })

            const data = await response.json()

            if (response.ok) {
                setStatus('success')
                setMessage('Session approved successfully! Your trainer will be notified and can now start your session.')
                setClientName(data.client?.full_name || '')
                setTrainerName(`${data.trainer?.first_name || ''} ${data.trainer?.last_name || ''}`.trim())
            } else {
                if (data.expired) {
                    setStatus('expired')
                    setMessage(data.error || 'This verification link has expired. Please ask your trainer to send a new one.')
                } else if (data.alreadyApproved) {
                    setStatus('already_approved')
                    setMessage(data.error || 'This session has already been approved.')
                } else {
                    setStatus('error')
                    setMessage(data.error || 'Failed to verify session. Please try again or contact your trainer.')
                }
            }
        } catch (error) {
            console.error('Error verifying session:', error)
            setStatus('error')
            setMessage('A network error occurred while verifying your session. Please check your internet connection and try again.')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-cyan-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full mb-4">
                        <span className="text-white font-bold text-2xl">W</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Session Verification</h1>
                </div>

                {/* Status Content */}
                <div className="text-center">
                    {status === 'loading' && (
                        <div className="py-8">
                            <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mx-auto mb-4" />
                            <p className="text-gray-600 text-lg">Verifying your session...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="py-8">
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
                            <p className="text-gray-600 mb-6">{message}</p>

                            {clientName && trainerName && (
                                <div className="bg-cyan-50 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-gray-600 mb-1">Client</p>
                                    <p className="font-semibold text-gray-900 mb-3">{clientName}</p>
                                    <p className="text-sm text-gray-600 mb-1">Trainer</p>
                                    <p className="font-semibold text-gray-900">{trainerName}</p>
                                </div>
                            )}

                            <p className="text-sm text-gray-500">
                                You can close this window now.
                            </p>
                        </div>
                    )}

                    {status === 'expired' && (
                        <div className="py-8">
                            <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Expired</h2>
                            <p className="text-gray-600 mb-6">{message}</p>
                            <div className="bg-amber-50 rounded-lg p-4 mb-4">
                                <p className="text-sm text-gray-700 mb-2">
                                    <strong>What happened?</strong>
                                </p>
                                <p className="text-sm text-gray-600">
                                    Verification links are valid for 30 minutes only for security reasons.
                                </p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-sm text-gray-700 mb-2">
                                    <strong>Next steps:</strong>
                                </p>
                                <p className="text-sm text-gray-600">
                                    Contact your trainer to request a new verification link.
                                </p>
                            </div>
                        </div>
                    )}

                    {status === 'already_approved' && (
                        <div className="py-8">
                            <CheckCircle2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Already Approved</h2>
                            <p className="text-gray-600 mb-6">{message}</p>
                            <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-sm text-gray-700 mb-2">
                                    <strong>What this means:</strong>
                                </p>
                                <p className="text-sm text-gray-600">
                                    This session has already been verified. Your trainer has been notified and no further action is needed.
                                </p>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="py-8">
                            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Failed</h2>
                            <p className="text-gray-600 mb-6">{message}</p>
                            <div className="bg-red-50 rounded-lg p-4">
                                <p className="text-sm text-gray-700 mb-2">
                                    <strong>What to do next:</strong>
                                </p>
                                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                                    <li>Check that you clicked the correct link from your email</li>
                                    <li>Ensure you have a stable internet connection</li>
                                    <li>Contact your trainer for a new verification link</li>
                                    <li>If the problem persists, contact support</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-500">
                        WTF Fitness - Session Management System
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function VerifySessionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-cyan-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center py-8">
                        <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">Loading...</p>
                    </div>
                </div>
            </div>
        }>
            <VerifySessionContent />
        </Suspense>
    )
}
