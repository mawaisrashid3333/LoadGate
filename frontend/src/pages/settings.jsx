/**
 * Settings Page
 * System configuration and settings
 */

'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import Icon from '@/components/Icon';

export default function SettingsPage() {
  const { isDark } = useTheme();
  const [settings, setSettings] = useState({
    maxWeight: 5000,
    calibrationFactor: 20.0,
    systemName: 'LoadGate System',
    location: 'Main Gate',
  });

  const ACTION_BUTTONS = [
    { icon: 'MdRefresh', label: 'Restart System' },
    { icon: 'MdBuild', label: 'Calibrate Scale' },
    { icon: 'MdTest', label: 'Test Barrier' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: isNaN(value) ? value : parseFloat(value),
    });
  };

  const handleSave = async () => {
    try {
      // TODO: Save settings to API
      alert('Settings saved successfully');
    } catch (error) {
      alert('Failed to save settings');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
        System Settings
      </h1>

      <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg space-y-4`}>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          General Settings
        </h2>

        <div>
          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            System Name
          </label>
          <input
            type="text"
            name="systemName"
            value={settings.systemName}
            onChange={handleChange}
            className="input"
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
            className="input"
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
            className="input"
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
            className="input"
          />
        </div>

        <button onClick={handleSave} className="btn-primary flex w-full items-center justify-center gap-2">
          <Icon name="MdSave" className="h-5 w-5" />
          Save Settings
        </button>
      </div>

      <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-lg`}>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Quick Actions
        </h2>
        <div className="mt-4 space-y-2">
          {ACTION_BUTTONS.map((action) => (
            <button key={action.label} className="btn-secondary flex w-full items-center justify-center gap-2">
              <Icon name={action.icon} className="h-5 w-5" />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
