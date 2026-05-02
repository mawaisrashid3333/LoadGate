/**
 * Dashboard Page
 * Main landing and dashboard page
 */

'use client';

import Head from 'next/head';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  return (
    <>
      <Head>
        <title>LoadGate - Smart Vehicle Weighing System</title>
        <meta name="description" content="Smart Vehicle Weighing & Access Control System" />
      </Head>
      <Dashboard />
    </>
  );
}
