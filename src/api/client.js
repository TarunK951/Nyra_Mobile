import axios from 'axios';
import { storage } from './storage';

const BASE_URL = process.env.API_BASE_URL || 'https://server.nyraai.io';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Skip auth header for login and refresh endpoints if needed, 
    // although generally sending it doesn't hurt unless the server rejects it.
    // The requirement says "except login/refresh".
    if (config.url.includes('/api/auth/login') || config.url.includes('/api/auth/refresh')) {
      return config;
    }

    const token = await storage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // On 401 -> call refresh, get new token, retry the same request once.
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        await storage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          await storage.setItem('refreshToken', newRefreshToken);
        }

        // Update the authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Retry the same request once
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and let the app handle redirection
        await storage.deleteItem('accessToken');
        await storage.deleteItem('refreshToken');
        await storage.deleteItem('user');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
