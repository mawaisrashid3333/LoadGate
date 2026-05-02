/**
 * Environment Configuration
 */

export const config = {
  // API Configuration
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  API_TIMEOUT: 10000,

  // UI Configuration
  ITEMS_PER_PAGE: 20,
  POLLING_INTERVAL: 5000, // ms

  // System Limits
  MAX_WEIGHT: 5000, // kg
  MAX_FILE_SIZE: 10485760, // 10MB

  // Feature Flags
  ENABLE_ANALYTICS: true,
  ENABLE_EXPORT: true,
  ENABLE_NOTIFICATIONS: true,
};

export default config;
