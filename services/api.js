// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Points at the ThabStay web backend (Express/Mongo). Override per-environment
// with EXPO_PUBLIC_API_BASE_URL, e.g. http://<your-LAN-ip>:3001 for local dev.
const DEFAULT_BASE_URL = 'https://thabstay.co.zw';

const configuredBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL)
  .trim()
  .replace(/\/+$/, '');

const apiBaseUrl = configuredBaseUrl.endsWith('/api')
  ? configuredBaseUrl
  : `${configuredBaseUrl}/api`;

export const BASE_URL = configuredBaseUrl.endsWith('/api')
  ? configuredBaseUrl.replace(/\/api$/, '')
  : configuredBaseUrl;

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Identify this app to the backend's optional API gate. No-op unless
// EXPO_PUBLIC_API_KEY is set (and APP_API_KEY is enabled server-side).
if (process.env.EXPO_PUBLIC_API_KEY) {
  api.defaults.headers.common['x-api-key'] = process.env.EXPO_PUBLIC_API_KEY;
}

// Attach the backend-issued JWT (stored at login/register) as a Bearer token.
// The backend's `protect` middleware reads this Authorization header.
api.interceptors.request.use(async (config) => {
  const storedToken = await AsyncStorage.getItem('token');
  if (storedToken) {
    config.headers.Authorization = `Bearer ${storedToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      await AsyncStorage.multiRemove(['token', 'user']);
      // You can add logic here to redirect to Login
      // Alert.alert("Session Expired", "Please login again."); // Remove or handle for React Native context
    }
    return Promise.reject(error);
  }
);

export default api;
