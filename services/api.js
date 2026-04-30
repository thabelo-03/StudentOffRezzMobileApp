// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../database/firebaseConfig'; // Import Firebase auth

const DEFAULT_BASE_URL = 'https://studentoffrezzmobileapp.onrender.com';

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

// This part is crucial for the 'auth' middleware in your router
api.interceptors.request.use(async (config) => {
  const firebaseUser = auth.currentUser;
  if (firebaseUser) {
    const idToken = await firebaseUser.getIdToken(true); // Force refresh
    config.headers.Authorization = `Bearer ${idToken}`;
  } else {
    // Fallback for cases where firebaseUser is not yet available,
    // or if you still have non-Firebase authenticated routes
    const storedToken = await AsyncStorage.getItem('token');
    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`;
    }
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
