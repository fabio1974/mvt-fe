import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiHome,
  FiChevronRight,
  FiArrowLeft,
  FiEdit,
  FiChevronDown,
} from "react-icons/fi";
import EntityTable from "./EntityTable";
import EntityForm from "./EntityForm";
import ErrorBoundary from "../Common/ErrorBoundary";
import { useMetadata } from "../../hooks/useMetadata";
import { useFormMetadata } from "../../hooks/useFormMetadata";
import { useHeaderCollapsed } from "../../hooks/useHeaderCollapsed";
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
  /** Ações customizadas adicionais na coluna de ações */
  customActions?: (row: any) => React.ReactNode;
  /** Callback após criar/editar com sucesso */
  onSuccess?: (data: unknown) => void;
  /** ID fixo da entidade (para modo view/edit sem tabela) */
  entityId?: number | string;
  /** Modo inicial quando entityId é fornecido */
  initialMode?: "view" | "edit" | "create";
  /** Esconde a tabela (útil para páginas de perfil) */
  hideTable?: boolean;
  /** Mostra botão "Editar" no modo view */
  showEditButton?: boolean;
  /** Esconde campos de array (relacionamentos 1:N) */
  hideArrayFields?: boolean;
  /** Filtros iniciais a serem aplicados na tabela */
  initialFilters?: Record<string, string>;
  /** Função para transformar dados antes de enviar ao backend */
  transformData?: (data: Record<string, unknown>) => Record<string, unknown>;
  /** Valores padrão para o formulário de criação */
  defaultValues?: Record<string, unknown>;
  /** Valores iniciais para o formulário (view/edit) */
  initialValues?: Record<string, unknown>;
  /** Campos a serem escondidos na tabela */
  hideFields?: string[];
  /** Campos que devem ser forçadamente exibidos na tabela (mesmo com visible:false no metadata) */
  showFields?: string[];
  /** Campos que devem ficar readonly no formulário */
  readonlyFields?: string[];
  /** Campos que devem ficar escondidos (hidden) no formulário */
  hiddenFields?: string[];
  /** Componente customizado para renderizar antes do formulário (ex: mapa de rota) */
  beforeFormComponent?: (entityId: number | string | undefined, viewMode: ViewMode) => React.ReactNode;
  /** Componente customizado para renderizar depois do formulário (ex: mapa de rota) */
  afterFormComponent?: (entityId: number | string | undefined, viewMode: ViewMode) => React.ReactNode;
  /** Esconde os filtros da tabela */
  hideFilters?: boolean;
  /** Exclui opções específicas de filtros select (ex: { status: ["WAITING_PAYMENT"] }) */
  excludeFilterOptions?: Record<string, string[]>;
  /** Filtros select que devem usar multi-seleção com checkboxes (ex: ["status"]) */
  multiSelectFilters?: string[];
  /** Desabilita a operação de criar */
  disableCreate?: boolean;
  /** Desabilita a operação de deletar */
  disableDelete?: boolean;
  /** Desabilita a operação de visualizar */
  disableView?: boolean;
  /** Desabilita a operação de editar */
  disableEdit?: boolean;
  /** Função que determina se uma linha específica pode ser deletada */
  canDelete?: (row: any) => boolean;
  /** Função que determina se uma linha específica pode ser editada */
  canEdit?: (row: any) => boolean;
  /** Callback quando o modo de visualização muda */
  onModeChange?: (mode: ViewMode) => void;
  /** Callback após criar com sucesso (diferente de onSuccess que é para ambos) */
  onCreateSuccess?: (data: unknown) => void;
  /** Remove o wrapper/container padrão (útil para mobile) */
  noWrapper?: boolean;
  /** Ações extras renderizadas no breadcrumb ao lado do botão Criar Novo */
  extraHeaderActions?: React.ReactNode;
  /** Oculta o botão "Criar Novo" padrão (usar quando tem botão customizado via extraHeaderActions) */
  hideCreateButton?: boolean;
  /** Campos a esconder SOMENTE na tabela (não afeta o formulário) */
  tableHideFields?: string[];
  /** Componente customizado para modo edit (substitui EntityForm no edit) */
  customEditComponent?: (entityId: number | string | undefined, viewMode: string, onBack: () => void) => React.ReactNode;
  /** Modo condensado: inputs e fontes menores, mesma estrutura */
  condensed?: boolean;
  /** Oculta a coluna "Número" (id) na tabela */
  hideIdColumn?: boolean;
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
  customActions,
  onSuccess,
  entityId: propEntityId,
  initialMode = "view",
  hideTable = false,
  showEditButton = false,
  hideArrayFields = false,
  initialFilters,
  defaultValues,
  initialValues,
  hideFields,
  showFields,
  readonlyFields,
  hiddenFields,
  beforeFormComponent,
  afterFormComponent,
  hideFilters = false,
  excludeFilterOptions = {},
  multiSelectFilters = [],
  disableCreate = false,
  disableDelete = false,
  disableView = false,
  disableEdit = false,
  canDelete,
  canEdit,
  onModeChange,
  onCreateSuccess,
  noWrapper = false,
  extraHeaderActions,
  hideCreateButton = false,
  tableHideFields = [] as string[],
  customEditComponent,
  // transformData, // Unused parameter
  pageTitle,
  condensed = false,
  hideIdColumn = false,
}) => {
  // Determina o modo inicial baseado nas props
  const getInitialMode = (): ViewMode => {
    if (propEntityId) {
      return initialMode; // Se tem ID, usa o initialMode (view ou edit)
    }
    if (hideTable) {
      return "create"; // Se esconde tabela sem ID, cria novo
    }
    return "table"; // Padrão: mostra tabela
  };

  const [viewMode, setViewModeInternal] = useState<ViewMode>(getInitialMode);
  const [selectedEntityId, setSelectedEntityId] = useState<
    number | string | undefined
  >(propEntityId);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  // Helper para mudar o modo e notificar o callback
  const setViewMode = (mode: ViewMode) => {
    setViewModeInternal(mode);
    onModeChange?.(mode);
  };

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
    } catch (error: any) {
      console.error("Erro ao excluir:", error);

      // Verifica se é erro de constraint (conflito de integridade referencial)
      const errorMessage =
        error?.response?.data?.message || error?.message || "";
      const isConstraintError =
        errorMessage.toLowerCase().includes("constraint") ||
        errorMessage.toLowerCase().includes("foreign key") ||
        errorMessage.toLowerCase().includes("referenced") ||
        error?.response?.status === 409;

      if (isConstraintError) {
        showToast(
          "Não é possível excluir este registro porque ele está sendo usado em outras partes do sistema. " +
            "Você precisa remover as informações relacionadas primeiro.",
          "error"
        );
      } else {
        showToast("Erro ao excluir registro. Tente novamente.", "error");
      }
    }
  };

  const handleCreate = () => {
    setSelectedEntityId(undefined);
    setViewMode("create");
  };

  // Handler para voltar à lista ou ao modo view
  const handleBackToTable = () => {
    if (hideTable && propEntityId) {
      // Se esconde tabela e tem ID fixo, volta para view
      setViewMode("view");
    } else {
      // Senão, volta para tabela
      setSelectedEntityId(undefined);
      setViewMode("table");
      setRefreshKey((prev) => prev + 1); // Refresh da tabela
    }
  };

  // Handler de sucesso do formulário
  const handleFormSuccess = (data: unknown) => {
    showToast(
      viewMode === "create"
        ? "Registro criado com sucesso!"
        : "Registro atualizado com sucesso!",
      "success"
    );

    // Callback específico para criação
    if (viewMode === "create" && onCreateSuccess) {
      onCreateSuccess(data);
      return; // Não executa a lógica padrão se tiver onCreateSuccess
    }

    if (hideTable && propEntityId) {
      // Se esconde tabela e tem ID fixo, volta para view após salvar
      setViewMode("view");
    } else {
      handleBackToTable();
    }

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

  // Header collapse — só para CLIENT (estabelecimento). Hook reativo
  // pra atualizar o botão "expand" no breadcrumb sem precisar trocar de rota.
  const [headerCollapsed, toggleHeader] = useHeaderCollapsed();

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

    const entityLabel = pageTitle || metadata.label || entityName;
    const isInTable = mode === "table";

    const ExpandHeaderBtn = headerCollapsed ? (
      <button
        className="breadcrumb-expand-header-btn"
        onClick={toggleHeader}
        title="Mostrar header"
      >
        <FiChevronDown size={16} />
      </button>
    ) : null;

    return (
      <div className="entity-crud-breadcrumb">
        <div className="breadcrumb-content">
          <button
            className="breadcrumb-item breadcrumb-link"
            onClick={() => navigate("/")}
          >
            <FiHome className="breadcrumb-icon" />
            <span>Início</span>
          </button>
          <FiChevronRight className="breadcrumb-separator" />
          {isInTable ? (
            <div className="breadcrumb-item breadcrumb-current">
              <span>{entityLabel}</span>
            </div>
          ) : (
            <>
              <button
                className="breadcrumb-item breadcrumb-link"
                onClick={handleBackToTable}
              >
                <span>{entityLabel}</span>
              </button>
              <FiChevronRight className="breadcrumb-separator" />
              <div className="breadcrumb-item breadcrumb-current">
                <span>{getModeLabel()}</span>
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {ExpandHeaderBtn}
          {mode === "table" ? (
            <>
              {extraHeaderActions}
              {!disableCreate && !hideCreateButton && (
                <button
                  className="breadcrumb-action-btn btn-create"
                  onClick={handleCreate}
                >
                  <FiPlus />
                  <span>Criar Novo</span>
                </button>
              )}
            </>
          ) : mode === "view" && showEditButton ? (
            <>
              <button
                className="breadcrumb-action-btn btn-edit"
                onClick={() => setViewMode("edit")}
              >
                <FiEdit />
                <span>Editar</span>
              </button>
              {!hideTable && (
                <button
                  className="breadcrumb-action-btn btn-back"
                  onClick={handleBackToTable}
                >
                  <FiArrowLeft />
                  <span>Voltar</span>
                </button>
              )}
            </>
          ) : mode === "view" && !hideTable ? (
            <button
              className="breadcrumb-action-btn btn-back"
              onClick={handleBackToTable}
            >
              <FiArrowLeft />
              <span>Voltar</span>
            </button>
          ) : mode !== "view" && !hideTable ? (
            <button
              className="breadcrumb-action-btn btn-back"
              onClick={handleBackToTable}
            >
              <FiArrowLeft />
              <span>Voltar</span>
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  // Renderiza a tabela com filtros
  if (viewMode === "table" && !hideTable) {
    return (
      <div className="entity-crud-container">
        <Breadcrumb mode={viewMode} />

        <ErrorBoundary>
          <EntityTable
            key={refreshKey}
            entityName={entityName}
            apiEndpoint={apiEndpoint}
            onView={disableView ? undefined : handleView}
            onEdit={disableEdit ? undefined : handleEdit}
            onDelete={disableDelete ? undefined : handleDelete}
            showActions={true}
            customRenderers={customRenderers}
            customActions={customActions}
            hideHeader={true}
            noWrapper={true}
            initialFilters={initialFilters}
            hideFields={[...(hideFields ?? []), ...tableHideFields]}
            showFields={showFields}
            hideFilters={hideFilters}
            excludeFilterOptions={excludeFilterOptions}
            multiSelectFilters={multiSelectFilters}
            canDelete={canDelete}
            canEdit={canEdit}
            hideIdColumn={hideIdColumn}
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

  // Componente customizado de edit (ex: FoodOrderEditPanel)
  if (customEditComponent && viewMode === "edit") {
    return (
      <div className="entity-crud-container">
        <Breadcrumb mode={viewMode} />
        <div className="entity-crud-form-wrapper" style={{ marginBottom: "4rem" }}>
          {customEditComponent(selectedEntityId, viewMode, handleBackToTable)}
        </div>
      </div>
    );
  }

  // Se noWrapper, renderiza apenas o formulário sem container/breadcrumb
  if (noWrapper) {
    return (
      <div className="entity-crud-form-wrapper">
        <EntityForm
          metadata={formMetadata}
          entityId={selectedEntityId}
          onSuccess={handleFormSuccess}
          onCancel={handleBackToTable}
          readonly={isReadonly}
          mode={viewMode === "table" ? "view" : viewMode}
          hideCancelButton={hideTable && isReadonly}
          hideArrayFields={hideArrayFields}
          initialValues={viewMode === "create" ? defaultValues : initialValues}
          readonlyFields={readonlyFields}
          hiddenFields={hiddenFields}
          condensed={condensed}
        />
      </div>
    );
  }

  return (
    <div className="entity-crud-container">
      <Breadcrumb mode={viewMode} />

      {/* Renderiza componente customizado antes do formulário (ex: mapa de rota) */}
      {beforeFormComponent && (
        <div className="entity-crud-before-form">
          {beforeFormComponent(selectedEntityId, viewMode)}
        </div>
      )}

      <div className="entity-crud-form-wrapper" style={{ marginBottom: "4rem" }}>
        <EntityForm
          metadata={formMetadata}
          entityId={selectedEntityId}
          onSuccess={handleFormSuccess}
          onCancel={handleBackToTable}
          readonly={isReadonly}
          mode={viewMode === "table" ? "view" : viewMode}
          hideCancelButton={hideTable && isReadonly}
          hideArrayFields={hideArrayFields}
          initialValues={viewMode === "create" ? defaultValues : initialValues}
          readonlyFields={readonlyFields}
          hiddenFields={hiddenFields}
          condensed={condensed}
        />

        {/* Renderiza componente customizado depois do formulário (ex: mapa de rota) */}
        {afterFormComponent && (
          <div className="entity-crud-after-form">
            {afterFormComponent(selectedEntityId, viewMode)}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityCRUD;
