import { useMemo } from "react";
import { useMetadata } from "./useMetadata";
import { convertEntityMetadataToFormMetadata } from "../utils/metadataConverter";
import type { FormMetadata } from "../types/metadata";

/**
 * Hook para obter metadata de formulário a partir do metadata do backend
 * 
 * @param entityName Nome da entidade (ex: "event")
 * @param customMetadata Metadata customizado para sobrescrever/complementar
 * @returns FormMetadata pronto para uso no EntityForm
 */
export function useFormMetadata(
  entityName: string,
  customMetadata?: Partial<FormMetadata>
): {
  formMetadata: FormMetadata | null;
  isLoading: boolean;
  error: string | null;
} {
  const { metadata, isLoading, error } = useMetadata();

  const formMetadata = useMemo(() => {
    if (isLoading || error) return null;

    const entityMetadata = metadata.get(entityName);
    if (!entityMetadata) {
      return null;
    }

    // Se o backend enviou formFields, usa diretamente (novo formato)
    if (entityMetadata.formFields && entityMetadata.formFields.length > 0) {
      const converted = convertEntityMetadataToFormMetadata(entityMetadata, true);
      
      // Aplica customizações se fornecidas
      if (customMetadata) {
        return {
          ...converted,
          ...customMetadata,
          sections: customMetadata.sections || converted.sections,
        };
      }
      
      return converted;
    }

    // Fallback: Converte fields antigos (retrocompatibilidade)
    const converted = convertEntityMetadataToFormMetadata(entityMetadata, true);

    // Aplica customizações se fornecidas
    if (customMetadata) {
      return {
        ...converted,
        ...customMetadata,
        sections: customMetadata.sections || converted.sections,
      };
    }
    
    return converted;
  }, [metadata, entityName, isLoading, error, customMetadata]);

  return {
    formMetadata,
    isLoading,
    error,
  };
}
