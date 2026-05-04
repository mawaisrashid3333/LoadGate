/**
 * _app.js
 * Next.js application wrapper
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider } from '@/context/ThemeContext';
import { LoadingProvider, useLoading } from '@/context/LoadingContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { validateIcon, logUnavailableIcons } from '@/utils/iconValidator';
import '@/styles/globals.css';

const PUBLIC_PAGES = ['/login'];

function AppContent({ Component, pageProps }) {
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();
  const { isAuthenticated, loading: authLoading } = useAuth();

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
        'MdSpeed',
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

  // Listen to router events for page navigation
  useEffect(() => {
    const handleRouterChangeStart = () => {
      startLoading('Loading page...');
    };

    const handleRouterChangeComplete = () => {
      stopLoading();
    };

    const handleRouterChangeError = () => {
      stopLoading();
    };

    router.events?.on('routeChangeStart', handleRouterChangeStart);
    router.events?.on('routeChangeComplete', handleRouterChangeComplete);
    router.events?.on('routeChangeError', handleRouterChangeError);

    return () => {
      router.events?.off('routeChangeStart', handleRouterChangeStart);
      router.events?.off('routeChangeComplete', handleRouterChangeComplete);
      router.events?.off('routeChangeError', handleRouterChangeError);
    };
  }, [router.events, startLoading, stopLoading]);

  // Check authentication for protected pages
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !PUBLIC_PAGES.includes(router.pathname)) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router.pathname, router]);

  // Show nothing while loading auth
  if (authLoading) {
    return null;
  }

  // Don't use Layout for login page
  if (PUBLIC_PAGES.includes(router.pathname)) {
    return <Component {...pageProps} />;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <AuthProvider>
          <AppContent Component={Component} pageProps={pageProps} />
        </AuthProvider>
      </LoadingProvider>
    </ThemeProvider>
  );
}
