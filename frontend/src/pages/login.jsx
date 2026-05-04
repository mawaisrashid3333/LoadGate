/**
 * Login Page
 * User authentication page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { MdLock, MdEmail, MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login, loading: authLoading } = useAuth();
  const { isDark } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (mounted && isAuthenticated && !authLoading) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, mounted, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Invalid username or password');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || authLoading) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Login - LoadGate</title>
      </Head>

      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-100'}`}>
        <div className={`w-full max-w-md rounded-lg shadow-lg ${isDark ? 'bg-slate-800' : 'bg-white'} p-8`}>
          {/* Logo / Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center text-orange-500">LoadGate</h1>
            <p className={`text-center mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Smart Vehicle Weighing & Access Control System
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500 text-red-500">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Username
              </label>
              <div className="relative">
                <MdEmail className={`absolute left-3 top-3 text-xl ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className="relative">
                <MdLock className={`absolute left-3 top-3 text-xl ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-3 text-xl ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className={`mt-8 p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
            <p className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
              Demo Credentials:
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <strong>Username:</strong> Main@Admin
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <strong>Password:</strong> Admin@1234
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
