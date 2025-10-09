import type { EntityMetadata, FormMetadata, FormFieldMetadata, FormSectionMetadata, FieldMetadata } from "../types/metadata";

/**
 * Converte FieldType do backend para FormFieldType do formulário
 */
function mapFieldType(backendType: string): FormFieldMetadata['type'] {
  const typeMap: Record<string, FormFieldMetadata['type']> = {
    'string': 'text',
    'integer': 'number',
    'long': 'number',
    'double': 'number',
    'number': 'number',
    'boolean': 'boolean',
    'date': 'date',
    'datetime': 'date',
    'enum': 'select',
    'select': 'select', // Backend já envia "select" para enums
  };

  return typeMap[backendType] || 'text';
}

/**
 * Converte um campo do backend em campo de formulário
 */
function convertFieldToFormField(field: FieldMetadata): FormFieldMetadata | null {
  // Ignora campos que não devem aparecer em formulários
  if (field.name === 'id' || field.name === 'createdAt' || field.name === 'updatedAt') {
    return null;
  }

  // Detecta campos de relacionamento (tipo 'nested' com relationship)
  if (field.type === 'nested' && field.relationship) {
    // Só processa relacionamentos 1:N
    if (field.relationship.type === 'ONE_TO_MANY') {
      // Extrai o nome singular (remove 's' do final se houver)
      const singularName = field.name.endsWith('s') && field.name.length > 1
        ? field.name.slice(0, -1) 
        : field.name;

      // Converte os campos da entidade relacionada
      const relatedFields: FormFieldMetadata[] = field.relationship.fields
        ? field.relationship.fields
            .map(convertFieldToFormField)
            .filter((f): f is FormFieldMetadata => f !== null)
        : [
            // Fallback: campos padrão se o backend não enviou
            {
              name: 'name',
              label: 'Nome',
              type: 'text',
              required: true,
            },
          ];

      return {
        name: field.name,
        label: field.label,
        type: 'array',
        required: field.required || false,
        arrayConfig: {
          itemType: 'object',
          addLabel: `Adicionar ${singularName}`,
          itemLabel: `${singularName} {index}`,
          minItems: field.required ? 1 : 0,
          maxItems: 100,
          fields: relatedFields,
        },
      };
    }
    // Outros tipos de relacionamento (ONE_TO_ONE, MANY_TO_MANY) não são suportados ainda
    return null;
  }

  // Se o campo tem options, é um select (enum)
  const hasOptions = field.options && field.options.length > 0;
  const mappedType = hasOptions ? 'select' : mapFieldType(field.type);

  const formField: FormFieldMetadata = {
    name: field.name,
    label: field.label,
    type: mappedType,
    required: field.required || false,
    placeholder: field.placeholder || `Digite ${field.label.toLowerCase()}`,
  };

  // Adiciona validações se existirem
  if (field.min !== undefined || field.max !== undefined || 
      field.minLength !== undefined || field.maxLength !== undefined || 
      field.pattern) {
    formField.validation = {
      min: field.min,
      max: field.max,
      minLength: field.minLength,
      maxLength: field.maxLength,
      pattern: field.pattern,
    };
  }

  // Adiciona valor padrão
  if (field.defaultValue !== undefined && field.defaultValue !== null) {
    formField.defaultValue = field.defaultValue as string | number | boolean | Date;
  }

  // Adiciona opções para enums/selects
  if (hasOptions) {
    formField.options = field.options;
  }

  return formField;
}

/**
 * Detecta relacionamentos 1:N no metadata
 * Procura por campos do tipo 'nested' com relationship ONE_TO_MANY
 */
/**
 * Converte EntityMetadata (do backend) em FormMetadata (para formulários)
 * 
 * @param entityMetadata Metadata da entidade vindo do backend
 * @param includeRelationships Se deve incluir campos de relacionamento 1:N
 */
export function convertEntityMetadataToFormMetadata(
  entityMetadata: EntityMetadata,
  includeRelationships: boolean = true
): FormMetadata {
  // Usa formFields se disponível (novo formato), senão usa fields (formato antigo)
  const sourceFields = entityMetadata.formFields && entityMetadata.formFields.length > 0
    ? entityMetadata.formFields
    : (entityMetadata.fields || []);

  console.log('[convertEntityMetadataToFormMetadata] Using source fields:', {
    hasFormFields: !!(entityMetadata.formFields && entityMetadata.formFields.length > 0),
    sourceFieldsCount: sourceFields.length,
    sourceFields: sourceFields.map(f => ({
      name: f.name,
      type: f.type,
      hasRelationship: !!f.relationship,
      hasOptions: !!(f.options && f.options.length > 0)
    }))
  });

  // Separa campos básicos dos relacionamentos
  const basicFields: FormFieldMetadata[] = [];
  const relationshipFields: FormFieldMetadata[] = [];

  sourceFields.forEach(field => {
    // Se o campo tem tipo 'nested' e includeRelationships é true, é um relacionamento
    if (field.type === 'nested' && field.relationship && includeRelationships) {
      const relationshipField = convertFieldToFormField(field);
      if (relationshipField) {
        relationshipFields.push(relationshipField);
      }
    } else if (field.type !== 'nested') {
      // Campos normais (não nested)
      const formField = convertFieldToFormField(field);
      if (formField) {
        basicFields.push(formField);
      }
    }
  });

  console.log('[convertEntityMetadataToFormMetadata] Processed fields:', {
    basicFieldsCount: basicFields.length,
    relationshipFieldsCount: relationshipFields.length,
    basicFields: basicFields.map(f => f.name),
    relationshipFields: relationshipFields.map(f => f.name)
  });

  // Organiza em seções
  const sections: FormSectionMetadata[] = [];

  if (basicFields.length > 0) {
    sections.push({
      id: 'basic-info',
      title: 'Informações Básicas',
      fields: basicFields,
      columns: 2,
    });
  }

  if (relationshipFields.length > 0) {
    sections.push({
      id: 'relationships',
      title: 'Itens Relacionados',
      fields: relationshipFields,
      columns: 1,
    });
  }

  return {
    entityName: entityMetadata.name,
    title: entityMetadata.label,
    description: `Formulário de ${entityMetadata.label.toLowerCase()}`,
    endpoint: entityMetadata.endpoint,
    sections,
    submitLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  };
}

/**
 * Mescla FormMetadata do backend com customizações do frontend
 * Útil para manter algumas customizações enquanto usa dados do backend
 */
export function mergeFormMetadata(
  backendMetadata: FormMetadata,
  customMetadata?: Partial<FormMetadata>
): FormMetadata {
  if (!customMetadata) return backendMetadata;

  return {
    ...backendMetadata,
    ...customMetadata,
    sections: customMetadata.sections || backendMetadata.sections,
  };
}
