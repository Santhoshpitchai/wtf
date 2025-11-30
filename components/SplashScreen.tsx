'use client'

import { useEffect, useState } from 'react'

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Smooth progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 2
      })
    }, 30)

    // Remove from DOM after fade completes
    const removeTimer = setTimeout(() => {
      setIsVisible(false)
    }, 3700) // 3000ms + 700ms fade

    return () => {
      clearInterval(progressInterval)
      clearTimeout(removeTimer)
    }
  }, [])

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-700 ${!isVisible ? 'hidden' : ''} ${progress >= 100 ? 'opacity-0' : 'opacity-100'}`}>
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float-1"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float-2"></div>
        <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-float-3"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4">
        {/* Logo matching the design */}
        <div className="relative mb-8 animate-logo-entrance">
          {/* Glow effect behind logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[500px] h-[250px] bg-cyan-500/15 rounded-full blur-3xl animate-pulse-glow"></div>
          </div>

          {/* Logo Content */}
          <div className="relative flex flex-col items-center gap-2">
            {/* WTF - Large letters */}
            <div className="flex items-center justify-center animate-wtf-entrance">
              <span className="text-8xl font-black tracking-tight animate-letter-1" 
                style={{ 
                  background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 50%, #c0c0c0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
                }}>
                WTF
              </span>
            </div>

            {/* WITNESS - THE FITNESS with dumbbells */}
            <div className="flex items-center gap-4 animate-fade-in-delayed">
              {/* Left Dumbbell */}
              <div className="flex items-center gap-0.5 animate-slide-in-left">
                <div className="flex flex-col gap-0.5">
                  <div className="w-1.5 h-3.5 bg-cyan-400 rounded-full"></div>
                  <div className="w-1.5 h-3.5 bg-cyan-400 rounded-full"></div>
                  <div className="w-1.5 h-3.5 bg-cyan-400 rounded-full"></div>
                </div>
                <div className="w-6 h-1 bg-cyan-400"></div>
                <div className="flex flex-col gap-0.5">
                  <div className="w-1.5 h-3.5 bg-cyan-400 rounded-full"></div>
                  <div className="w-1.5 h-3.5 bg-cyan-400 rounded-full"></div>
                  <div className="w-1.5 h-3.5 bg-cyan-400 rounded-full"></div>
                </div>
              </div>

              {/* WITNESS - THE FITNESS Text */}
              <div className="flex flex-col items-center">
                <span className="text-white font-black text-2xl tracking-[0.25em] animate-text-fade-1">
                  WITNESS
                </span>
                <div className="w-full h-0.5 bg-cyan-400 my-0.5"></div>
                <span className="text-white font-light text-sm tracking-[0.35em] animate-text-fade-2">
                  THE FITNESS
                </span>
              </div>

              {/* Right Dumbbell */}
              <div className="flex items-center gap-0.5 animate-slide-in-right">
                <div className="flex flex-col gap-0.5">
                  <div className="w-1.5 h-3.5 bg-cyan-400 rounded-full"></div>
                  <div className="w-1.5 h-3.5 bg-cyan-400 rounded-full"></div>
                  <div className="w-1.5 h-3.5 bg-cyan-400 rounded-full"></div>
                </div>
                <div className="w-6 h-1 bg-cyan-400"></div>
                <div className="flex flex-col gap-0.5">
                  <div className="w-1.5 h-3.5 bg-cyan-400 rounded-full"></div>
                  <div className="w-1.5 h-3.5 bg-cyan-400 rounded-full"></div>
                  <div className="w-1.5 h-3.5 bg-cyan-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="mb-12 text-center animate-fade-up">
          <p className="text-sm text-cyan-400/80 font-light tracking-[0.2em] uppercase">
            Transform • Achieve • Excel
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-80 animate-fade-up-delayed">
          <div className="relative h-1 bg-gray-800/50 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-shimmer"></div>
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-slide-progress"></div>
            </div>
          </div>
          
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-dot-1"></div>
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-dot-2"></div>
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-dot-3"></div>
            </div>
            <span className="text-xs font-medium text-gray-500 tracking-wider">
              {progress}%
            </span>
          </div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${4 + Math.random() * 3}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes logo-entrance {
          0% {
            transform: scale(0.7);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes wtf-entrance {
          0% {
            transform: scale(0.5) translateY(-30px);
            opacity: 0;
          }
          60% {
            transform: scale(1.05) translateY(0);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        @keyframes letter-1 {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          60% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes text-fade-1 {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes text-fade-2 {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-left {
          0% {
            transform: translateX(-100px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slide-in-right {
          0% {
            transform: translateX(100px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fade-in-delayed {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes letter-fade {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        @keyframes slide-progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes float-1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(30px, -30px) scale(1.1);
          }
        }

        @keyframes float-2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-40px, 20px) scale(1.15);
          }
        }

        @keyframes float-3 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(20px, 40px) scale(1.05);
          }
        }

        @keyframes dot-bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes particle {
          0% {
            transform: translateY(0) translateX(0) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: scale(1);
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) translateX(30px) scale(0);
            opacity: 0;
          }
        }

        .animate-logo-entrance {
          animation: logo-entrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-wtf-entrance {
          animation: wtf-entrance 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards;
          opacity: 0;
        }

        .animate-letter-1 {
          animation: letter-1 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards;
          opacity: 0;
        }

        .animate-text-fade-1 {
          animation: text-fade-1 0.6s ease-out 0.6s forwards;
          opacity: 0;
        }

        .animate-text-fade-2 {
          animation: text-fade-2 0.6s ease-out 0.75s forwards;
          opacity: 0;
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s forwards;
          opacity: 0;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s forwards;
          opacity: 0;
        }

        .animate-fade-in-delayed {
          animation: fade-in-delayed 0.8s ease-out 0.6s forwards;
          opacity: 0;
        }

        .animate-fade-up {
          animation: fade-up 0.8s ease-out 0.8s forwards;
          opacity: 0;
        }

        .animate-fade-up-delayed {
          animation: fade-up 0.8s ease-out 1s forwards;
          opacity: 0;
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 2.5s ease-in-out infinite;
        }

        .animate-slide-progress {
          animation: slide-progress 1.5s ease-in-out infinite;
        }

        .animate-float-1 {
          animation: float-1 8s ease-in-out infinite;
        }

        .animate-float-2 {
          animation: float-2 10s ease-in-out infinite;
        }

        .animate-float-3 {
          animation: float-3 12s ease-in-out infinite;
        }

        .animate-dot-1 {
          animation: dot-bounce 1s ease-in-out infinite;
        }

        .animate-dot-2 {
          animation: dot-bounce 1s ease-in-out 0.15s infinite;
        }

        .animate-dot-3 {
          animation: dot-bounce 1s ease-in-out 0.3s infinite;
        }

        .animate-particle {
          animation: particle 5s ease-in-out infinite;
        }

        ${Array.from({ length: 17 }, (_, i) => `
          .animate-letter-fade-${i + 1} {
            animation: letter-fade 0.3s ease-out ${0.6 + i * 0.05}s forwards;
            opacity: 0;
          }
        `).join('\n')}
      `}</style>
    </div>
  )
}
