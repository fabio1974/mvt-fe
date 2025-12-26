import axios from "axios";
import { showToast } from "../utils/toast";

// Helper para normalizar URLs e evitar duplicação de /api
const normalizeUrl = (url: string): string => {
  if (!url) return url;
  
  // Remove duplicações de /api/api → /api em qualquer lugar da URL
  const normalized = url.replace(/\/api\/api(\/|$)/g, '/api$1');
  
  return normalized;
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Interceptor para normalizar URLs e evitar duplicação de /api
api.interceptors.request.use(
  (config) => {
    // Constrói a URL completa para normalização
    const baseURL = config.baseURL || '';
    const url = config.url || '';
    
    // Se a URL é relativa, concatena com baseURL
    let fullUrl = url;
    if (url && !url.startsWith('http')) {
      fullUrl = baseURL + url;
    }
    
    // Normaliza a URL completa
    const normalizedUrl = normalizeUrl(fullUrl);
    
    // Se a URL foi normalizada, atualiza o config
    if (normalizedUrl !== fullUrl) {
      // Remove o baseURL da URL normalizada para manter apenas o path relativo
      if (normalizedUrl.startsWith(baseURL)) {
        config.url = normalizedUrl.substring(baseURL.length);
      } else {
        config.url = normalizedUrl;
      }
    }
    
    // Adiciona token de autorização
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
