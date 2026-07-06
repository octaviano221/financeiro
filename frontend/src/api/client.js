import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

export const api = axios.create({
  baseURL: apiBaseUrl
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gfi_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
