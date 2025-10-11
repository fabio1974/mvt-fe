import axios from "axios";
import { showToast } from "../utils/toast";

console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);

// Helper para normalizar URLs e evitar duplicação de /api
const normalizeUrl = (url: string): string => {
  const original = url;
  // Remove todas as ocorrências de /api do início da URL
  // Isso corrige tanto /api/organizations quanto /api/api/organizations
  let normalized = url;
  while (normalized.startsWith('/api/') || normalized.startsWith('/api')) {
    normalized = normalized.replace(/^\/api\/?/, '/');
  }
  // Se sobrou apenas '/', mantém assim
  normalized = normalized || '/';
  
  // Log apenas se houve normalização (debug)
  if (original !== normalized) {
    console.log(`[URL Normalizada] ${original} → ${normalized}`);
  }
  
  return normalized;
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Interceptor para normalizar URLs e evitar duplicação de /api
api.interceptors.request.use(
  (config) => {
    // Normaliza a URL para evitar /api/api
    if (config.url) {
      config.url = normalizeUrl(config.url);
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
