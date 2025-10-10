import React, { useState } from "react";
import { FiPlus, FiHome, FiChevronRight, FiArrowLeft } from "react-icons/fi";
import EntityTable from "./EntityTable";
import EntityForm from "./EntityForm";
import ErrorBoundary from "../Common/ErrorBoundary";
import { useMetadata } from "../../hooks/useMetadata";
import { useFormMetadata } from "../../hooks/useFormMetadata";
import { api } from "../../services/api";
import { showToast } from "../../utils/toast";
import "./EntityCRUD.css";

type ViewMode = "table" | "view" | "create" | "edit";

interface EntityCRUDProps {
  /** Nome da entidade (ex: "event", "organization") */
  entityName: string;
  /** Endpoint da API (opcional - usa o do metadata) */
  apiEndpoint?: string;
  /** Título da página (opcional - usa o label do metadata) */
  pageTitle?: string;
  /** Descrição da página (opcional) */
  pageDescription?: string;
  /** Renderizadores customizados para a tabela */
  customRenderers?: {
    [fieldName: string]: (value: unknown, row: unknown) => React.ReactNode;
  };
  /** Callback após criar/editar com sucesso */
  onSuccess?: (data: unknown) => void;
}

/**
 * Componente CRUD genérico completo
 *
 * Combina EntityFilters, EntityTable e EntityForm em uma única interface
 *
 * Modos de visualização:
 * - table: Lista com filtros e ações (padrão)
 * - view: Visualização de detalhes (readonly)
 * - create: Formulário de criação
 * - edit: Formulário de edição
 *
 * Uso:
 * ```tsx
 * <EntityCRUD
 *   entityName="event"
 *   pageTitle="Eventos"
 *   pageDescription="Gerencie todos os eventos da plataforma"
 * />
 * ```
 */
const EntityCRUD: React.FC<EntityCRUDProps> = ({
  entityName,
  apiEndpoint,
  customRenderers,
  onSuccess,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedEntityId, setSelectedEntityId] = useState<
    number | undefined
  >();
  const [refreshKey, setRefreshKey] = useState(0);

  const { getEntityMetadata, isLoading: metadataLoading } = useMetadata();
  const metadata = getEntityMetadata(entityName);
  const { formMetadata, isLoading: formMetadataLoading } =
    useFormMetadata(entityName);

  // Handlers para ações da tabela
  const handleView = (id: number) => {
    setSelectedEntityId(id);
    setViewMode("view");
  };

  const handleEdit = (id: number) => {
    setSelectedEntityId(id);
    setViewMode("edit");
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este registro?")) {
      return;
    }

    try {
      const endpoint = metadata?.endpoint || apiEndpoint || `/${entityName}s`;
      await api.delete(`${endpoint}/${id}`);
      showToast("Registro excluído com sucesso!", "success");
      setRefreshKey((prev) => prev + 1); // Force refresh da tabela
    } catch (error) {
      console.error("Erro ao excluir:", error);
      showToast("Erro ao excluir registro", "error");
    }
  };

  const handleCreate = () => {
    setSelectedEntityId(undefined);
    setViewMode("create");
  };

  // Handler para voltar à lista
  const handleBackToTable = () => {
    setSelectedEntityId(undefined);
    setViewMode("table");
    setRefreshKey((prev) => prev + 1); // Refresh da tabela
  };

  // Handler de sucesso do formulário
  const handleFormSuccess = (data: unknown) => {
    showToast(
      viewMode === "create"
        ? "Registro criado com sucesso!"
        : "Registro atualizado com sucesso!",
      "success"
    );
    handleBackToTable();
    onSuccess?.(data);
  };

  // Loading
  if (metadataLoading) {
    return (
      <div className="entity-crud-loading">
        <div className="loading-spinner"></div>
        <p>Carregando configurações do sistema...</p>
      </div>
    );
  }

  // Metadata não encontrada
  if (!metadata) {
    return (
      <div className="entity-crud-error">
        <p>Configuração não encontrada para a entidade: {entityName}</p>
      </div>
    );
  }

  // Componente de Breadcrumb
  const Breadcrumb = ({ mode }: { mode: ViewMode }) => {
    const getModeLabel = () => {
      switch (mode) {
        case "create":
          return "Criar";
        case "edit":
          return "Editar";
        case "view":
          return "Visualizar";
        default:
          return "Gerenciar";
      }
    };

    return (
      <div className="entity-crud-breadcrumb">
        <div className="breadcrumb-content">
          <div className="breadcrumb-item">
            <FiHome className="breadcrumb-icon" />
            <span>Início</span>
          </div>
          <FiChevronRight className="breadcrumb-separator" />
          <div className="breadcrumb-item">
            <span>{metadata.label || entityName}</span>
          </div>
          <FiChevronRight className="breadcrumb-separator" />
          <div className="breadcrumb-item breadcrumb-current">
            <span>{getModeLabel()}</span>
          </div>
        </div>

        {mode === "table" ? (
          <button
            className="breadcrumb-action-btn btn-create"
            onClick={handleCreate}
          >
            <FiPlus />
            <span>Criar Novo</span>
          </button>
        ) : (
          <button
            className="breadcrumb-action-btn btn-back"
            onClick={handleBackToTable}
          >
            <FiArrowLeft />
            <span>Voltar</span>
          </button>
        )}
      </div>
    );
  };

  // Renderiza a tabela com filtros
  if (viewMode === "table") {
    return (
      <div className="entity-crud-container">
        <Breadcrumb mode={viewMode} />

        <ErrorBoundary>
          <EntityTable
            key={refreshKey}
            entityName={entityName}
            apiEndpoint={apiEndpoint}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showActions={true}
            customRenderers={customRenderers}
            hideHeader={true}
          />
        </ErrorBoundary>
      </div>
    );
  }

  // Renderiza o formulário (view, create ou edit)
  if (formMetadataLoading) {
    return (
      <div className="entity-crud-loading">
        <div className="loading-spinner"></div>
        <p>Carregando formulário...</p>
      </div>
    );
  }

  if (!formMetadata) {
    return (
      <div className="entity-crud-loading">
        <div className="loading-spinner"></div>
        <p>Carregando formulário...</p>
      </div>
    );
  }

  const isReadonly = viewMode === "view";

  return (
    <div className="entity-crud-container">
      <Breadcrumb mode={viewMode} />

      <div className="entity-crud-form-wrapper">
        <EntityForm
          metadata={formMetadata}
          entityId={selectedEntityId}
          onSuccess={handleFormSuccess}
          onCancel={handleBackToTable}
          readonly={isReadonly}
          mode={viewMode}
        />
      </div>
    </div>
  );
};

export default EntityCRUD;
