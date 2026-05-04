/**
 * Sidebar Navigation Component
 * Extracted to ensure proper client-side rendering
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Icon from './Icon';

const navItems = [
  { href: '/', label: 'Dashboard', icon: 'MdDashboard' },
  { href: '/vehicles', label: 'Vehicles', icon: 'MdDirectionsCar' },
  { href: '/analytics', label: 'Analytics', icon: 'MdAnalytics' },
  { href: '/settings', label: 'Settings', icon: 'MdSettings' },
];

export default function Sidebar() {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-64 bg-slate-800" />;
  }

  return (
    <aside
      className={`w-64 border-r ${
        isDark
          ? 'border-gray-700 bg-slate-800'
          : 'border-gray-200 bg-white'
      } p-6 flex flex-col`}
    >
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <img src="/logo.png" alt="LoadGate" className="h-10 w-10" />
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#EC6B1B' }}>
            LoadGate
          </h1>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Vehicle Control
          </p>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className={`mb-6 rounded-lg p-3 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
          <p className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Logged in as
          </p>
          <p className={`text-sm font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {user.username}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-slate-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon name={item.icon} className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Theme Toggle & Logout */}
      <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} space-y-2 pt-4`}>
        <button
          onClick={toggleTheme}
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
            isDark
              ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Icon name={isDark ? 'MdWbSunny' : 'MdNightlight'} className="h-5 w-5" />
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-500 transition-colors hover:bg-red-500/10"
        >
          <Icon name="MdLogout" className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
