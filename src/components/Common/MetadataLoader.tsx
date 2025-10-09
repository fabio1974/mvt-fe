import { useMetadata } from "../../hooks/useMetadata";
import "./MetadataLoader.css";

interface MetadataLoaderProps {
  children: React.ReactNode;
}

const MetadataLoader: React.FC<MetadataLoaderProps> = ({ children }) => {
  const { isLoading, error } = useMetadata();

  if (isLoading) {
    return (
      <div className="metadata-loader">
        <div className="metadata-loader-content">
          <div className="loading-spinner-large"></div>
          <h2>Carregando sistema...</h2>
          <p>Preparando configurações da aplicação</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="metadata-loader">
        <div className="metadata-loader-content error">
          <div className="error-icon">⚠️</div>
          <h2>Erro ao carregar configurações</h2>
          <p>{error}</p>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default MetadataLoader;
