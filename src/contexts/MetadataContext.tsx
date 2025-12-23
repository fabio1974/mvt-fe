import React, { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { metadataService } from "../services/metadata";
import type { EntityMetadata } from "../types/metadata";

export interface MetadataContextType {
  metadata: Map<string, EntityMetadata>;
  isLoading: boolean;
  error: string | null;
  getEntityMetadata: (entityName: string) => EntityMetadata | undefined;
  reloadMetadata: () => Promise<void>;
}

export const MetadataContext = createContext<MetadataContextType | undefined>(
  undefined
);

interface MetadataProviderProps {
  children: ReactNode;
}

export const MetadataProvider: React.FC<MetadataProviderProps> = ({
  children,
}) => {
  const [metadata, setMetadata] = useState<Map<string, EntityMetadata>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetadata = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await metadataService.loadMetadata();
      const loadedMetadata = metadataService.getAllMetadata();
      setMetadata(loadedMetadata);
    } catch (err) {
      const errorMessage = "Erro ao carregar metadata do sistema";
      setError(errorMessage);
      console.error("❌", errorMessage, err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetadata();
  }, []);

  const getEntityMetadata = (
    entityName: string
  ): EntityMetadata | undefined => {
    return metadata.get(entityName);
  };

  const reloadMetadata = async () => {
    metadataService.clearCache();
    await loadMetadata();
  };

  const value: MetadataContextType = {
    metadata,
    isLoading,
    error,
    getEntityMetadata,
    reloadMetadata,
  };

  return (
    <MetadataContext.Provider value={value}>
      {children}
    </MetadataContext.Provider>
  );
};
