import React from "react";
import { useNavigate } from "react-router-dom";
import { FiHome, FiChevronRight, FiArrowLeft, FiChevronDown } from "react-icons/fi";
import { useHeaderCollapsed } from "../../hooks/useHeaderCollapsed";
import "./EntityCRUD.css";

interface PageContainerProps {
  /** Título da página exibido no breadcrumb */
  title: string;
  /** Ações extras à direita do breadcrumb (botões, etc.) */
  headerActions?: React.ReactNode;
  /** Conteúdo da página */
  children: React.ReactNode;
  /** Sub-página (ex: "Editar") — adiciona nível ao breadcrumb */
  subPage?: string;
  /** Callback ao clicar no título (volta pra listagem) */
  onBackToList?: () => void;
}

/**
 * Container padrão para páginas customizadas que não usam EntityCRUD
 * mas precisam seguir o mesmo layout com breadcrumb.
 *
 * Uso:
 * ```tsx
 * <PageContainer title="Mesas" headerActions={<button>+ Criar</button>}>
 *   {conteúdo custom}
 * </PageContainer>
 * ```
 */
const PageContainer: React.FC<PageContainerProps> = ({
  title,
  headerActions,
  children,
  subPage,
  onBackToList,
}) => {
  const navigate = useNavigate();

  const [collapsed, toggleHeader] = useHeaderCollapsed();

  return (
    <div className="entity-crud-container">
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
          {subPage ? (
            <>
              <button
                className="breadcrumb-item breadcrumb-link"
                onClick={onBackToList}
              >
                <span>{title}</span>
              </button>
              <FiChevronRight className="breadcrumb-separator" />
              <div className="breadcrumb-item breadcrumb-current">
                <span>{subPage}</span>
              </div>
            </>
          ) : (
            <div className="breadcrumb-item breadcrumb-current">
              <span>{title}</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {subPage && onBackToList ? (
            <button
              className="breadcrumb-action-btn btn-back"
              onClick={onBackToList}
            >
              <FiArrowLeft />
              <span>Voltar</span>
            </button>
          ) : (
            headerActions
          )}
          {collapsed && (
            <button
              className="breadcrumb-expand-header-btn"
              onClick={toggleHeader}
              title="Mostrar header"
            >
              <FiChevronDown size={16} />
            </button>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};

export default PageContainer;
