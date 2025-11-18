import { api } from './api';
import type { EntityMetadata, MetadataResponse } from '../types/metadata';

class MetadataService {
  private metadataCache: Map<string, EntityMetadata> = new Map();
  private isLoaded = false;

  /**
   * Carrega todos os metadados do backend via /api/metadata
   */
  async loadMetadata(): Promise<void> {
    if (this.isLoaded) return;

    try {
      console.log('🔄 MetadataService: Requesting /api/metadata endpoint...');
      const response = await api.get<MetadataResponse>('/api/metadata');
      const metadata = response.data;

      // Armazena no cache
      Object.entries(metadata).forEach(([entityName, entityMetadata]) => {
        this.metadataCache.set(entityName, entityMetadata);
      });

      this.isLoaded = true;
      console.log('Metadata loaded successfully:', metadata);
    } catch (error) {
      console.error('Error loading metadata:', error);
      throw error;
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
