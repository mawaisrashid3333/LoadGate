/**
 * Settings Page
 * System configuration, health monitoring, and control
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import Icon from '@/components/Icon';

export default function SettingsPage() {
  const { isDark } = useTheme();
  const [settings, setSettings] = useState({
    maxWeight: 5000,
    calibrationFactor: 20.0,
    systemName: 'LoadGate System',
    location: 'Main Gate',
    barrierDelay: 2000,
    alertVolume: 75,
  });

  const [systemHealth, setSystemHealth] = useState(null);
  const [componentHealth, setComponentHealth] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [operationStatus, setOperationStatus] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      const [healthRes, componentsRes, infoRes] = await Promise.all([
        fetch('http://localhost:5000/api/system/health'),
        fetch('http://localhost:5000/api/system/components/health'),
        fetch('http://localhost:5000/api/system/info'),
      ]);

      const health = await healthRes.json();
      const components = await componentsRes.json();
      const info = await infoRes.json();

      setSystemHealth(health.data);
      setComponentHealth(components.data);
      setSystemInfo(info.data);
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  };

  const handleSystemAction = async (action) => {
    setLoading(true);
    setOperationStatus('');
    try {
      const response = await fetch(`http://localhost:5000/api/system/${action}`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        setOperationStatus(`✓ ${action} successful`);
        setTimeout(() => setOperationStatus(''), 3000);
      } else {
        setOperationStatus(`✗ ${action} failed: ${data.message}`);
      }
    } catch (error) {
      setOperationStatus(`✗ Error: ${error.message}`);
    } finally {
      setLoading(false);
      setShowConfirmDialog(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: isNaN(value) ? value : parseFloat(value),
    });
  };

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/system/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        setOperationStatus('✓ Settings saved successfully');
        setTimeout(() => setOperationStatus(''), 3000);
      }
    } catch (error) {
      setOperationStatus(`✗ Failed to save settings: ${error.message}`);
    }
  };

  const getHealthColor = (status) => {
    if (status === 'healthy') return 'text-green-500';
    if (status === 'warning') return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthBgColor = (status) => {
    if (status === 'healthy') return isDark ? 'bg-green-900/30' : 'bg-green-50';
    if (status === 'warning') return isDark ? 'bg-yellow-900/30' : 'bg-yellow-50';
    return isDark ? 'bg-red-900/30' : 'bg-red-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          System Settings & Control
        </h1>
        <button
          onClick={fetchSystemHealth}
          disabled={loading}
          className={`px-4 py-2 rounded font-medium transition flex items-center gap-2 ${
            isDark
              ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Icon name="MdRefresh" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Operation Status Message */}
      {operationStatus && (
        <div
          className={`px-4 py-3 rounded-lg font-medium transition ${
            operationStatus.startsWith('✓')
              ? isDark
                ? 'bg-green-900/30 text-green-400'
                : 'bg-green-50 text-green-700'
              : isDark
              ? 'bg-red-900/30 text-red-400'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {operationStatus}
        </div>
      )}

      {/* System Health Overview */}
      {systemHealth && (
        <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
          <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Icon name="MdHealthAndSafety" className="h-6 w-6" />
            System Health
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${getHealthBgColor(systemHealth.status)} border-current`}>
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Overall Status</span>
                <span className={`text-lg font-bold ${getHealthColor(systemHealth.status)}`}>
                  {systemHealth.status.toUpperCase()}
                </span>
              </div>
              <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Uptime: {systemHealth.uptime}
              </div>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>CPU Usage</span>
                <span className={`text-lg font-bold ${systemHealth.cpuUsage > 80 ? 'text-red-500' : 'text-blue-500'}`}>
                  {systemHealth.cpuUsage}%
                </span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    systemHealth.cpuUsage > 80 ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${systemHealth.cpuUsage}%` }}
                />
              </div>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Memory Usage</span>
                <span className={`text-lg font-bold ${systemHealth.memoryUsage > 80 ? 'text-red-500' : 'text-green-500'}`}>
                  {systemHealth.memoryUsage}%
                </span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    systemHealth.memoryUsage > 80 ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${systemHealth.memoryUsage}%` }}
                />
              </div>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Disk Usage</span>
                <span className={`text-lg font-bold ${systemHealth.diskUsage > 80 ? 'text-red-500' : 'text-purple-500'}`}>
                  {systemHealth.diskUsage}%
                </span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    systemHealth.diskUsage > 80 ? 'bg-red-500' : 'bg-purple-500'
                  }`}
                  style={{ width: `${systemHealth.diskUsage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Component Health */}
      {componentHealth && (
        <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
          <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Icon name="MdWidgets" className="h-6 w-6" />
            Component Health
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(componentHealth).map(([component, status]) => (
              <div key={component} className={`p-4 rounded-lg border ${getHealthBgColor(status)} border-current flex items-center justify-between`}>
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{component}</span>
                <div className="flex items-center gap-2">
                  <Icon name="MdCheckCircle" className={`h-5 w-5 ${getHealthColor(status)}`} />
                  <span className={`font-medium ${getHealthColor(status)}`}>{status.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Controls */}
      <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
        <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <Icon name="MdPlaylistAddCheck" className="h-6 w-6" />
          System Controls
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => setShowConfirmDialog('restart')}
            disabled={loading}
            className={`p-4 rounded-lg border flex items-center gap-3 transition font-medium ${
              isDark
                ? 'bg-blue-900/20 border-blue-600 text-blue-400 hover:bg-blue-900/40'
                : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon name="MdRestartAlt" className="h-5 w-5" />
            Restart System
          </button>
          <button
            onClick={() => setShowConfirmDialog('shutdown')}
            disabled={loading}
            className={`p-4 rounded-lg border flex items-center gap-3 transition font-medium ${
              isDark
                ? 'bg-red-900/20 border-red-600 text-red-400 hover:bg-red-900/40'
                : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon name="MdPowerSettingsNew" className="h-5 w-5" />
            Shutdown System
          </button>
          <button
            onClick={() => handleSystemAction('test')}
            disabled={loading}
            className={`p-4 rounded-lg border flex items-center gap-3 transition font-medium ${
              isDark
                ? 'bg-yellow-900/20 border-yellow-600 text-yellow-400 hover:bg-yellow-900/40'
                : 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon name="MdSpeed" className="h-5 w-5" />
            Test Barrier
          </button>
          <button
            onClick={() => handleSystemAction('calibrate')}
            disabled={loading}
            className={`p-4 rounded-lg border flex items-center gap-3 transition font-medium ${
              isDark
                ? 'bg-purple-900/20 border-purple-600 text-purple-400 hover:bg-purple-900/40'
                : 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon name="MdTune" className="h-5 w-5" />
            Calibrate Scale
          </button>
          <button
            onClick={() => handleSystemAction('clear-logs')}
            disabled={loading}
            className={`p-4 rounded-lg border flex items-center gap-3 transition font-medium ${
              isDark
                ? 'bg-orange-900/20 border-orange-600 text-orange-400 hover:bg-orange-900/40'
                : 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon name="MdDeleteSweep" className="h-5 w-5" />
            Clear Logs
          </button>
          <button
            onClick={() => handleSystemAction('export-logs')}
            disabled={loading}
            className={`p-4 rounded-lg border flex items-center gap-3 transition font-medium ${
              isDark
                ? 'bg-green-900/20 border-green-600 text-green-400 hover:bg-green-900/40'
                : 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon name="MdDownload" className="h-5 w-5" />
            Export Logs
          </button>
        </div>
      </div>

      {/* System Information */}
      {systemInfo && (
        <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
          <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Icon name="MdInfo" className="h-6 w-6" />
            System Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className={`block font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>OS Version</span>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{systemInfo.osVersion}</span>
            </div>
            <div>
              <span className={`block font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Node Version</span>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{systemInfo.nodeVersion}</span>
            </div>
            <div>
              <span className={`block font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Total Memory</span>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{systemInfo.totalMemory}</span>
            </div>
            <div>
              <span className={`block font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>CPU Cores</span>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{systemInfo.cpuCores}</span>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Settings */}
      <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg space-y-4`}>
        <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <Icon name="MdSettings" className="h-6 w-6" />
          Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              System Name
            </label>
            <input
              type="text"
              name="systemName"
              value={settings.systemName}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 ${
                isDark
                  ? 'border-gray-600 bg-slate-700 text-white focus:border-orange-500'
                  : 'border-gray-300 bg-white text-slate-900 focus:border-orange-500'
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Location
            </label>
            <input
              type="text"
              name="location"
              value={settings.location}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 ${
                isDark
                  ? 'border-gray-600 bg-slate-700 text-white focus:border-orange-500'
                  : 'border-gray-300 bg-white text-slate-900 focus:border-orange-500'
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Max Weight Limit (kg)
            </label>
            <input
              type="number"
              name="maxWeight"
              value={settings.maxWeight}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 ${
                isDark
                  ? 'border-gray-600 bg-slate-700 text-white focus:border-orange-500'
                  : 'border-gray-300 bg-white text-slate-900 focus:border-orange-500'
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Calibration Factor
            </label>
            <input
              type="number"
              name="calibrationFactor"
              value={settings.calibrationFactor}
              step="0.1"
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 ${
                isDark
                  ? 'border-gray-600 bg-slate-700 text-white focus:border-orange-500'
                  : 'border-gray-300 bg-white text-slate-900 focus:border-orange-500'
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Barrier Delay (ms)
            </label>
            <input
              type="number"
              name="barrierDelay"
              value={settings.barrierDelay}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 ${
                isDark
                  ? 'border-gray-600 bg-slate-700 text-white focus:border-orange-500'
                  : 'border-gray-300 bg-white text-slate-900 focus:border-orange-500'
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Alert Volume (%)
            </label>
            <input
              type="number"
              name="alertVolume"
              value={settings.alertVolume}
              min="0"
              max="100"
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 ${
                isDark
                  ? 'border-gray-600 bg-slate-700 text-white focus:border-orange-500'
                  : 'border-gray-300 bg-white text-slate-900 focus:border-orange-500'
              } focus:outline-none`}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className={`w-full py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 bg-[#EC6B1B] text-white hover:bg-orange-600 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Icon name="MdSave" className="h-5 w-5" />
          Save Configuration
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} p-6 shadow-xl max-w-sm`}>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Confirm {showConfirmDialog === 'restart' ? 'Restart' : 'Shutdown'}?
            </h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              This will {showConfirmDialog === 'restart' ? 'restart the system' : 'shutdown the system'}. This action cannot be undone immediately.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className={`flex-1 px-4 py-2 rounded font-medium transition ${
                  isDark
                    ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSystemAction(showConfirmDialog)}
                className={`flex-1 px-4 py-2 rounded font-medium text-white transition ${
                  showConfirmDialog === 'restart' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {showConfirmDialog === 'restart' ? 'Restart' : 'Shutdown'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
