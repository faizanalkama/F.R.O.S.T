// frontend/src/api.js
import axios from 'axios';

// 1. Define base URLs with a fallback for local development
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
export const ML_URL = import.meta.env.VITE_ML_URL || 'http://localhost:8000';

// 2. Export Axios instances 
export const backendApi = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

export const mlApi = axios.create({
  baseURL: ML_URL,
});

// 3. Dynamic WebSocket URL Generator
// This converts http:// to ws:// for local dev, and https:// to wss:// for production
export const getWsUrl = (path = '') => {
  return BACKEND_URL.replace(/^http/, 'ws') + path;
};
