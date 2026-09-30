import axios from 'axios';

// Create a centralized Axios instance for the Node Backend
export const backendApi = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  withCredentials: true,
});

// Create a centralized Axios instance for the Python ML Service
export const mlApi = axios.create({
  baseURL: import.meta.env.VITE_ML_URL || 'http://localhost:8000',
});

// Export helper for the WebSocket CRDT sync
export const getWsUrl = (path = '/crdt') => {
  const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  return base.replace(/^http/, 'ws') + path;
};
