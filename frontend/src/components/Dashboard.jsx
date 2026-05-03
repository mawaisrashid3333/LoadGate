/**
 * Dashboard Component
 * Main dashboard displaying real-time vehicle information, camera feed, barrier control, and settings
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import Icon from './Icon';
import { vehicleAPI, arduinoAPI } from '../utils/api';
import LoadingScreen from './LoadingScreen';

export default function Dashboard() {
  const { isDark } = useTheme();
  const [vehicles, setVehicles] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [cameraOnline, setCameraOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [barrierStatus, setBarrierStatus] = useState('closed');
  const [vehicleLimits, setVehicleLimits] = useState({
    hourly: 50,
    daily: 500,
    weekly: 3000,
  });
  const [tempLimits, setTempLimits] = useState({
    hourly: 50,
    daily: 500,
    weekly: 3000,
  });
  const [alerts, setAlerts] = useState([]);
  const [savingLimits, setSavingLimits] = useState(false);
  const [controllingBarrier, setControllingBarrier] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent vehicles
        const vehicleRes = await vehicleAPI.getAll({ limit: 10 });
        setVehicles(vehicleRes.data.data || []);

        // Check Arduino status
        const statusRes = await arduinoAPI.getStatus();
        setSystemStatus(statusRes.data);

        // Simulate camera check (would be real API call in production)
        setCameraOnline(Math.random() > 0.3);

        // Load saved vehicle limits from localStorage
        const savedLimits = localStorage.getItem('vehicleLimits');
        if (savedLimits) {
          const limits = JSON.parse(savedLimits);
          setVehicleLimits(limits);
          setTempLimits(limits);
        }

        // Generate sample alerts
        setAlerts([
          { id: 1, type: 'success', message: 'Vehicle allowed: Weight 1500kg', time: '5 min ago' },
          { id: 2, type: 'warning', message: 'Heavy vehicle detected: 3200kg', time: '12 min ago' },
          { id: 3, type: 'info', message: 'System calibrated successfully', time: '1 hour ago' },
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    // Always show loading screen for at least 1.5 seconds on mount
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    fetchData();

    return () => clearTimeout(timer);
  }, []);

  const handleBarrierControl = async (action) => {
    setControllingBarrier(true);
    try {
      // Simulate API call - would be real in production
      setTimeout(() => {
        setBarrierStatus(action === 'open' ? 'open' : 'closed');
        setAlerts([
          { id: Date.now(), type: 'info', message: `Barrier ${action}ed manually`, time: 'now' },
          ...alerts.slice(0, 2),
        ]);
        setControllingBarrier(false);
      }, 500);
    } catch (error) {
      console.error('Error controlling barrier:', error);
      setControllingBarrier(false);
    }
  };

  const handleSaveVehicleLimits = async () => {
    setSavingLimits(true);
    try {
      // Simulate API call - would be real in production
      setTimeout(() => {
        setVehicleLimits(tempLimits);
        localStorage.setItem('vehicleLimits', JSON.stringify(tempLimits));
        setAlerts([
          { id: Date.now(), type: 'success', message: 'Vehicle limits updated', time: 'now' },
          ...alerts.slice(0, 2),
        ]);
        setSavingLimits(false);
      }, 500);
    } catch (error) {
      console.error('Error saving limits:', error);
      setSavingLimits(false);
    }
  };

  const handleLimitChange = (period, value) => {
    setTempLimits({
      ...tempLimits,
      [period]: parseInt(value) || 0,
    });
  };

  if (loading) {
    return <LoadingScreen message="Loading Dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${systemStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {systemStatus?.connected ? 'System Online' : 'System Offline'}
          </span>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
          <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <Icon name="MdSignalCellularAlt" className="h-5 w-5" />
            Total Vehicles
          </div>
          <div className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {vehicles.length}
          </div>
        </div>

        <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Icon name="MdCheckCircle" className="h-5 w-5" />
            Allowed
          </div>
          <div className="mt-2 text-2xl font-bold text-green-400">
            {vehicles.filter((v) => v.status === 'ALLOWED').length}
          </div>
        </div>

        <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
          <div className="flex items-center gap-2 text-sm text-red-400">
            <Icon name="MdCancel" className="h-5 w-5" />
            Blocked
          </div>
          <div className="mt-2 text-2xl font-bold text-red-400">
            {vehicles.filter((v) => v.status === 'BLOCKED').length}
          </div>
        </div>

        <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
          <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <Icon name="MdVideocam" className="h-5 w-5" />
            Camera
          </div>
          <div className={`mt-2 text-2xl font-bold ${cameraOnline ? 'text-green-400' : 'text-red-400'}`}>
            {cameraOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Camera and Control */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Camera Feed */}
          <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
            <h2 className={`mb-4 text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Live Camera Feed
            </h2>
            <div className={`relative ${isDark ? 'bg-slate-900' : 'bg-gray-100'} rounded-lg overflow-hidden`} style={{ aspectRatio: '16/9' }}>
              {cameraOnline ? (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                  <div className="text-center">
                    <Icon name="MdVideocam" className="h-16 w-16 text-white mx-auto mb-2" />
                    <p className="text-white font-medium">Live Stream Active</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Icon name="MdVideocamOff" className="h-16 w-16 text-red-500 mx-auto mb-2" />
                    <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Camera Offline</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Unable to connect to camera feed
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Barrier Control */}
          <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Barrier Control
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                barrierStatus === 'open'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                Status: <span className="capitalize">{barrierStatus}</span>
              </span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => handleBarrierControl('open')}
                disabled={barrierStatus === 'open' || controllingBarrier}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition ${
                  barrierStatus === 'open' || controllingBarrier
                    ? isDark ? 'bg-slate-700 text-gray-500' : 'bg-gray-200 text-gray-500'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                <Icon name="MdOutlinedFlag" className="h-5 w-5" />
                Open Barrier
              </button>
              <button
                onClick={() => handleBarrierControl('close')}
                disabled={barrierStatus === 'closed' || controllingBarrier}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition ${
                  barrierStatus === 'closed' || controllingBarrier
                    ? isDark ? 'bg-slate-700 text-gray-500' : 'bg-gray-200 text-gray-500'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                <Icon name="MdBlock" className="h-5 w-5" />
                Close Barrier
              </button>
            </div>
          </div>

          {/* Recent Vehicles Table */}
          <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
            <h2 className={`mb-4 text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Recent Vehicles
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className={`px-4 py-2 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Weight (kg)
                    </th>
                    <th className={`px-4 py-2 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Status
                    </th>
                    <th className={`px-4 py-2 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.length > 0 ? (
                    vehicles.map((vehicle) => (
                      <tr key={vehicle._id} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className={`px-4 py-2 ${isDark ? 'text-gray-200' : 'text-slate-900'}`}>
                          {vehicle.weight}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`flex w-fit items-center gap-1 rounded px-2 py-1 text-sm font-medium ${
                              vehicle.status === 'ALLOWED'
                                ? isDark
                                  ? 'bg-green-900 text-green-200'
                                  : 'bg-green-100 text-green-800'
                                : isDark
                                ? 'bg-red-900 text-red-200'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {vehicle.status === 'ALLOWED' ? (
                              <Icon name="MdCheckCircle" className="h-4 w-4" />
                            ) : (
                              <Icon name="MdCancel" className="h-4 w-4" />
                            )}
                            {vehicle.status}
                          </span>
                        </td>
                        <td className={`px-4 py-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(vehicle.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className={`px-4 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        No vehicles recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Settings and Alerts */}
        <div className="space-y-6">
          {/* Vehicle Limits Setting */}
          <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
            <h2 className={`mb-4 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Vehicle Limits
            </h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Icon name="MdSchedule" className="h-4 w-4 inline mr-1" />
                  Hourly Limit
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={tempLimits.hourly}
                    onChange={(e) => handleLimitChange('hourly', e.target.value)}
                    className={`flex-1 px-3 py-2 rounded border ${
                      isDark
                        ? 'bg-slate-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-slate-900'
                    } focus:outline-none focus:ring-2 focus:ring-[#EC6B1B]`}
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>vehicles</span>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Icon name="MdDateRange" className="h-4 w-4 inline mr-1" />
                  Daily Limit
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={tempLimits.daily}
                    onChange={(e) => handleLimitChange('daily', e.target.value)}
                    className={`flex-1 px-3 py-2 rounded border ${
                      isDark
                        ? 'bg-slate-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-slate-900'
                    } focus:outline-none focus:ring-2 focus:ring-[#EC6B1B]`}
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>vehicles</span>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Icon name="MdCalendarToday" className="h-4 w-4 inline mr-1" />
                  Weekly Limit
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={tempLimits.weekly}
                    onChange={(e) => handleLimitChange('weekly', e.target.value)}
                    className={`flex-1 px-3 py-2 rounded border ${
                      isDark
                        ? 'bg-slate-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-slate-900'
                    } focus:outline-none focus:ring-2 focus:ring-[#EC6B1B]`}
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>vehicles</span>
                </div>
              </div>

              <button
                onClick={handleSaveVehicleLimits}
                disabled={savingLimits}
                className="w-full bg-[#EC6B1B] text-white py-2 px-4 rounded font-medium hover:bg-[#d55a0a] transition mt-4 flex items-center justify-center gap-2"
              >
                <Icon name="MdSave" className="h-5 w-5" />
                Save Limits
              </button>
            </div>
          </div>

          {/* System Alerts */}
          <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
            <h2 className={`mb-4 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Recent Alerts
            </h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded border-l-4 ${
                      alert.type === 'success'
                        ? isDark
                          ? 'bg-green-900/20 border-green-500'
                          : 'bg-green-50 border-green-500'
                        : alert.type === 'warning'
                        ? isDark
                          ? 'bg-yellow-900/20 border-yellow-500'
                          : 'bg-yellow-50 border-yellow-500'
                        : isDark
                        ? 'bg-blue-900/20 border-blue-500'
                        : 'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon
                        name={
                          alert.type === 'success'
                            ? 'MdCheckCircle'
                            : alert.type === 'warning'
                            ? 'MdWarning'
                            : 'MdInfo'
                        }
                        className={`h-4 w-4 mt-0.5 ${
                          alert.type === 'success'
                            ? 'text-green-500'
                            : alert.type === 'warning'
                            ? 'text-yellow-500'
                            : 'text-blue-500'
                        }`}
                      />
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {alert.message}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {alert.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  No alerts
                </p>
              )}
            </div>
          </div>

          {/* System Health */}
          <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
            <h2 className={`mb-4 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              System Health
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Arduino</span>
                <span className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${systemStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={`text-sm font-medium ${systemStatus?.connected ? 'text-green-500' : 'text-red-500'}`}>
                    {systemStatus?.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Camera</span>
                <span className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${cameraOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={`text-sm font-medium ${cameraOnline ? 'text-green-500' : 'text-red-500'}`}>
                    {cameraOnline ? 'Online' : 'Offline'}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Database</span>
                <span className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-500">Connected</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
