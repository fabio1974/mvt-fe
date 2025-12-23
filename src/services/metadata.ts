import { api } from './api';
import type { EntityMetadata, MetadataResponse } from '../types/metadata';
import { VERSION } from '../version';

const METADATA_STORAGE_KEY = 'app_metadata_cache';
const METADATA_VERSION_KEY = 'app_metadata_version';
const METADATA_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas em ms

// Detecta se está em desenvolvimento
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

interface CachedMetadata {
  data: MetadataResponse;
  timestamp: number;
  version: string;
}

class MetadataService {
  private metadataCache: Map<string, EntityMetadata> = new Map();
  private isLoaded = false;

  /**
   * Carrega todos os metadados do backend via /api/metadata
   * Em desenvolvimento: sempre busca do backend (sem cache)
   * Em produção: usa cache do localStorage se disponível e válido
   */
  async loadMetadata(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Em desenvolvimento, sempre busca do backend (ignora cache)
      if (isDevelopment) {
        const response = await api.get<MetadataResponse>('/api/metadata');
        const metadata = response.data;

        // Armazena no cache em memória (mas não no localStorage)
        this.populateCache(metadata);

        this.isLoaded = true;
        return;
      }

      // Em produção, usa o comportamento com cache
      // Tentar carregar do localStorage primeiro
      const cachedMetadata = this.loadFromLocalStorage();
      
      if (cachedMetadata) {
        this.populateCache(cachedMetadata);
        this.isLoaded = true;
        
        // Verifica se o cache é antigo (> 24h) e atualiza em background
        const cacheAge = Date.now() - this.getCacheTimestamp();
        if (cacheAge > METADATA_CACHE_DURATION) {
          this.refreshMetadataInBackground();
        }
        return;
      }

      // Se não tem cache, carrega do backend
      const response = await api.get<MetadataResponse>('/api/metadata');
      const metadata = response.data;

      // Salva no localStorage
      this.saveToLocalStorage(metadata);

      // Armazena no cache em memória
      this.populateCache(metadata);

      this.isLoaded = true;
    } catch (error) {
      console.error('❌ Error loading metadata:', error);
      
      // Se falhar, tenta usar cache mesmo que expirado (apenas em produção)
      if (!isDevelopment) {
        const cachedMetadata = this.loadFromLocalStorage(true);
        if (cachedMetadata) {
          this.populateCache(cachedMetadata);
          this.isLoaded = true;
          return;
        }
      }
      
      throw error;
    }
  }

  /**
   * Atualiza metadata em background sem bloquear a aplicação
   */
  private async refreshMetadataInBackground(): Promise<void> {
    try {
      const response = await api.get<MetadataResponse>('/api/metadata');
      const metadata = response.data;
      
      this.saveToLocalStorage(metadata);
      this.populateCache(metadata);
    } catch (error) {
      console.warn('⚠️ Falha ao atualizar metadata em background:', error);
    }
  }

  /**
   * Popula o cache em memória com os dados
   */
  private populateCache(metadata: MetadataResponse): void {
    this.metadataCache.clear();
    Object.entries(metadata).forEach(([entityName, entityMetadata]) => {
      this.metadataCache.set(entityName, entityMetadata);
    });
  }

  /**
   * Carrega metadata do localStorage
   */
  private loadFromLocalStorage(ignoreExpiration = false): MetadataResponse | null {
    try {
      const cached = localStorage.getItem(METADATA_STORAGE_KEY);
      if (!cached) return null;

      const parsedCache: CachedMetadata = JSON.parse(cached);
      
      // Verifica se a versão mudou (invalida cache)
      if (parsedCache.version !== VERSION) {
        return null;
      }
      
      // Verifica se o cache ainda é válido
      const now = Date.now();
      const cacheAge = now - parsedCache.timestamp;
      
      if (!ignoreExpiration && cacheAge > METADATA_CACHE_DURATION) {
        return null;
      }

      return parsedCache.data;
    } catch (error) {
      console.error('❌ Erro ao ler cache do localStorage:', error);
      // Limpa cache corrompido
      localStorage.removeItem(METADATA_STORAGE_KEY);
      localStorage.removeItem(METADATA_VERSION_KEY);
      return null;
    }
  }

  /**
   * Salva metadata no localStorage
   */
  private saveToLocalStorage(metadata: MetadataResponse): void {
    try {
      const cacheData: CachedMetadata = {
        data: metadata,
        timestamp: Date.now(),
        version: VERSION, // Usa a versão da aplicação
      };

      localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(METADATA_VERSION_KEY, cacheData.version);
    } catch (error) {
      console.error('❌ Erro ao salvar cache no localStorage:', error);
      // Se falhar (ex: quota exceeded), apenas loga mas não quebra
    }
  }

  /**
   * Obtém o timestamp do cache
   */
  private getCacheTimestamp(): number {
    try {
      const cached = localStorage.getItem(METADATA_STORAGE_KEY);
      if (!cached) return 0;
      
      const parsedCache: CachedMetadata = JSON.parse(cached);
      return parsedCache.timestamp;
    } catch {
      return 0;
    }
  }

  /**
   * Obtém metadata de uma entidade específica
   */
  getEntityMetadata(entityName: string): EntityMetadata | undefined {
    return this.metadataCache.get(entityName);
  }

  /**
   * Verifica se os metadados foram carregados
   */
  isMetadataLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Limpa o cache de metadados (útil para recarregar)
   */
  clearCache(): void {
    this.metadataCache.clear();
    this.isLoaded = false;
    
    // Remove do localStorage também
    localStorage.removeItem(METADATA_STORAGE_KEY);
    localStorage.removeItem(METADATA_VERSION_KEY);
  }

  /**
   * Obtém todos os metadados carregados
   */
  getAllMetadata(): Map<string, EntityMetadata> {
    return this.metadataCache;
  }
}

// Exporta uma instância singleton
export const metadataService = new MetadataService();
