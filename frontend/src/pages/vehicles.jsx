/**
 * Vehicles Page
 * Display list of all vehicle records with search, filter, sort, and export functionality
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import Icon from '@/components/Icon';
import ExportModal from '@/components/ExportModal';
import { vehicleAPI } from '@/utils/api';

export default function VehiclesPage() {
  const { isDark } = useTheme();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Search and Filter States
  const [searchPlate, setSearchPlate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState({
    status: 'all',
    weightMin: '',
    weightMax: '',
    dateFrom: '',
    dateTo: '',
  });
  const [sortBy, setSortBy] = useState('timestamp-desc');
  const [showFilters, setShowFilters] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-dropdown="sort"]')) {
        setSortDropdownOpen(false);
      }
    };
    if (sortDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [sortDropdownOpen]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const params = {
          page: currentPage,
          limit: pageSize,
          status: filters.status !== 'all' ? filters.status : undefined,
          weightMin: filters.weightMin ? parseFloat(filters.weightMin) : undefined,
          weightMax: filters.weightMax ? parseFloat(filters.weightMax) : undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          search: searchPlate || undefined,
          sort: sortBy || undefined,
        };
        
        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        
        const res = await vehicleAPI.getAll(params);
        setVehicles(res.data.data || []);
        setTotalRecords(res.data.total || 0);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchVehicles();
  }, [filters, currentPage, sortBy, searchPlate, pageSize]);

  // Filter and search logic is now handled on backend
  const totalPages = Math.ceil(totalRecords / pageSize);

  // Export function - calls backend API
  const handleExport = async (exportParams) => {
    setExporting(true);
    try {
      console.log('Export config:', exportParams);
      
      if (!exportParams.records || exportParams.records.length === 0) {
        alert('No records to export');
        return;
      }

      const { format, records } = exportParams;

      // Call backend export endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vehicles/export?format=${format}&limit=${records.length}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the appropriate filename and MIME type based on format
      const formatMap = {
        csv: { ext: 'csv', type: 'text/csv' },
        excel: { ext: 'xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        word: { ext: 'docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
        pdf: { ext: 'pdf', type: 'application/pdf' },
      };

      const fileInfo = formatMap[format] || formatMap.csv;
      const filename = `vehicles-${new Date().toISOString().split('T')[0]}.${fileInfo.ext}`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`✅ Exported ${records.length} records as ${format}`);
    } catch (error) {
      console.error('❌ Error exporting:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Vehicle Records
        </h1>
        <div className="flex gap-2 items-center">
          {/* Export Button - Opens Modal */}
          <button
            onClick={() => setShowExportModal(true)}
            disabled={totalRecords === 0 || exporting}
            className={`px-4 py-2 rounded font-medium transition flex items-center gap-2 border ${
              totalRecords === 0 || exporting
                ? isDark
                  ? 'bg-slate-700 border-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed'
                : isDark
                ? 'bg-green-900/30 border-green-600 text-green-400 hover:bg-green-900/50'
                : 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
            }`}
          >
            <Icon name="MdFileDownload" className="h-5 w-5" />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        isDark={isDark}
        totalRecords={totalRecords}
      />

      {/* Search Bar with Filters Toggle */}
      <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-4 shadow-lg`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded font-medium transition flex items-center gap-2 ${
              isDark
                ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Icon name="MdFilterList" className="h-5 w-5" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          <div className="flex-1 flex items-center gap-2 ml-4 border-l pl-4" style={{ borderColor: isDark ? '#4b5563' : '#e5e7eb' }}>
            <Icon name="MdSearch" className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            <input
              type="text"
              placeholder="Search by number plate (e.g., ABC-1234)..."
              value={searchPlate}
              onChange={(e) => {
                setSearchPlate(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className={`flex-1 px-3 py-2 rounded border ${
                isDark
                  ? 'bg-slate-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-slate-900 placeholder-gray-600'
              } focus:outline-none focus:ring-2 focus:ring-[#EC6B1B]`}
            />
            {searchPlate && (
              <button
                onClick={() => {
                  setSearchPlate('');
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded hover:${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}
              >
                <Icon name="MdClear" className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
          <h3 className={`mb-4 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Icon name="MdTuning" className="h-5 w-5 inline mr-2" />
            Advanced Filters
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Status Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className={`w-full px-3 py-2 rounded border ${
                  isDark
                    ? 'bg-slate-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-slate-900'
                } focus:outline-none focus:ring-2 focus:ring-[#EC6B1B]`}
              >
                <option value="all">All Status</option>
                <option value="ALLOWED">Allowed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>

            {/* Weight Min */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Min Weight (kg)
              </label>
              <input
                type="number"
                value={filters.weightMin}
                onChange={(e) => setFilters({ ...filters, weightMin: e.target.value })}
                placeholder="0"
                className={`w-full px-3 py-2 rounded border ${
                  isDark
                    ? 'bg-slate-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-slate-900'
                } focus:outline-none focus:ring-2 focus:ring-[#EC6B1B]`}
              />
            </div>

            {/* Weight Max */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Max Weight (kg)
              </label>
              <input
                type="number"
                value={filters.weightMax}
                onChange={(e) => setFilters({ ...filters, weightMax: e.target.value })}
                placeholder="5000"
                className={`w-full px-3 py-2 rounded border ${
                  isDark
                    ? 'bg-slate-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-slate-900'
                } focus:outline-none focus:ring-2 focus:ring-[#EC6B1B]`}
              />
            </div>

            {/* Date From */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className={`w-full px-3 py-2 rounded border ${
                  isDark
                    ? 'bg-slate-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-slate-900'
                } focus:outline-none focus:ring-2 focus:ring-[#EC6B1B]`}
              />
            </div>

            {/* Date To */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className={`w-full px-3 py-2 rounded border ${
                  isDark
                    ? 'bg-slate-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-slate-900'
                } focus:outline-none focus:ring-2 focus:ring-[#EC6B1B]`}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                setSearchPlate('');
                setFilters({
                  status: 'all',
                  weightMin: '',
                  weightMax: '',
                  dateFrom: '',
                  dateTo: '',
                });
                setSortBy('timestamp-desc');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded font-medium transition ${
                isDark
                  ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } flex items-center gap-2`}
            >
              <Icon name="MdRefresh" className="h-5 w-5" />
              Reset Filters
            </button>
            <span className={`px-4 py-2 rounded ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Results: {vehicles.length} / {totalRecords}
            </span>
          </div>
        </div>
      )}

      {/* Sort and Results Info */}
      <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-4 shadow-lg flex justify-between items-center`}>
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Page {currentPage} of {totalPages || 1} • Showing {vehicles.length} of {totalRecords} records
        </span>
        <div className="flex items-center gap-3">
          <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <Icon name="MdSort" className="h-4 w-4 inline mr-1" />
            Sort by:
          </label>
          
          {/* Custom Sort Dropdown */}
          <div className="relative" data-dropdown="sort">
            <button
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className={`px-4 py-2 rounded font-medium transition flex items-center gap-2 border ${
                isDark
                  ? 'bg-slate-700 border-gray-600 text-white hover:bg-slate-600'
                  : 'bg-white border-gray-300 text-slate-900 hover:bg-gray-50'
              }`}
            >
              {sortBy === 'timestamp-desc' && 'Latest First'}
              {sortBy === 'timestamp-asc' && 'Oldest First'}
              {sortBy === 'weight-desc' && 'Heaviest First'}
              {sortBy === 'weight-asc' && 'Lightest First'}
              {sortBy === 'carNumber-asc' && 'Number Plate (A-Z)'}
              {sortBy === 'carNumber-desc' && 'Number Plate (Z-A)'}
              {sortBy === 'status-asc' && 'Status (A-Z)'}
              <Icon
                name={sortDropdownOpen ? 'MdExpandLess' : 'MdExpandMore'}
                className="h-4 w-4"
              />
            </button>

            {/* Dropdown Menu */}
            {sortDropdownOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-64 rounded-lg border shadow-xl z-50 overflow-hidden ${
                  isDark
                    ? 'bg-slate-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
              >
                {[
                  { value: 'timestamp-desc', label: 'Latest First', icon: 'MdArrowDownward' },
                  { value: 'timestamp-asc', label: 'Oldest First', icon: 'MdArrowUpward' },
                  { value: 'weight-desc', label: 'Heaviest First', icon: 'MdArrowDownward' },
                  { value: 'weight-asc', label: 'Lightest First', icon: 'MdArrowUpward' },
                  { value: 'carNumber-asc', label: 'Number Plate (A-Z)', icon: 'MdSortByAlpha' },
                  { value: 'carNumber-desc', label: 'Number Plate (Z-A)', icon: 'MdSortByAlpha' },
                  { value: 'status-asc', label: 'Status (A-Z)', icon: 'MdSortByAlpha' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setSortDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${
                      sortBy === option.value
                        ? isDark
                          ? 'bg-[#EC6B1B] text-white'
                          : 'bg-[#EC6B1B] text-white'
                        : isDark
                        ? 'text-gray-200 hover:bg-slate-700'
                        : 'text-slate-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon name={option.icon} className="h-5 w-5 flex-shrink-0" />
                    <span className="flex-1">{option.label}</span>
                    {sortBy === option.value && (
                      <Icon name="MdCheckCircle" className="h-5 w-5 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
        {vehicles.length === 0 ? (
          <div className={`py-12 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <Icon name="MdDirectionsCar" className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="font-medium">No vehicles found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
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
                      Number Plate
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
                      <td className={`px-4 py-3 font-medium ${isDark ? 'text-gray-200' : 'text-slate-900'}`}>
                        {vehicle.weight}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-3 py-1 text-sm font-medium ${
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
                      <td className={`px-4 py-3 font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {vehicle.carNumber ? (
                          <span className={`px-3 py-1 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                            {vehicle.carNumber}
                          </span>
                        ) : (
                          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`flex items-center justify-center gap-2 mt-6 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded font-medium flex items-center gap-1 ${
                    currentPage === 1
                      ? isDark
                        ? 'bg-slate-700 text-gray-500'
                        : 'bg-gray-200 text-gray-500'
                      : isDark
                      ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon name="MdChevronLeft" className="h-4 w-4" />
                  First
                </button>

                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded font-medium ${
                    currentPage === 1
                      ? isDark
                        ? 'bg-slate-700 text-gray-500'
                        : 'bg-gray-200 text-gray-500'
                      : isDark
                      ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon name="MdChevronLeft" className="h-5 w-5" />
                </button>

                <div className={`px-4 py-2 rounded ${isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                  Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded font-medium ${
                    currentPage === totalPages
                      ? isDark
                        ? 'bg-slate-700 text-gray-500'
                        : 'bg-gray-200 text-gray-500'
                      : isDark
                      ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon name="MdChevronRight" className="h-5 w-5" />
                </button>

                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded font-medium flex items-center gap-1 ${
                    currentPage === totalPages
                      ? isDark
                        ? 'bg-slate-700 text-gray-500'
                        : 'bg-gray-200 text-gray-500'
                      : isDark
                      ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Last
                  <Icon name="MdChevronRight" className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
