/**
 * Vehicles Page
 * Display list of all vehicle records
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import Icon from '@/components/Icon';
import { vehicleAPI } from '@/utils/api';
import LoadingScreen from '@/components/LoadingScreen';

export default function VehiclesPage() {
  const { isDark } = useTheme();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    limit: 20,
  });

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const params = filters.status !== 'all' ? { status: filters.status, limit: filters.limit } : { limit: filters.limit };
        const res = await vehicleAPI.getAll(params);
        setVehicles(res.data.data || []);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [filters]);

  if (loading) {
    return <LoadingScreen message="Loading Vehicles..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Vehicle Records
        </h1>
        <button className="btn-primary flex items-center gap-2">
          <Icon name="MdFileDownload" className="h-5 w-5" />
          Export as CSV
        </button>
      </div>

      {/* Filters */}
      <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg flex gap-4`}>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="input w-48"
        >
          <option value="all">All Status</option>
          <option value="ALLOWED">Allowed</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>

      {/* Table */}
      <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
        {loading ? (
          <div className={`py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Date & Time
                  </th>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Weight (kg)
                  </th>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Status
                  </th>
                  <th className={`px-4 py-3 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Car Number
                  </th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr
                    key={vehicle._id}
                    className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-200' : 'text-slate-900'}`}>
                      {new Date(vehicle.timestamp).toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-200' : 'text-slate-900'}`}>
                      {vehicle.weight}
                    </td>
                    <td className="px-4 py-3">
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
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {vehicle.carNumber || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
