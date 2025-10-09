import { useContext } from 'react';
import { MetadataContext } from '../contexts/MetadataContext';
import type { MetadataContextType } from '../contexts/MetadataContext';

export const useMetadata = (): MetadataContextType => {
  const context = useContext(MetadataContext);
  if (context === undefined) {
    throw new Error('useMetadata deve ser usado dentro de um MetadataProvider');
  }
  return context;
};
