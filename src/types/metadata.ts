// Tipos para o sistema de metadata do backend

export type FieldType = 'string' | 'integer' | 'long' | 'double' | 'boolean' | 'date' | 'datetime' | 'enum' | 'nested' | 'actions';
export type Alignment = 'left' | 'center' | 'right';
export type FilterType = 'text' | 'select' | 'date' | 'number' | 'boolean' | 'entity';

export interface FieldMetadata {
  name: string;
  label: string;
  type: FieldType;
  width?: number;
  align: Alignment;
  sortable: boolean;
  searchable: boolean;
  visible: boolean;
  format?: string | null;
  // Campos para formulários
  required?: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  options?: FilterOption[];
  relationship?: RelationshipMetadata;
}

export interface RelationshipMetadata {
  type: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';
  targetEntity: string;
  targetEndpoint: string;
  cascade?: boolean;
  fields?: FieldMetadata[];
}

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Tipo de renderização para filtros de entidade
 */
export type EntityFilterRenderType = 'select' | 'typeahead' | 'autocomplete';

/**
 * Configuração para filtros de relacionamento com outras entidades
 * Permite criar selects/typeaheads automáticos que carregam dados de outras entidades
 */
export interface EntityFilterConfig {
  /** Nome da entidade relacionada (ex: "event", "user") */
  entityName: string;
  /** Endpoint para buscar as opções (ex: "/api/events") */
  endpoint: string;
  /** Campo que contém o label a ser exibido (ex: "name", "username") */
  labelField: string;
  /** Campo que contém o valor (geralmente "id") */
  valueField: string;
  /** Tipo de componente a renderizar: 'select' (poucas opções) ou 'typeahead' (muitas opções) */
  renderAs?: EntityFilterRenderType;
  /** Se true, permite busca/filtro no typeahead */
  searchable?: boolean;
  /** Placeholder para o campo de busca */
  searchPlaceholder?: string;
  /** Número estimado de registros (usado para decidir renderAs automaticamente) */
  estimatedCount?: number;
}

export interface FilterMetadata {
  name: string;
  label: string;
  type: FilterType;
  field: string;
  placeholder?: string | null;
  options?: FilterOption[] | null;
  /** Configuração para filtros de entidade relacionada */
  entityConfig?: EntityFilterConfig | null;
}

export interface PaginationConfig {
  defaultPageSize: number;
  pageSizeOptions: number[];
  showSizeSelector: boolean;
}

export interface EntityMetadata {
  name: string; // Nome da entidade (ex: "event")
  label: string; // Nome para exibição (ex: "Eventos")
  endpoint: string; // Endpoint da API (ex: "/api/events")
  
  // Para tabelas (EntityTable)
  fields?: FieldMetadata[]; // Deprecated - usar tableFields
  tableFields?: FieldMetadata[]; // Campos para exibição em tabela
  
  // Para formulários (EntityForm)
  formFields?: FieldMetadata[]; // Campos para formulários (com validações, options, nested)
  
  filters: FilterMetadata[];
  pagination: PaginationConfig;
}

export interface MetadataResponse {
  [entityName: string]: EntityMetadata;
}

// ==================== FORM METADATA ====================

export type FormFieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'email' 
  | 'password'
  | 'date' 
  | 'datetime'
  | 'daterange'
  | 'select' 
  | 'boolean'
  | 'entity'
  | 'city'
  | 'array';

/**
 * Configuração para campos do tipo array (listas dinâmicas)
 */
export interface ArrayFieldConfig {
  /** Tipo de item no array */
  itemType: 'text' | 'number' | 'select' | 'object';
  /** Label para o botão de adicionar */
  addLabel?: string;
  /** Label para cada item (pode usar {index}) */
  itemLabel?: string;
  /** Placeholder para itens simples */
  placeholder?: string;
  /** Opções para select items */
  options?: FilterOption[];
  /** Campos do objeto (se itemType === 'object') */
  fields?: FormFieldMetadata[];
  /** Valor mínimo de itens */
  minItems?: number;
  /** Valor máximo de itens */
  maxItems?: number;
  /** Se pode reordenar itens */
  sortable?: boolean;
}

export interface FormFieldMetadata {
  /** Nome do campo (key no objeto de dados) */
  name: string;
  /** Label a ser exibido */
  label: string;
  /** Tipo do campo */
  type: FormFieldType;
  /** Se o campo é obrigatório */
  required?: boolean;
  /** Placeholder do campo */
  placeholder?: string;
  /** Valor padrão */
  defaultValue?: string | number | boolean | Date | null;
  /** Opções para select */
  options?: FilterOption[];
  /** Configuração para campos de entidade relacionada */
  entityConfig?: EntityFilterConfig;
  /** Configuração para campos de array (listas dinâmicas) */
  arrayConfig?: ArrayFieldConfig;
  /** Validação customizada */
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
  /** Se o campo está desabilitado */
  disabled?: boolean;
  /** Texto de ajuda */
  helpText?: string;
  /** Condição para exibir o campo (expressão) */
  showIf?: string;
}

export interface FormSectionMetadata {
  /** Identificador da seção */
  id: string;
  /** Título da seção */
  title: string;
  /** Ícone da seção */
  icon?: React.ReactNode;
  /** Campos da seção */
  fields: FormFieldMetadata[];
  /** Se a seção é colapsável */
  collapsible?: boolean;
  /** Se a seção inicia colapsada */
  defaultCollapsed?: boolean;
  /** Grid: número de colunas (1-6) */
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface FormMetadata {
  /** Nome da entidade */
  entityName: string;
  /** Título do formulário */
  title: string;
  /** Subtítulo/descrição */
  description?: string;
  /** Endpoint para submissão (POST para criar, PUT para editar) */
  endpoint: string;
  /** Método HTTP padrão */
  method?: 'POST' | 'PUT' | 'PATCH';
  /** Seções do formulário */
  sections: FormSectionMetadata[];
  /** Texto do botão de submit */
  submitLabel?: string;
  /** Texto do botão de cancelar */
  cancelLabel?: string;
  /** URL para redirecionar após sucesso */
  successRedirect?: string;
}
