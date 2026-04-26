import type { EntityMetadata, FormMetadata, FormFieldMetadata, FormSectionMetadata, FieldMetadata } from "../types/metadata";

/**
 * Converte FieldType do backend para FormFieldType do formulário
 */
function mapFieldType(backendType: string): FormFieldMetadata['type'] {
  const typeMap: Record<string, FormFieldMetadata['type']> = {
    'string': 'text',
    'text': 'text',
    'textarea': 'textarea', // ← IMPORTANTE: Preserva textarea
    'integer': 'number',
    'long': 'number',
    'double': 'number',
    'number': 'number',
    'currency': 'number', // ← Adiciona currency
    'boolean': 'boolean',
    'date': 'date',
    'datetime': 'date',
    'enum': 'select',
    'select': 'select', // Backend já envia "select" para enums
    'multiselect': 'multiselect', // ← Multi-seleção com checkboxes (CSV)
    'markdown': 'markdown', // ← Editor de markdown com toolbar
    'city': 'city', // Tipo especial para cidades
    'entity': 'entity', // ← Adiciona entity
    'nested': 'array', // ← Adiciona nested
    'nested-one': 'nested-one', // ← OneToOne inline (sem add/remove)
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
      // 🚫 Lista de campos que devem ser sempre ocultados em nested/array fields
      const alwaysHiddenInNested = ['currentParticipants', 'createdAt', 'updatedAt', 'id'];
      
      const relatedFields: FormFieldMetadata[] = field.relationship.fields
        ? field.relationship.fields
            .filter(f => {
              // console.log(`🔍 [Nested Field Check] ${f.name} - visible: ${f.visible} (inside ${field.name})`);
              
              // Ignora campos na lista de sempre ocultos
              if (alwaysHiddenInNested.includes(f.name)) {
                // console.log(`🚫 [convertFieldToFormField] Auto-hiding field: ${f.name} (in alwaysHiddenInNested list)`);
                return false;
              }
              
              // Ignora campos com visible === false (explicitamente false, não null ou undefined)
              if (f.visible === false) {
                // console.log(`❌ [convertFieldToFormField] Skipping hidden nested field: ${f.name} (inside ${field.name})`);
                return false;
              }
              return true;
            })
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
          // Para endereços de usuário, permite apenas 1 item
          maxItems: field.name === 'addresses' ? 1 : 100,
          fields: relatedFields,
        },
      };
    }
    // Outros tipos de relacionamento (MANY_TO_MANY) não são suportados ainda
    return null;
  }

  // Detecta campos OneToOne nested (tipo 'nested-one' com relationship ONE_TO_ONE)
  if (field.type === 'nested-one' && field.relationship) {
    if (field.relationship.type === 'ONE_TO_ONE') {
      const alwaysHiddenInNested = ['currentParticipants', 'createdAt', 'updatedAt', 'id', 'user'];

      const relatedFields: FormFieldMetadata[] = field.relationship.fields
        ? field.relationship.fields
            .filter(f => {
              if (alwaysHiddenInNested.includes(f.name)) return false;
              if (f.visible === false) return false;
              return true;
            })
            .map(convertFieldToFormField)
            .filter((f): f is FormFieldMetadata => f !== null)
        : [];

      return {
        name: field.name,
        label: field.label,
        type: 'nested-one',
        required: false,
        nestedOneConfig: {
          fields: relatedFields,
        },
      };
    }
    return null;
  }

  // Se o campo tem options, é um select (enum)
  const hasOptions = field.options && field.options.length > 0;
  
  // ✅ Detecta relacionamentos MANY_TO_ONE (ex: delivery.courier -> user)
  // Backend envia como type: "string" mas com relationship.type = "MANY_TO_ONE"
  const isManyToOneRelationship = 
    field.relationship && 
    field.relationship.type === 'MANY_TO_ONE';

  // 📍 Detecta campos de endereço COMPLETO que devem usar o AddressFieldWithMap
  // NOTA: Campos como "street", "number", "neighborhood" são preenchidos PELO mapa,
  // então devem continuar como campos de texto simples
  const isAddressField = 
    field.name === 'address' ||
    field.name === 'fullAddress' ||
    field.name === 'endereco' ||
    field.name === 'enderecoCompleto' ||
    (field.name.toLowerCase().includes('address') && 
     !field.name.includes('Id') && 
     !field.name.includes('street') &&
     !field.name.includes('Data'));

  // 📍 Detecta campos de coordenadas - devem ser readonly
  const isCoordinateField = 
    field.name === 'latitude' || 
    field.name === 'longitude' ||
    field.name === 'lat' ||
    field.name === 'lng' ||
    field.name.toLowerCase() === 'latitude' ||
    field.name.toLowerCase() === 'longitude';
  
  // Se o backend já enviou um tipo explícito como "multiselect" ou "markdown", respeita;
  // caso contrário, hasOptions cai para 'select' (enum). MANY_TO_ONE → 'entity'; address → 'address'.
  const explicitType = mapFieldType(field.type);
  const isExplicitFormType = explicitType === 'multiselect' || explicitType === 'markdown' || explicitType === 'textarea';
  const mappedType = isExplicitFormType
    ? explicitType
    : hasOptions
      ? 'select'
      : isManyToOneRelationship
        ? 'entity'
        : isAddressField
          ? 'address'
          : explicitType;

  const formField: FormFieldMetadata = {
    name: field.name,
    label: field.label,
    type: mappedType,
    width: field.width, // Largura no grid de 12 colunas
    required: field.required || false,
    // Campos de coordenadas são sempre readonly (preenchidos pelo mapa)
    readonly: field.readonly || isCoordinateField,
    placeholder: field.placeholder || `Digite ${field.label.toLowerCase()}`,
    format: field.format || undefined, // Formato de exibição (ex: "dd/MM/yyyy HH:mm")
    relationship: field.relationship, // Mantém informação de relacionamento
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

  // ✅ Adiciona entityConfig para campos do tipo 'entity'
  if (mappedType === 'entity' && field.relationship) {
    const relationship = field.relationship as any;
    formField.entityConfig = {
      entityName: relationship.targetEntity || field.name,
      endpoint: relationship.targetEndpoint || `/api/${relationship.targetEntity || field.name}s`,
      labelField: relationship.labelField || 'name',
      valueField: 'id',
      renderAs: 'typeahead' as const, // Usa typeahead por padrão para melhor UX
    };
    // console.log(`✅ [metadataConverter] EntityConfig criado para campo: ${field.name}`, formField.entityConfig);
  }

  // 🧮 Adiciona campos computados
  if (field.computed) {
    formField.computed = field.computed;
    // console.log(`✅ [metadataConverter] Campo computado detectado: ${field.name} -> função: ${field.computed}`);
  }
  
  if (field.computedDependencies && field.computedDependencies.length > 0) {
    formField.computedDependencies = field.computedDependencies;
    // console.log(`✅ [metadataConverter] Dependências: ${field.name} -> [${field.computedDependencies.join(', ')}]`);
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

  // DEBUG: Log campos booleanos recebidos do backend
  if (entityMetadata.name === 'bankAccount') {
    const booleanSourceFields = sourceFields.filter(f => f.type === 'boolean');
    console.log('🔍 [convertEntityMetadataToFormMetadata] bankAccount - Campos booleanos do backend:', {
      count: booleanSourceFields.length,
      fields: booleanSourceFields.map(f => ({ name: f.name, label: f.label, type: f.type }))
    });
  }

  // console.log('[convertEntityMetadataToFormMetadata] Using source fields:', {
  //   hasFormFields: !!(entityMetadata.formFields && entityMetadata.formFields.length > 0),
  //   sourceFieldsCount: sourceFields.length,
  //   sourceFields: sourceFields.map(f => ({
  //     name: f.name,
  //     type: f.type,
  //     hasRelationship: !!f.relationship,
  //     hasOptions: !!(f.options && f.options.length > 0),
  //     computed: f.computed,
  //     computedDependencies: f.computedDependencies
  //   }))
  // });

  // Separa campos básicos dos relacionamentos
  const basicFields: FormFieldMetadata[] = [];
  const relationshipFields: FormFieldMetadata[] = [];

  sourceFields.forEach(field => {
    // Se o campo tem tipo 'nested' ou 'nested-one' e includeRelationships é true, é um relacionamento
    // Campos nested sempre são incluídos se includeRelationships for true, independente de visible
    if ((field.type === 'nested' || field.type === 'nested-one') && field.relationship && includeRelationships) {
      const relationshipField = convertFieldToFormField(field);
      if (relationshipField) {
        relationshipFields.push(relationshipField);
      }
    } else if (field.type !== 'nested' && field.type !== 'nested-one') {
      // Para campos normais (não nested), ignora campos marcados como não visíveis
      if (field.visible === false) {
        // console.log(`[convertEntityMetadataToFormMetadata] Skipping hidden field: ${field.name}`);
        return;
      }
      
      // Log detalhado para campos do tipo 'entity'
      if (field.type === 'entity') {
        // console.log(`🔍 [convertEntityMetadataToFormMetadata] Campo entity encontrado:`, {
        //   name: field.name,
        //   label: field.label,
        //   type: field.type,
        //   visible: field.visible,
        //   readonly: field.readonly,
        //   required: field.required,
        //   relationship: field.relationship
        // });
      }
      
      // Campos normais (não nested)
      const formField = convertFieldToFormField(field);
      if (formField) {
        basicFields.push(formField);
      } else {
        console.warn(`⚠️ [convertEntityMetadataToFormMetadata] Campo "${field.name}" retornou NULL do conversor!`);
      }
    }
  });

  // Converte TODOS os campos (incluindo não visíveis) para manter no originalFields
  const allFields: FormFieldMetadata[] = sourceFields
    .map(field => convertFieldToFormField(field))
    .filter((field): field is FormFieldMetadata => field !== null);

  // DEBUG: Log campos booleanos
  const booleanFields = basicFields.filter(f => f.type === 'boolean');
  if (booleanFields.length > 0) {
    console.log('🔍 [convertEntityMetadataToFormMetadata] Campos booleanos encontrados:', {
      entityName: entityMetadata.name,
      count: booleanFields.length,
      fields: booleanFields.map(f => ({ name: f.name, label: f.label }))
    });
  }

  // Organiza em seções
  const sections: FormSectionMetadata[] = [];

  if (basicFields.length > 0) {
    sections.push({
      id: 'basic-info',
      title: `Formulário de ${entityMetadata.label}`, // Ex: "Formulário de Eventos"
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
    description: undefined, // Removido, agora está no título da seção
    endpoint: entityMetadata.endpoint,
    sections,
    originalFields: allFields, // Mantém todos os campos, incluindo os não visíveis
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
