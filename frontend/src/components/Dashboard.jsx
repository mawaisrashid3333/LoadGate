/**
 * Dashboard Component
 * Main dashboard displaying real-time vehicle information
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent vehicles
        const vehicleRes = await vehicleAPI.getAll({ limit: 10 });
        setVehicles(vehicleRes.data.data || []);

        // Check Arduino status
        const statusRes = await arduinoAPI.getStatus();
        setSystemStatus(statusRes.data);

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
  );
}
