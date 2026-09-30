// frontend/src/api.js
import axios from 'axios';

// 1. Define base URLs with a fallback for local development
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://frost-backend.onrender.com';
export const ML_URL = import.meta.env.VITE_ML_URL || 'http://localhost:8000';

// 2. Export Axios instances 
export const backendApi = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

export const mlApi = axios.create({
  baseURL: ML_URL,
});

// Robust fetch wrapper
export const safeFetch = async (url, options = {}) => {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type");
  
  if (!response.ok) {
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }
    console.warn('[API Error]: Backend may be sleeping or unreachable.');
    throw new Error(`[API Error]: Backend may be sleeping or unreachable. (${response.status})`);
  }

  if (!contentType || !contentType.includes("application/json")) {
    console.warn('[API Error]: Backend may be sleeping or unreachable.');
    throw new Error(`[API Error]: Backend may be sleeping or unreachable. (Invalid format)`);
  }

  return response;
};

// 3. Dynamic WebSocket URL Generator
// This converts http:// to ws:// for local dev, and https:// to wss:// for production
export const getWsUrl = (path = '') => {
  return BACKEND_URL.replace(/^http/, 'ws') + path;
};
