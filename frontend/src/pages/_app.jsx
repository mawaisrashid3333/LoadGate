/**
 * _app.js
 * Next.js application wrapper
 */

'use client';

import { useEffect } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import Layout from '@/components/Layout';
import { validateIcon, logUnavailableIcons } from '@/utils/iconValidator';
import '@/styles/globals.css';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Validate commonly used icons on mount
    if (process.env.NODE_ENV === 'development') {
      const iconsToCheck = [
        'MdDashboard',
        'MdDirectionsCar',
        'MdAnalytics',
        'MdSettings',
        'MdSun',
        'MdNightlight',
        'MdCheckCircle',
        'MdCancel',
        'MdSignalCellularAlt',
        'MdFileDownload',
        'MdTrendingUp',
        'MdBuild',
        'MdTest',
        'MdRefresh',
        'MdSave',
      ];
      
      iconsToCheck.forEach(icon => validateIcon(icon, '_app.jsx'));
      
      // Log summary after a short delay to allow all validations
      setTimeout(() => {
        logUnavailableIcons();
      }, 100);
    }
  }, []);

  return (
    <ThemeProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  );
}
