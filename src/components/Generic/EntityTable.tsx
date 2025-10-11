import { useState, useEffect, useCallback, useRef } from "react";
import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import { api } from "../../services/api";
import { useMetadata } from "../../hooks/useMetadata";
import type { EntityMetadata, FieldMetadata } from "../../types/metadata";
import EntityFilters from "./EntityFilters";
import "./EntityTable.css";

interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

interface EntityResponse<T> {
  content: T[];
  pageable: Pageable;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

interface EntityTableProps {
  entityName: string;
  apiEndpoint?: string; // Opcional - usa o endpoint do metadata se não fornecido
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
  customRenderers?: {
    [fieldName: string]: (value: any, row: any) => React.ReactNode;
  };
  hideHeader?: boolean; // Opcional - esconde o header quando usado dentro do EntityCRUD
}

const EntityTable: React.FC<EntityTableProps> = ({
  entityName,
  apiEndpoint,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  customRenderers = {},
  hideHeader = false,
}) => {
  const {
    getEntityMetadata,
    isLoading: metadataLoading,
    metadata: globalMetadata,
  } = useMetadata();
  const [metadata, setMetadata] = useState<EntityMetadata | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const filtersRef = useRef<Record<string, string>>({});
  const debounceRef = useRef<number | null>(null);

  // Carrega metadata do contexto
  useEffect(() => {
    console.log(
      "🔍 EntityTable useEffect - metadataLoading:",
      metadataLoading,
      "entityName:",
      entityName
    );
    if (!metadataLoading) {
      const entityMetadata = getEntityMetadata(entityName);
      console.log(
        "📦 Tentando carregar metadata para:",
        entityName,
        "Resultado:",
        entityMetadata
      );
      console.log(
        "📦 Metadata completo:",
        JSON.stringify(entityMetadata, null, 2)
      );
      if (entityMetadata) {
        // Log dos campos ENUM/SELECT para debug
        const enumFields = entityMetadata.tableFields?.filter(
          (f) => f.type === "enum" || f.type === "select"
        );
        console.log(
          "🔍 Campos ENUM/SELECT encontrados:",
          enumFields?.map((f) => ({
            name: f.name,
            label: f.label,
            type: f.type,
            hasOptions: !!f.options,
            optionsCount: f.options?.length || 0,
            options: f.options,
          }))
        );

        // Garante que filters seja um array mesmo quando backend envia null
        const normalizedMetadata = {
          ...entityMetadata,
          filters: entityMetadata.filters || [],
        };

        setMetadata(normalizedMetadata);
        setItemsPerPage(normalizedMetadata.pagination?.defaultPageSize || 10);
      } else {
        const errorMsg = `Metadata não encontrada para entidade: ${entityName}`;
        setError(errorMsg);
        console.error("❌ Metadata não encontrada:", entityName);
        console.error(
          "❌ Entidades disponíveis:",
          Array.from(globalMetadata.keys())
        );
      }
    }
  }, [entityName, metadataLoading, getEntityMetadata, globalMetadata]);

  // Busca dados
  const fetchData = useCallback(
    async (filterValues: Record<string, string>) => {
      if (!metadata) return;

      setLoading(true);
      setError(null);

      try {
        // Usa endpoint do metadata se disponível, senão usa o prop, senão gera erro
        let endpoint = metadata.endpoint || apiEndpoint;

        if (!endpoint) {
          throw new Error(
            `Nenhum endpoint configurado para a entidade ${entityName}`
          );
        }

        // Garante que o endpoint começa com /
        if (!endpoint.startsWith("/")) {
          endpoint = `/${endpoint}`;
        }

        const params = new URLSearchParams({
          page: String(currentPage - 1), // Spring usa 0-based
          size: String(itemsPerPage),
          ...Object.entries(filterValues).reduce((acc, [key, value]) => {
            if (value) acc[key] = value;
            return acc;
          }, {} as Record<string, string>),
        });

        console.log("🔍 Fazendo requisição para:", `${endpoint}?${params}`);
        console.log("📊 Filtros aplicados:", filterValues);
        const response = await api.get(`${endpoint}?${params}`);
        const responseData = response.data as any[] | EntityResponse<any>;

        // Suporta array direto ou estrutura paginada
        if (Array.isArray(responseData)) {
          setData(responseData);
          setTotalPages(Math.ceil(responseData.length / itemsPerPage));
          setTotalElements(responseData.length);
        } else {
          setData(responseData.content || []);
          setTotalPages(responseData.totalPages || 1);
          setTotalElements(responseData.totalElements || 0);
        }
      } catch (err) {
        setError("Erro ao carregar dados. Tente novamente.");
        console.error("Erro ao buscar dados:", err);
      } finally {
        setLoading(false);
      }
    },
    [metadata, currentPage, itemsPerPage, apiEndpoint]
  );

  useEffect(() => {
    if (metadata) {
      fetchData(filters);
    }
  }, [metadata, currentPage, itemsPerPage, fetchData, filters]);

  const handleFilterChange = useCallback(
    (field: string, value: string) => {
      const newFilters = { ...filtersRef.current, [field]: value };
      setFilters(newFilters);
      setCurrentPage(1);
      filtersRef.current = newFilters;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = window.setTimeout(() => {
        fetchData(newFilters);
      }, 300);
    },
    [fetchData]
  );

  const clearFilters = useCallback(() => {
    const emptyFilters: Record<string, string> = {};
    setFilters(emptyFilters);
    filtersRef.current = emptyFilters;
    setCurrentPage(1);
    fetchData(emptyFilters);
  }, [fetchData]);

  const getFieldValue = (row: any, field: FieldMetadata): any => {
    const fieldPath = field.name.split(".");
    let value = row;
    for (const key of fieldPath) {
      value = value?.[key];
      if (value === undefined || value === null) break;
    }
    return value;
  };

  const formatValue = (value: any, field: FieldMetadata): string => {
    if (value === null || value === undefined) return "-";

    // Se o valor é um objeto (relacionamento), tenta extrair o campo apropriado
    if (typeof value === "object" && !Array.isArray(value)) {
      // Se o field tem relationship com labelField definido, usa ele
      if (field.relationship?.labelField) {
        const displayValue = value[field.relationship.labelField];
        if (displayValue) return String(displayValue);
      }

      // Fallback: tenta campos comuns de display em ordem de prioridade
      const displayValue =
        value.name ||
        value.title ||
        value.label ||
        value.displayName ||
        value.username ||
        value.email;
      if (displayValue) return String(displayValue);

      // Último fallback para ID
      return value.id ? `ID: ${value.id}` : String(value);
    }

    if (!field.type) return String(value);

    switch (field.type.toLowerCase()) {
      case "enum":
      case "select":
        // Traduz ENUM/SELECT usando as options do metadata (já carregado do backend)
        if (field.options && field.options.length > 0) {
          const option = field.options.find(
            (opt) => opt.value === String(value)
          );
          if (option) {
            console.log(
              `🔄 Traduzindo ${field.name}: "${value}" → "${option.label}"`
            );
            return option.label;
          }
        }
        console.log(
          `⚠️ Sem tradução para ${field.name}: "${value}" (options:`,
          field.options,
          ")"
        );
        return String(value);
      case "date":
        return new Date(value).toLocaleDateString("pt-BR");
      case "datetime":
        return new Date(value).toLocaleString("pt-BR");
      case "boolean":
        return value ? "Sim" : "Não";
      case "double":
        return typeof value === "number" ? value.toFixed(2) : String(value);
      default:
        return String(value);
    }
  };

  const getAlignment = (align?: string): "left" | "center" | "right" => {
    if (!align) return "left";
    return align.toLowerCase() as "left" | "center" | "right";
  };

  // Loading do metadata global
  if (metadataLoading) {
    return (
      <div className="entity-table-loading">
        <div className="loading-spinner"></div>
        <p>Carregando configurações do sistema...</p>
      </div>
    );
  }

  // Metadata não encontrada
  if (!metadata) {
    return (
      <div className="entity-table-loading">
        <div className="loading-spinner"></div>
        <p>Carregando configuração da entidade...</p>
      </div>
    );
  }

  // Valida se metadata tem a estrutura correta
  // Usa tableFields se disponível (novo formato), senão usa fields (formato antigo)
  const fieldsSource =
    metadata.tableFields &&
    Array.isArray(metadata.tableFields) &&
    metadata.tableFields.length > 0
      ? metadata.tableFields
      : metadata.fields;

  if (!fieldsSource || !Array.isArray(fieldsSource)) {
    return (
      <div className="entity-table-error">
        Erro: Metadata inválida para entidade {entityName}. Estrutura esperada
        não encontrada.
        <pre>{JSON.stringify(metadata, null, 2)}</pre>
      </div>
    );
  }

  const visibleFields = fieldsSource.filter((f) => f.visible) || [];

  return (
    <div className="entity-table-page">
      {!hideHeader && (
        <div className="entity-table-header">
          <h1>{metadata.label || entityName}</h1>
          <p>
            Visualize e gerencie todos os{" "}
            {(metadata.label || entityName).toLowerCase()} da plataforma
          </p>
        </div>
      )}

      {metadata.filters && metadata.filters.length > 0 && (
        <EntityFilters
          filters={metadata.filters}
          values={filters}
          onChange={handleFilterChange}
          onClear={clearFilters}
        />
      )}

      {loading ? (
        <div className="entity-table-loading">
          <div className="loading-spinner"></div>
          <p>Carregando...</p>
        </div>
      ) : error ? (
        <div className="entity-table-error">{error}</div>
      ) : (
        <div className="entity-table-container">
          <div className="entity-table-scroll">
            <table className="entity-table">
              <thead>
                <tr>
                  {visibleFields.map((field) => (
                    <th
                      key={field.name}
                      style={{ textAlign: getAlignment(field.align) }}
                    >
                      {field.label}
                    </th>
                  ))}
                  {showActions && (
                    <th style={{ textAlign: "center" }}>Ações</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {!data || data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleFields.length + (showActions ? 1 : 0)}
                      className="no-data"
                    >
                      Nenhum registro encontrado
                    </td>
                  </tr>
                ) : (
                  data.map((row, index) => (
                    <tr key={row?.id ?? index}>
                      {visibleFields.map((field) => {
                        const value = getFieldValue(row, field);
                        const customRenderer = customRenderers?.[field.name];

                        return (
                          <td
                            key={field.name}
                            style={{ textAlign: getAlignment(field.align) }}
                          >
                            {customRenderer
                              ? customRenderer(value, row)
                              : formatValue(value, field)}
                          </td>
                        );
                      })}
                      {showActions && (
                        <td style={{ textAlign: "center" }}>
                          <div className="actions">
                            {onView && (
                              <button
                                className="btn-action btn-view"
                                onClick={() => onView(row.id)}
                                title="Visualizar"
                              >
                                <FiEye />
                              </button>
                            )}
                            {onEdit && (
                              <button
                                className="btn-action btn-edit"
                                onClick={() => onEdit(row.id)}
                                title="Editar"
                              >
                                <FiEdit />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                className="btn-action btn-delete"
                                onClick={() => onDelete(row.id)}
                                title="Excluir"
                              >
                                <FiTrash2 />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer com paginação */}
          <div className="table-footer">
            <div className="table-footer-left">
              <span className="pagination-info-text">
                Mostrando{" "}
                {data.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{" "}
                {Math.min(currentPage * itemsPerPage, totalElements)} de{" "}
                {totalElements} registros
              </span>
            </div>

            <div className="table-footer-center">
              <div className="pagination-controls">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ««
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ‹
                </button>
                <span className="pagination-info">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  ›
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  »»
                </button>
              </div>
            </div>

            <div className="table-footer-right">
              <label htmlFor="pageSize" className="page-size-label">
                Itens por página:
              </label>
              <select
                id="pageSize"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="page-size-select"
              >
                {(
                  metadata.pagination?.pageSizeOptions || [5, 10, 20, 50, 100]
                ).map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityTable;
