/**
 * API Client Utility
 * Handles all API requests from frontend to backend
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Vehicles API
export const vehicleAPI = {
  getAll: (params) => apiClient.get('/vehicles', { params }),
  getById: (id) => apiClient.get(`/vehicles/${id}`),
  create: (data) => apiClient.post('/vehicles', data),
  delete: (id) => apiClient.delete(`/vehicles/${id}`),
  getAnalytics: (days) => apiClient.get(`/vehicles/analytics/summary?days=${days}`),
  export: (params) => apiClient.get('/vehicles/export', { params, responseType: 'blob' }),
};

// Arduino API
export const arduinoAPI = {
  getStatus: () => apiClient.get('/arduino/status'),
  getLoadCells: () => apiClient.get('/arduino/load-cells'),
  sendCommand: (command) => apiClient.post('/arduino/command', { command }),
  getEvents: () => apiClient.get('/arduino/events/stream'),
};

// Camera API
export const cameraAPI = {
  getStatus: () => apiClient.get('/camera/status'),
  getStream: () => apiClient.get('/camera/stream'),
  captureSnapshot: () => apiClient.post('/camera/snapshot'),
};

export default apiClient;
