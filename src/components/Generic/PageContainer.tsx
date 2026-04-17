import React from "react";
import { useNavigate } from "react-router-dom";
import { FiHome, FiChevronRight, FiArrowLeft, FiChevronDown } from "react-icons/fi";
import { getUserRole } from "../../utils/auth";
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

  const userRole = getUserRole();
  const isClient = userRole === "ROLE_CLIENT" || userRole === "CLIENT";

  const isHeaderCollapsed = () => isClient && localStorage.getItem("headerCollapsed") === "true";

  const toggleHeader = () => {
    const next = !isHeaderCollapsed();
    localStorage.setItem("headerCollapsed", String(next));
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="entity-crud-container">
      <div className="entity-crud-breadcrumb">
        <div className="breadcrumb-content">
          {isHeaderCollapsed() && (
            <button
              className="breadcrumb-expand-header-btn"
              onClick={toggleHeader}
              title="Mostrar header"
            >
              <FiChevronDown size={16} />
            </button>
          )}
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

        {subPage && onBackToList ? (
          <button
            className="breadcrumb-action-btn btn-back"
            onClick={onBackToList}
          >
            <FiArrowLeft />
            <span>Voltar</span>
          </button>
        ) : (
          headerActions && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {headerActions}
            </div>
          )
        )}
      </div>

      {children}
    </div>
  );
};

export default PageContainer;
