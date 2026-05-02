/**
 * Analytics Page
 * System analytics and statistics
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import Icon from '@/components/Icon';
import { vehicleAPI } from '@/utils/api';
import LoadingScreen from '@/components/LoadingScreen';

export default function AnalyticsPage() {
  const { isDark } = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await vehicleAPI.getAnalytics(7);
        setAnalytics(res.data.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingScreen message="Loading Analytics..." />;
  }

  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
        Analytics Dashboard
      </h1>

      {analytics && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
            <div className="flex items-center gap-2 text-sm">
              <Icon name="MdDirectionsCar" className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Vehicles</span>
            </div>
            <div className={`mt-2 text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {analytics.totalVehicles}
            </div>
            <div className={`mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              {analytics.period}
            </div>
          </div>

          <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
            <div className="flex items-center gap-2 text-sm">
              <Icon name="MdTrendingUp" className={`h-5 w-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Average Weight</span>
            </div>
            <div className={`mt-2 text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {analytics.averageWeight} kg
            </div>
          </div>

          <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
            <div className="flex items-center gap-2 text-sm text-green-400">
              <Icon name="MdCheckCircle" className="h-5 w-5" />
              <span>Allowed Vehicles</span>
            </div>
            <div className="mt-2 text-4xl font-bold text-green-400">
              {analytics.allowedVehicles}
            </div>
            <div className="mt-2 text-xs text-green-600">
              {((analytics.allowedVehicles / analytics.totalVehicles) * 100).toFixed(1)}%
            </div>
          </div>

          <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
            <div className="flex items-center gap-2 text-sm text-red-400">
              <Icon name="MdCancel" className="h-5 w-5" />
              <span>Blocked Vehicles</span>
            </div>
            <div className="mt-2 text-4xl font-bold text-red-400">
              {analytics.blockedVehicles}
            </div>
            <div className="mt-2 text-xs text-red-600">
              {((analytics.blockedVehicles / analytics.totalVehicles) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Charts Coming Soon
        </h2>
        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Daily trends, weight distribution, and peak hours analysis will be displayed here.
        </p>
      </div>
    </div>
  );
}
