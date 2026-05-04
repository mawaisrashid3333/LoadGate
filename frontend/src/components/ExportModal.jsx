/**
 * Export Modal Component
 * Multi-step export process:
 * 1. Select number of records to fetch
 * 2. Fetch and display records
 * 3. Apply sort and filters
 * 4. Choose export format and export
 */

'use client';

import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { vehicleAPI } from '@/utils/api';

export default function ExportModal({ 
  isOpen, 
  onClose, 
  onExport, 
  isDark, 
  totalRecords
}) {
  const [step, setStep] = useState(1);
  const [recordCount, setRecordCount] = useState('all');
  const [customCount, setCustomCount] = useState(10);
  const [fetchedRecords, setFetchedRecords] = useState([]);
  const [displayRecords, setDisplayRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('csv');
  const [sort, setSort] = useState('timestamp-desc');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedWeightMin, setSelectedWeightMin] = useState('');
  const [selectedWeightMax, setSelectedWeightMax] = useState('');
  const [selectedDateFrom, setSelectedDateFrom] = useState('');
  const [selectedDateTo, setSelectedDateTo] = useState('');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setRecordCount('all');
      setCustomCount(10);
      setFetchedRecords([]);
      setDisplayRecords([]);
      setFormat('csv');
      setSort('timestamp-desc');
      setSelectedStatus('all');
      setSelectedWeightMin('');
      setSelectedWeightMax('');
      setSelectedDateFrom('');
      setSelectedDateTo('');
    }
  }, [isOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-dropdown="sort"]')) {
        setSortDropdownOpen(false);
      }
      if (!e.target.closest('[data-dropdown="status"]')) {
        setStatusDropdownOpen(false);
      }
    };
    if (sortDropdownOpen || statusDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [sortDropdownOpen, statusDropdownOpen]);

  // Apply sort and filter in real-time whenever they change
  useEffect(() => {
    if (fetchedRecords.length === 0) {
      setDisplayRecords([]);
      return;
    }

    console.log(`🔄 Applying Sort: ${sort}, Filters: Status=${selectedStatus}, Weight: ${selectedWeightMin}-${selectedWeightMax}`);
    
    let filtered = [...fetchedRecords];

    // Apply status filter
    if (selectedStatus && selectedStatus !== 'all') {
      filtered = filtered.filter(r => r.status === selectedStatus);
      console.log(`  ✓ Status filter applied: ${filtered.length} records`);
    }

    // Apply weight filters
    if (selectedWeightMin) {
      const minVal = parseFloat(selectedWeightMin);
      filtered = filtered.filter(r => r.weight >= minVal);
      console.log(`  ✓ Min weight filter applied: ${filtered.length} records`);
    }
    if (selectedWeightMax) {
      const maxVal = parseFloat(selectedWeightMax);
      filtered = filtered.filter(r => r.weight <= maxVal);
      console.log(`  ✓ Max weight filter applied: ${filtered.length} records`);
    }

    // Apply date filters
    if (selectedDateFrom) {
      filtered = filtered.filter(r => new Date(r.timestamp) >= new Date(selectedDateFrom));
      console.log(`  ✓ Date from filter applied: ${filtered.length} records`);
    }
    if (selectedDateTo) {
      const toDate = new Date(selectedDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => new Date(r.timestamp) <= toDate);
      console.log(`  ✓ Date to filter applied: ${filtered.length} records`);
    }

    // Apply sort
    const [field, order] = sort.split('-');
    filtered.sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];
      
      if (field === 'timestamp') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (field === 'weight') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      // For carNumber and status - string comparison
      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
      return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    console.log(`  ✓ Sort applied: ${field} (${order}), ${filtered.length} records final`);

    setDisplayRecords(filtered);
  }, [fetchedRecords, sort, selectedStatus, selectedWeightMin, selectedWeightMax, selectedDateFrom, selectedDateTo]);

  const handleFetchRecords = async () => {
    setLoading(true);
    try {
      let limit = 10;
      if (recordCount === 'all') {
        limit = totalRecords || 1000;
      } else if (recordCount === 'custom') {
        limit = Math.min(customCount, totalRecords || 1000);
      }

      console.log(`📥 Fetching ${limit} records...`);

      const params = {
        page: 1,
        limit,
      };

      const res = await vehicleAPI.getAll(params);
      const records = res.data.data || [];
      setFetchedRecords(records);
      console.log(`✅ Fetched ${records.length} records`);
      setStep(2);
    } catch (error) {
      console.error('❌ Error fetching records:', error);
      alert('Failed to fetch records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySortAndFilter = () => {
    console.log(`✅ Moving to export step with ${displayRecords.length} records`);
    setStep(3);
  };

  const handleExport = async () => {
    try {
      console.log(`📤 Exporting ${displayRecords.length} records as ${format}...`);
      
      const params = {
        format,
        records: displayRecords,
      };

      onExport(params);
      onClose();
    } catch (error) {
      console.error('❌ Error during export:', error);
      alert('Export failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
            <Icon name="MdFileDownload" className="h-5 w-5" />
            Export Vehicles
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded transition ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <Icon name="MdClose" className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Record Count */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                  <Icon name="MdNumbers" className="h-5 w-5" />
                  Step 1: Select Records to Export
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded cursor-pointer border transition" style={{borderColor: recordCount === 'current' ? '#EC6B1B' : (isDark ? '#4b5563' : '#e5e7eb'), backgroundColor: recordCount === 'current' ? (isDark ? '#1e3a3a' : '#fff7ed') : 'transparent'}}>
                    <input
                      type="radio"
                      checked={recordCount === 'current'}
                      onChange={() => setRecordCount('current')}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Current Page (10 records)
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Export only the current page
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded cursor-pointer border transition" style={{borderColor: recordCount === 'all' ? '#EC6B1B' : (isDark ? '#4b5563' : '#e5e7eb'), backgroundColor: recordCount === 'all' ? (isDark ? '#1e3a3a' : '#fff7ed') : 'transparent'}}>
                    <input
                      type="radio"
                      checked={recordCount === 'all'}
                      onChange={() => setRecordCount('all')}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        All Records ({totalRecords || 0} total)
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Export all available records
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded cursor-pointer border transition" style={{borderColor: recordCount === 'custom' ? '#EC6B1B' : (isDark ? '#4b5563' : '#e5e7eb'), backgroundColor: recordCount === 'custom' ? (isDark ? '#1e3a3a' : '#fff7ed') : 'transparent'}}>
                    <input
                      type="radio"
                      checked={recordCount === 'custom'}
                      onChange={() => setRecordCount('custom')}
                      className="w-4 h-4 mt-1"
                    />
                    <div className="flex-1">
                      <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Custom Number
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                        Specify the exact number of records
                      </div>
                      {recordCount === 'custom' && (
                        <input
                          type="number"
                          min="1"
                          max={totalRecords || 1000}
                          value={customCount}
                          onChange={(e) => setCustomCount(parseInt(e.target.value) || 1)}
                          className={`w-full px-2 py-1 rounded border ${isDark ? 'bg-slate-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-slate-900'}`}
                        />
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className={`p-3 rounded text-sm ${isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                <div className="flex gap-2">
                  <Icon name="MdInfoOutline" className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <p>Select the records you want to export. In the next step, you'll be able to apply filters and sorting.</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className={`flex-1 px-4 py-2 rounded border transition ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFetchRecords}
                  disabled={loading}
                  className={`flex-1 px-4 py-2 rounded text-white transition flex items-center justify-center gap-2 ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
                >
                  <Icon name={loading ? 'MdHourglassBottom' : 'MdArrowForward'} className="h-4 w-4" />
                  {loading ? 'Fetching...' : 'Next'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Apply Sort and Filter */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                  <Icon name="MdFilterList" className="h-5 w-5" />
                  Step 2: Apply Filters & Sorting ({displayRecords.length} records)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Custom Sort Dropdown */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Icon name="MdSort" className="h-4 w-4 inline mr-1" />
                      Sort By
                    </label>
                    <div className="relative" data-dropdown="sort">
                      <button
                        onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                        className={`w-full px-3 py-2 rounded border text-left flex items-center justify-between transition ${isDark ? 'bg-slate-700 border-gray-600 text-white hover:bg-slate-600' : 'bg-white border-gray-300 text-slate-900 hover:bg-gray-50'}`}
                      >
                        <span>
                          {sort === 'timestamp-desc' && 'Latest First'}
                          {sort === 'timestamp-asc' && 'Oldest First'}
                          {sort === 'weight-desc' && 'Heaviest First'}
                          {sort === 'weight-asc' && 'Lightest First'}
                          {sort === 'carNumber-asc' && 'Number Plate (A-Z)'}
                          {sort === 'carNumber-desc' && 'Number Plate (Z-A)'}
                          {sort === 'status-asc' && 'Status (A-Z)'}
                        </span>
                        <Icon name={sortDropdownOpen ? 'MdExpandLess' : 'MdExpandMore'} className="h-4 w-4" />
                      </button>

                      {sortDropdownOpen && (
                        <div className={`absolute top-full left-0 mt-2 w-full rounded-lg border shadow-xl z-50 overflow-hidden ${isDark ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                          {[
                            { value: 'timestamp-desc', label: 'Latest First' },
                            { value: 'timestamp-asc', label: 'Oldest First' },
                            { value: 'weight-desc', label: 'Heaviest First' },
                            { value: 'weight-asc', label: 'Lightest First' },
                            { value: 'carNumber-asc', label: 'Number Plate (A-Z)' },
                            { value: 'carNumber-desc', label: 'Number Plate (Z-A)' },
                            { value: 'status-asc', label: 'Status (A-Z)' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSort(option.value);
                                setSortDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 transition ${sort === option.value ? (isDark ? 'bg-orange-600/30 text-orange-400' : 'bg-orange-50 text-orange-700') : (isDark ? 'text-gray-300 hover:bg-slate-700' : 'text-slate-900 hover:bg-gray-100')}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Custom Status Dropdown */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Icon name="MdFilterList" className="h-4 w-4 inline mr-1" />
                      Status
                    </label>
                    <div className="relative" data-dropdown="status">
                      <button
                        onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                        className={`w-full px-3 py-2 rounded border text-left flex items-center justify-between transition ${isDark ? 'bg-slate-700 border-gray-600 text-white hover:bg-slate-600' : 'bg-white border-gray-300 text-slate-900 hover:bg-gray-50'}`}
                      >
                        <span>
                          {selectedStatus === 'all' && 'All Status'}
                          {selectedStatus === 'ALLOWED' && 'Allowed'}
                          {selectedStatus === 'BLOCKED' && 'Blocked'}
                        </span>
                        <Icon name={statusDropdownOpen ? 'MdExpandLess' : 'MdExpandMore'} className="h-4 w-4" />
                      </button>

                      {statusDropdownOpen && (
                        <div className={`absolute top-full left-0 mt-2 w-full rounded-lg border shadow-xl z-50 overflow-hidden ${isDark ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                          {[
                            { value: 'all', label: 'All Status' },
                            { value: 'ALLOWED', label: 'Allowed' },
                            { value: 'BLOCKED', label: 'Blocked' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSelectedStatus(option.value);
                                setStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 transition ${selectedStatus === option.value ? (isDark ? 'bg-orange-600/30 text-orange-400' : 'bg-orange-50 text-orange-700') : (isDark ? 'text-gray-300 hover:bg-slate-700' : 'text-slate-900 hover:bg-gray-100')}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Weight Min */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Icon name="MdScatterPlot" className="h-4 w-4 inline mr-1" />
                      Min Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={selectedWeightMin}
                      onChange={(e) => setSelectedWeightMin(e.target.value)}
                      placeholder="Leave empty for no limit"
                      className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-slate-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-slate-900 placeholder-gray-600'}`}
                    />
                  </div>

                  {/* Weight Max */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Icon name="MdScatterPlot" className="h-4 w-4 inline mr-1" />
                      Max Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={selectedWeightMax}
                      onChange={(e) => setSelectedWeightMax(e.target.value)}
                      placeholder="Leave empty for no limit"
                      className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-slate-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-slate-900 placeholder-gray-600'}`}
                    />
                  </div>

                  {/* Date From */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Icon name="MdCalendarToday" className="h-4 w-4 inline mr-1" />
                      From Date
                    </label>
                    <input
                      type="date"
                      value={selectedDateFrom}
                      onChange={(e) => setSelectedDateFrom(e.target.value)}
                      className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-slate-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-slate-900'}`}
                    />
                  </div>

                  {/* Date To */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Icon name="MdCalendarToday" className="h-4 w-4 inline mr-1" />
                      To Date
                    </label>
                    <input
                      type="date"
                      value={selectedDateTo}
                      onChange={(e) => setSelectedDateTo(e.target.value)}
                      className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-slate-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-slate-900'}`}
                    />
                  </div>
                </div>

                {/* Records Preview - Show All */}
                <div className={`p-3 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-50'} max-h-64 overflow-y-auto border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  <div className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Icon name="MdViewList" className="h-4 w-4 inline mr-2" />
                    Preview: {displayRecords.length} records
                  </div>
                  {displayRecords.length === 0 ? (
                    <div className={`text-xs text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      No records match the selected filters
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {displayRecords.map((record, idx) => (
                        <div key={idx} className={`text-xs p-2 rounded ${isDark ? 'bg-slate-800 text-gray-300' : 'bg-white text-gray-700'} border-l-2 border-orange-500`}>
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <span className="font-medium">{record.carNumber || 'N/A'}</span>
                              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${record.status === 'ALLOWED' ? (isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800') : (isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800')}`}>
                                {record.status}
                              </span>
                            </div>
                            <span className="font-semibold">{record.weight}kg</span>
                          </div>
                          <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(record.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className={`flex-1 px-4 py-2 rounded border transition ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'} flex items-center justify-center gap-2`}
                >
                  <Icon name="MdArrowBack" className="h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={handleApplySortAndFilter}
                  className="flex-1 px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 transition flex items-center justify-center gap-2"
                >
                  <Icon name="MdArrowForward" className="h-4 w-4" />
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Choose Format & Export */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                  <Icon name="MdFileDownload" className="h-5 w-5" />
                  Step 3: Choose Export Format
                </h3>

                <div className="space-y-3">
                  {[
                    { value: 'csv', label: 'CSV (Spreadsheet)', icon: 'MdDescription', desc: 'Comma-separated values' },
                    { value: 'excel', label: 'Excel Sheet', icon: 'MdTableChart', desc: 'Microsoft Excel spreadsheet' },
                    { value: 'word', label: 'Word Document', icon: 'MdArticle', desc: 'Microsoft Word document' },
                    { value: 'pdf', label: 'PDF Document', icon: 'MdPictureAsPdf', desc: 'Portable document format' },
                  ].map((fmt) => (
                    <label
                      key={fmt.value}
                      className="flex items-center gap-3 p-3 rounded cursor-pointer border transition"
                      style={{borderColor: format === fmt.value ? '#EC6B1B' : (isDark ? '#4b5563' : '#e5e7eb'), backgroundColor: format === fmt.value ? (isDark ? '#1e3a3a' : '#fff7ed') : 'transparent'}}
                    >
                      <input
                        type="radio"
                        checked={format === fmt.value}
                        onChange={() => setFormat(fmt.value)}
                        className="w-4 h-4"
                      />
                      <Icon name={fmt.icon} className="h-5 w-5" />
                      <div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {fmt.label}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {fmt.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className={`p-3 rounded text-sm mt-4 ${isDark ? 'bg-green-900/20 text-green-300' : 'bg-green-50 text-green-700'}`}>
                  <div className="flex gap-2">
                    <Icon name="MdCheckCircle" className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p>Ready to export <strong>{displayRecords.length} records</strong> as <strong>{format.toUpperCase()}</strong></p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className={`flex-1 px-4 py-2 rounded border transition ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'} flex items-center justify-center gap-2`}
                >
                  <Icon name="MdArrowBack" className="h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={handleExport}
                  className="flex-1 px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition flex items-center justify-center gap-2"
                >
                  <Icon name="MdFileDownload" className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
