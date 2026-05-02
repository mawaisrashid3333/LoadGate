/**
 * SafeIcon Component
 * Wrapper for react-icons that validates and logs unavailable icons
 * 
 * Usage:
 * import SafeIcon from '@/components/SafeIcon';
 * <SafeIcon name="MdDashboard" className="h-5 w-5" />
 */

'use client';

import React from 'react';
import * as MdIcons from 'react-icons/md';
import { validateIcon } from '@/utils/iconValidator';

export default function SafeIcon({ name, className = '', context = 'SafeIcon' }) {
  // Validate icon exists
  validateIcon(name, context);
  
  // Get the icon component from react-icons
  const IconComponent = MdIcons[name];
  
  // If icon doesn't exist, return a fallback
  if (!IconComponent) {
    console.error(`❌ Icon component "${name}" could not be imported`);
    return (
      <div 
        className={`inline-flex items-center justify-center rounded-full bg-red-100 text-red-600 ${className}`}
        title={`Missing icon: ${name}`}
      >
        ?
      </div>
    );
  }
  
  return <IconComponent className={className} />;
}
