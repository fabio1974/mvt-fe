import EntityCRUD from "../Generic/EntityCRUD";

/**
 * Página de CRUD completo para Eventos
 *
 * Usa o componente genérico EntityCRUD que integra:
 * - EntityFilters (com botão "Criar Novo")
 * - EntityTable (com ações de visualizar, editar, excluir)
 * - EntityForm (para criar, visualizar e editar)
 *
 * Toda a configuração vem do metadata do backend carregado
 * no início da aplicação pelo MetadataContext.
 */
const EventsCRUDPage: React.FC = () => {
  return (
    <EntityCRUD
      entityName="event"
      pageTitle="Eventos"
      pageDescription="Gerencie todos os eventos da plataforma"
    />
  );
};

export default EventsCRUDPage;
