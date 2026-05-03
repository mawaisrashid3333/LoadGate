/**
 * Analytics Page
 * System analytics and statistics with interactive charts
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import Icon from '@/components/Icon';
import { vehicleAPI } from '@/utils/api';
import LoadingScreen from '@/components/LoadingScreen';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadarController,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadarController,
  Filler,
  Tooltip,
  Legend
);

export default function AnalyticsPage() {
  const { isDark } = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7);

  // Generate mock chart data based on analytics
  const generateChartData = useMemo(() => {
    if (!analytics) return null;

    const days = Array.from({ length: timeRange }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (timeRange - 1 - i));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return {
      days,
      dailyVehicles: Array.from({ length: timeRange }, () =>
        Math.floor(Math.random() * (analytics.totalVehicles / timeRange) + 5)
      ),
      dailyWeights: Array.from({ length: timeRange }, () =>
        Math.floor(analytics.averageWeight + Math.random() * 20 - 10)
      ),
      hourlyVehicles: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        count: Math.floor(Math.random() * 15 + 2),
      })),
    };
  }, [analytics, timeRange]);

  // Chart color themes
  const chartColors = useMemo(
    () => ({
      primary: '#EC6B1B',
      success: '#10b981',
      danger: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
      secondary: '#8b5cf6',
      text: isDark ? '#e5e7eb' : '#1e293b',
      border: isDark ? '#374151' : '#e5e7eb',
      bg: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    }),
    [isDark]
  );

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await vehicleAPI.getAnalytics(timeRange);
        setAnalytics(res.data.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return <LoadingScreen message="Loading Analytics..." />;
  }

  if (!analytics || !generateChartData) {
    return (
      <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg text-center`}>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No analytics data available</p>
      </div>
    );
  }

  // Chart options for consistent styling
  const chartBaseOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: chartColors.text,
          font: { size: 12, weight: '500' },
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: chartColors.bg,
        titleColor: chartColors.text,
        bodyColor: chartColors.text,
        borderColor: chartColors.border,
        borderWidth: 1,
        padding: 12,
        displayColors: true,
      },
    },
    scales: {
      y: {
        ticks: { color: chartColors.text },
        grid: { color: chartColors.border, drawBorder: false },
      },
      x: {
        ticks: { color: chartColors.text },
        grid: { color: chartColors.border, drawBorder: false },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header with Time Range */}
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Analytics Dashboard
        </h1>
        <div className="flex gap-2">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded font-medium transition ${
                timeRange === days
                  ? 'bg-[#EC6B1B] text-white'
                  : isDark
                  ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
          <div className="flex items-center gap-2 text-sm">
            <Icon name="MdDirectionsCar" className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Vehicles</span>
          </div>
          <div className={`mt-2 text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {analytics.totalVehicles}
          </div>
          <div className={`mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Last {timeRange} days
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
          <div className={`mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Per vehicle
          </div>
        </div>

        <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
          <div className="flex items-center gap-2 text-sm text-green-500">
            <Icon name="MdCheckCircle" className="h-5 w-5" />
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Allowed</span>
          </div>
          <div className={`mt-2 text-4xl font-bold text-green-500`}>
            {analytics.allowedVehicles}
          </div>
          <div className="mt-2 text-xs text-green-600">
            {analytics.totalVehicles > 0 ? ((analytics.allowedVehicles / analytics.totalVehicles) * 100).toFixed(1) : 0}%
          </div>
        </div>

        <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
          <div className="flex items-center gap-2 text-sm text-red-500">
            <Icon name="MdCancel" className="h-5 w-5" />
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Blocked</span>
          </div>
          <div className={`mt-2 text-4xl font-bold text-red-500`}>
            {analytics.blockedVehicles}
          </div>
          <div className="mt-2 text-xs text-red-600">
            {analytics.totalVehicles > 0 ? ((analytics.blockedVehicles / analytics.totalVehicles) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Line Chart - Weight Trend */}
        <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
            <Icon name="MdTrendingUp" className="h-5 w-5" />
            Weight Trend
          </h2>
          <Line
            data={{
              labels: generateChartData.days,
              datasets: [
                {
                  label: 'Average Weight (kg)',
                  data: generateChartData.dailyWeights,
                  borderColor: chartColors.primary,
                  backgroundColor: `${chartColors.primary}20`,
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4,
                  pointRadius: 5,
                  pointBackgroundColor: chartColors.primary,
                  pointBorderColor: isDark ? '#1e293b' : '#ffffff',
                  pointBorderWidth: 2,
                  pointHoverRadius: 7,
                },
              ],
            }}
            options={{
              ...chartBaseOptions,
              scales: {
                y: {
                  ...chartBaseOptions.scales.y,
                  type: 'linear',
                  beginAtZero: false,
                },
                x: {
                  ...chartBaseOptions.scales.x,
                },
              },
              plugins: {
                ...chartBaseOptions.plugins,
                filler: { propagate: true },
              },
            }}
          />
        </div>

        {/* Bar Chart - Daily Vehicles */}
        <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
            <Icon name="MdBarChart" className="h-5 w-5" />
            Vehicles Per Day
          </h2>
          <Bar
            data={{
              labels: generateChartData.days,
              datasets: [
                {
                  label: 'Vehicle Count',
                  data: generateChartData.dailyVehicles,
                  backgroundColor: [
                    chartColors.primary,
                    chartColors.info,
                    chartColors.success,
                    chartColors.warning,
                    chartColors.secondary,
                    chartColors.danger,
                    '#06b6d4',
                  ],
                  borderColor: chartColors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  hoverBackgroundColor: chartColors.primary,
                },
              ],
            }}
            options={chartBaseOptions}
          />
        </div>

        {/* Pie Chart - Allowed vs Blocked */}
        <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
            <Icon name="MdPieChart" className="h-5 w-5" />
            Status Distribution
          </h2>
          <Pie
            data={{
              labels: ['Allowed', 'Blocked'],
              datasets: [
                {
                  data: [analytics.allowedVehicles, analytics.blockedVehicles],
                  backgroundColor: [chartColors.success, chartColors.danger],
                  borderColor: isDark ? '#1e293b' : '#ffffff',
                  borderWidth: 2,
                  hoverOffset: 10,
                },
              ],
            }}
            options={{
              ...chartBaseOptions,
              plugins: {
                ...chartBaseOptions.plugins,
                legend: {
                  ...chartBaseOptions.plugins.legend,
                  position: 'bottom',
                },
              },
            }}
          />
        </div>

        {/* Doughnut Chart - Status Breakdown */}
        <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
            <Icon name="MdDonut" className="h-5 w-5" />
            Status Breakdown
          </h2>
          <Doughnut
            data={{
              labels: ['Allowed', 'Blocked'],
              datasets: [
                {
                  data: [analytics.allowedVehicles, analytics.blockedVehicles],
                  backgroundColor: [chartColors.success, chartColors.danger],
                  borderColor: isDark ? '#1e293b' : '#ffffff',
                  borderWidth: 3,
                  hoverOffset: 15,
                  cutout: '60%',
                },
              ],
            }}
            options={{
              ...chartBaseOptions,
              plugins: {
                ...chartBaseOptions.plugins,
                legend: {
                  ...chartBaseOptions.plugins.legend,
                  position: 'right',
                },
              },
            }}
          />
        </div>

        {/* Radar Chart - Performance Metrics */}
        <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
            <Icon name="MdRadar" className="h-5 w-5" />
            Performance Metrics
          </h2>
          <Radar
            data={{
              labels: ['Throughput', 'Accuracy', 'Reliability', 'Efficiency', 'Availability'],
              datasets: [
                {
                  label: 'System Performance',
                  data: [92, 88, 95, 85, 98],
                  borderColor: chartColors.primary,
                  backgroundColor: `${chartColors.primary}20`,
                  borderWidth: 2,
                  pointBackgroundColor: chartColors.primary,
                  pointBorderColor: isDark ? '#1e293b' : '#ffffff',
                  pointBorderWidth: 2,
                  pointRadius: 5,
                  pointHoverRadius: 7,
                  fill: true,
                  tension: 0.3,
                },
              ],
            }}
            options={{
              ...chartBaseOptions,
              plugins: {
                ...chartBaseOptions.plugins,
                legend: {
                  ...chartBaseOptions.plugins.legend,
                  position: 'bottom',
                },
              },
              scales: {
                r: {
                  beginAtZero: true,
                  max: 100,
                  ticks: { color: chartColors.text, stepSize: 20 },
                  grid: { color: chartColors.border },
                },
              },
            }}
          />
        </div>

        {/* Hourly Distribution */}
        <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
            <Icon name="MdSchedule" className="h-5 w-5" />
            Hourly Distribution
          </h2>
          <Bar
            data={{
              labels: generateChartData.hourlyVehicles.map((h) => h.hour),
              datasets: [
                {
                  label: 'Vehicles Per Hour',
                  data: generateChartData.hourlyVehicles.map((h) => h.count),
                  backgroundColor: chartColors.info,
                  borderColor: chartColors.border,
                  borderWidth: 1,
                  borderRadius: 6,
                  hoverBackgroundColor: chartColors.primary,
                },
              ],
            }}
            options={{
              ...chartBaseOptions,
              scales: {
                ...chartBaseOptions.scales,
                x: {
                  ...chartBaseOptions.scales.x,
                  ticks: { color: chartColors.text, maxRotation: 45, minRotation: 0 },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
