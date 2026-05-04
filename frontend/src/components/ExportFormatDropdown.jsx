/**
 * Export Format Dropdown Component
 * Custom dropdown for selecting chart export format
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

const FORMAT_OPTIONS = [
  { value: 'png', label: 'PNG', icon: 'MdImage' },
  { value: 'jpg', label: 'JPG', icon: 'MdImage' },
  { value: 'jpeg', label: 'JPEG', icon: 'MdImage' },
  { value: 'svg', label: 'SVG', icon: 'MdImage' },
];

export default function ExportFormatDropdown({ isDark, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('png');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (format) => {
    setSelectedFormat(format);
    setIsOpen(false);
    onSelect(format);
  };

  const selectedOption = FORMAT_OPTIONS.find((opt) => opt.value === selectedFormat);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition ${
          isDark
            ? 'border-gray-700 bg-slate-700 text-gray-300 hover:bg-slate-600'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Icon name={selectedOption?.icon || 'MdImage'} className="h-4 w-4" />
        <span className="text-sm font-medium">{selectedOption?.label}</span>
        <Icon
          name={isOpen ? 'MdExpandLess' : 'MdExpandMore'}
          className="h-4 w-4"
        />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 z-50 mt-2 w-40 rounded-lg border shadow-lg ${
            isDark
              ? 'border-gray-700 bg-slate-700'
              : 'border-gray-200 bg-white'
          }`}
        >
          {FORMAT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`flex w-full items-center gap-2 px-4 py-3 text-sm transition ${
                selectedFormat === option.value
                  ? isDark
                    ? 'bg-slate-600 text-orange-500'
                    : 'bg-gray-100 text-orange-600'
                  : isDark
                  ? 'text-gray-300 hover:bg-slate-600'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${option.value !== FORMAT_OPTIONS[FORMAT_OPTIONS.length - 1].value ? 'border-b border-gray-700' : ''}`}
            >
              <Icon name={option.icon} className="h-4 w-4" />
              <span>{option.label}</span>
              {selectedFormat === option.value && (
                <Icon name="MdCheckCircle" className="ml-auto h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
