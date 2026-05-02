/**
 * Loading Screen Component
 * Interactive animated loading screen
 */

'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function LoadingScreen({ message = 'Loading...' }) {
  const { isDark } = useTheme();

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${
        isDark ? 'bg-slate-900' : 'bg-white'
      }`}
    >
      {/* Logo */}
      <div className="mb-8">
        <img src="/logo.png" alt="LoadGate" className="h-24 w-24" />
      </div>

      {/* Loading Animation */}
      <div className="mb-8">
        <svg
          className="h-16 w-16 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className={`opacity-25 ${isDark ? 'stroke-blue-500' : 'stroke-blue-600'}`}
            cx="12"
            cy="12"
            r="10"
            strokeWidth="4"
          />
          <path
            className={`opacity-75 ${isDark ? 'fill-blue-500' : 'fill-blue-600'}`}
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>

      {/* Animated Text */}
      <h2 className={`mb-4 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {message}
      </h2>

      {/* Loading Dots Animation */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-full ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`}
            style={{
              animation: `bounce 1.4s infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className={`mt-8 w-64 h-1 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`}>
        <div
          className={`h-full rounded-full ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`}
          style={{
            animation: `progress 2s infinite`,
          }}
        />
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-10px);
          }
        }

        @keyframes progress {
          0% {
            width: 0%;
          }
          50% {
            width: 100%;
          }
          100% {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
