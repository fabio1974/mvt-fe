import axios from "axios";

console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Interceptor para adicionar token de autorização automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// This file now only contains the axios configuration.
// All payment-related services have been moved to /services/payment.ts
