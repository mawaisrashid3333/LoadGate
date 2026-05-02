/**
 * Layout Component
 * Main layout wrapper for all pages with theme support
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import dynamic from 'next/dynamic';

// Dynamically import Sidebar to prevent SSR issues
const Sidebar = dynamic(() => import('./Sidebar'), {
  loading: () => <div className="w-64 bg-slate-800" />,
  ssr: false,
});

export default function Layout({ children }) {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {mounted && <Sidebar />}

      {/* Main Content */}
      <main
        className={`flex-1 p-8 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}
      >
        {children}
      </main>
    </div>
  );
}
