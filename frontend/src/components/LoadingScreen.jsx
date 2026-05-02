/**
 * Loading Screen Component
 * Highly animated and interactive loading screen
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function LoadingScreen({ message = 'Loading...' }) {
  const { isDark } = useTheme();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 95 ? 95 : prev + Math.random() * 30));
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const accentColor = '#EC6B1B';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden ${
        isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
      }`}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        {[...Array(3)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="absolute rounded-full opacity-10"
            style={{
              width: '200px',
              height: '200px',
              backgroundColor: accentColor,
              animation: `float ${8 + i * 2}s infinite ease-in-out`,
              animationDelay: `${i * 2}s`,
              left: `${10 + i * 30}%`,
              top: `${-50 + i * 40}%`,
            }}
          />
        ))}
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with Pulse Animation */}
        <div className="mb-8 relative">
          <div
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              boxShadow: `0 0 40px ${accentColor}`,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          <img src="/logo.png" alt="LoadGate" className="relative h-24 w-24 drop-shadow-lg" />
        </div>

        {/* Multi-layer Spinner */}
        <div className="mb-8 relative h-24 w-24 flex items-center justify-center">
          {/* Outer Rotating Ring */}
          <svg
            className="absolute h-24 w-24"
            style={{
              animation: 'spin 3s linear infinite',
            }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke={accentColor}
              strokeWidth="2"
              opacity="0.2"
            />
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
              fill={accentColor}
              opacity="0.1"
            />
          </svg>

          {/* Middle Rotating Ring */}
          <svg
            className="absolute h-20 w-20"
            style={{
              animation: 'spin-reverse 2s linear infinite',
            }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="8"
              stroke={accentColor}
              strokeWidth="2"
              opacity="0.4"
            />
          </svg>

          {/* Inner Pulsing Dot */}
          <div
            className="absolute h-4 w-4 rounded-full"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 20px ${accentColor}`,
              animation: 'pulse-scale 1.5s ease-in-out infinite',
            }}
          />
        </div>

        {/* Animated Text */}
        <h2
          className={`mb-6 text-3xl font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}
          style={{
            animation: 'fadeInScale 1s ease-out',
          }}
        >
          {message}
        </h2>

        {/* Animated Dots */}
        <div className="mb-8 flex gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-4 w-4 rounded-full"
              style={{
                backgroundColor: accentColor,
                animation: `bounce-dots 1.4s infinite cubic-bezier(0, 0.5, 0.5, 1)`,
                animationDelay: `${i * 0.2}s`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className={`mb-8 h-2 w-64 overflow-hidden rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`}>
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${accentColor}, #ff9a56)`,
              boxShadow: `0 0 10px ${accentColor}`,
            }}
          />
        </div>

        {/* Progress Text */}
        <p
          className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
          style={{
            animation: 'fadeIn 1s ease-out',
          }}
        >
          {Math.round(progress)}%
        </p>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full"
            style={{
              backgroundColor: accentColor,
              opacity: 0.5,
              animation: `float-particle 4s infinite linear`,
              animationDelay: `${i * 0.8}s`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes bounce-dots {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-15px);
            opacity: 1;
          }
        }

        @keyframes pulse-scale {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.5;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-40px) translateX(-10px);
          }
          75% {
            transform: translateY(-20px) translateX(10px);
          }
        }

        @keyframes float-particle {
          0% {
            opacity: 0;
            transform: translateY(100vh) translateX(0);
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-100vh) translateX(100px);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes move-vehicle {
          0% {
            transform: translateX(-120%) translateY(0);
          }
          50% {
            transform: translateX(0) translateY(-5px);
          }
          100% {
            transform: translateX(120%) translateY(0);
          }
        }

        @keyframes scale-bounce {
          0%, 100% {
            transform: scaleY(1);
            opacity: 0.6;
          }
          50% {
            transform: scaleY(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
