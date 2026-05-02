/**
 * Debug Page - Check Icon Installation
 * Use this to verify react-icons is working
 * Visit: http://localhost:3000/_debug-icons (not exposed in production)
 */

'use client';

import React, { useEffect, useState } from 'react';

export default function DebugIconsPage() {
  const [status, setStatus] = useState({
    reactIconsInstalled: false,
    icons: {},
    error: null,
  });

  useEffect(() => {
    try {
      // Try dynamic import
      import('react-icons/md').then((md) => {
        const iconList = {
          MdDashboard: !!md.MdDashboard,
          MdDirectionsCar: !!md.MdDirectionsCar,
          MdAnalytics: !!md.MdAnalytics,
          MdSettings: !!md.MdSettings,
          MdSun: !!md.MdSun,
          MdNightlight: !!md.MdNightlight,
          MdCheckCircle: !!md.MdCheckCircle,
          MdCancel: !!md.MdCancel,
        };

        setStatus({
          reactIconsInstalled: true,
          icons: iconList,
          error: null,
        });

        console.log('✅ react-icons/md loaded successfully');
        console.log('Icon Status:', iconList);
      }).catch((err) => {
        setStatus({
          reactIconsInstalled: false,
          icons: {},
          error: err.message,
        });
        console.error('❌ Failed to load react-icons/md:', err);
      });
    } catch (error) {
      setStatus({
        reactIconsInstalled: false,
        icons: {},
        error: error.message,
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🔍 React-Icons Debug Panel</h1>

        {/* Installation Status */}
        <div className="bg-slate-700 rounded-lg p-6 mb-8 border border-slate-600">
          <h2 className="text-2xl font-semibold mb-4">Installation Status</h2>
          <div className="space-y-2">
            <p className="text-lg">
              <span className={status.reactIconsInstalled ? 'text-green-400' : 'text-red-400'}>
                {status.reactIconsInstalled ? '✅ INSTALLED' : '❌ NOT INSTALLED'}
              </span>
              {' '} react-icons
            </p>
            {status.error && (
              <p className="text-red-300 text-sm">Error: {status.error}</p>
            )}
          </div>
        </div>

        {/* Icon Status */}
        <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
          <h2 className="text-2xl font-semibold mb-4">Icon Availability</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(status.icons).map(([icon, available]) => (
              <div key={icon} className="flex items-center gap-2 p-3 bg-slate-800 rounded">
                <span className={available ? 'text-green-400' : 'text-red-400'}>
                  {available ? '✓' : '✗'}
                </span>
                <code className="text-sm font-mono">{icon}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900 rounded-lg p-6 mt-8 border border-blue-600">
          <h3 className="text-lg font-semibold mb-2">How to Fix Missing Icons:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Ensure react-icons is in package.json dependencies</li>
            <li>Run: <code className="bg-slate-800 px-2 py-1 rounded">npm install react-icons@4.12.0</code></li>
            <li>Delete node_modules: <code className="bg-slate-800 px-2 py-1 rounded">rm -r node_modules</code></li>
            <li>Reinstall: <code className="bg-slate-800 px-2 py-1 rounded">npm install</code></li>
            <li>Restart dev server: <code className="bg-slate-800 px-2 py-1 rounded">npm run dev</code></li>
          </ol>
        </div>

        {/* Console Output */}
        <div className="bg-slate-700 rounded-lg p-6 mt-8 border border-slate-600">
          <h3 className="text-lg font-semibold mb-2">📋 Check Browser Console (F12)</h3>
          <p className="text-sm text-gray-300">
            Look for console logs showing icon status. If you see errors, react-icons may not be properly installed.
          </p>
        </div>
      </div>
    </div>
  );
}
