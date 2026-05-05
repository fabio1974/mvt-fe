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

// Páginas públicas onde 401 é esperado (não dispara overlay nem redirect).
const PUBLIC_PATHS = [/^\/$/, /^\/login/, /^\/registrar/, /^\/parceiro/, /^\/track/, /^\/recuperar-senha/, /^\/nova-senha/, /^\/confirmar-email/, /^\/reenviar-confirmacao/];

const isOnPublicPage = () => PUBLIC_PATHS.some((re) => re.test(window.location.pathname));

// Estado pra evitar disparar o overlay/redirect mais de uma vez por sessão
let sessionExpiredHandled = false;

// Interceptor para detectar token expirado / sessão inválida.
// Em vez de Promise.reject puro (que dispara mensagens genéricas como "Erro ao
// carregar dados" nos componentes), dispara um evento global que renderiza o
// SessionExpiredOverlay full-screen com mensagem amigável + redirect.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !sessionExpiredHandled && !isOnPublicPage()) {
      sessionExpiredHandled = true;

      // Limpa credenciais expiradas (sempre, com ou sem token no localStorage)
      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("organizationId");

      // Aciona overlay (App.tsx ouve via SessionExpiredOverlay)
      window.dispatchEvent(new Event("session-expired"));

      // Toast de fallback (caso o overlay não esteja montado por algum motivo)
      showToast("Sessão expirada. Faça login novamente.", "warning");
    }

    return Promise.reject(error);
  }
);

// This file now only contains the axios configuration.
// All payment-related services have been moved to /services/payment.ts
