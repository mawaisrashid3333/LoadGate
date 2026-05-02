/**
 * Icon Component Wrapper
 * Safely renders react-icons with fallbacks for SSR/hydration issues
 */

'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import icons with ssr: false
const IconWrapper = dynamic(
  async () => {
    const md = await import('react-icons/md');
    
    return {
      default: ({ icon, className = 'h-5 w-5' }) => {
        const Icon = md[icon];
        if (!Icon) {
          console.warn(`Icon ${icon} not found in react-icons/md`);
          return <div className={`${className} bg-gray-400 rounded`} />;
        }
        return <Icon className={className} />;
      }
    };
  },
  { 
    ssr: false,
    loading: () => <div className="h-5 w-5 bg-gray-300 rounded animate-pulse" />
  }
);

/**
 * Reusable Icon Component
 * Usage: <Icon name="MdDashboard" className="h-5 w-5" />
 */
export default function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <React.Suspense fallback={<div className={className} />}>
      <IconWrapper icon={name} className={className} />
    </React.Suspense>
  );
}
