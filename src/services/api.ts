import axios from "axios";
import { showToast } from "../utils/toast";

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

// Interceptor para detectar token expirado
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      const token = localStorage.getItem("authToken");
      
      if (token) {
        // Só mostra a mensagem se havia um token (ou seja, usuário estava logado)
        showToast("Sessão expirada. Faça login novamente.", "warning");
        
        // Limpa o localStorage
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("organizationId");
        
        // Redireciona para login após 1 segundo
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      }
    }
    
    return Promise.reject(error);
  }
);

// This file now only contains the axios configuration.
// All payment-related services have been moved to /services/payment.ts
