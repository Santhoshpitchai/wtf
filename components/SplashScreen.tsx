'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SplashScreen() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)
  const [animationPhase, setAnimationPhase] = useState(0)

  useEffect(() => {
    // Animation sequence
    const timer1 = setTimeout(() => setAnimationPhase(1), 500)
    const timer2 = setTimeout(() => setAnimationPhase(2), 1500)
    const timer3 = setTimeout(() => setAnimationPhase(3), 2500)

    // Fade out and redirect
    const timer4 = setTimeout(() => {
      setIsVisible(false)
    }, 3500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite'
        }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Logo container with glow effect */}
        <div className={`relative mb-8 transition-all duration-1000 ${animationPhase >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}>
          {/* Glow effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 bg-cyan-500/30 rounded-full blur-3xl animate-pulse"></div>
          </div>

          {/* Logo */}
          <div className="relative w-80 h-40 mx-auto mb-6 flex items-center justify-center">
            <img
              src="/wtf-logo-new.png"
              alt="WTF - Witness The Fitness"
              className="w-full h-auto object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

        {/* Subtitle with fade-in */}
        <div className={`transition-all duration-1000 delay-500 ${animationPhase >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
          <p className="text-lg text-blue-300/80 font-medium">
            Transform Your Journey
          </p>
        </div>

        {/* Loading bar */}
        <div className={`mt-12 transition-all duration-1000 delay-1000 ${animationPhase >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
          <div className="w-64 h-1.5 mx-auto bg-slate-700/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full animate-loading-bar"></div>
          </div>
          <p className="mt-4 text-sm text-slate-400 font-medium animate-pulse">
            Loading your experience...
          </p>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-cyan-400/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes grid-move {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          50% {
            transform: translateY(-100px) translateX(50px);
          }
        }

        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }

        .animate-float {
          animation: float 5s ease-in-out infinite;
        }

        .delay-150 {
          animation-delay: 150ms;
        }

        .delay-300 {
          animation-delay: 300ms;
        }

        .delay-500 {
          animation-delay: 500ms;
        }

        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  )
}
