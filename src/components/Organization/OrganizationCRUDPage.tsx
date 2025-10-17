import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";

/**
 * Página de CRUD completo para Organizações
 *
 * Usa o componente genérico EntityCRUD que integra:
 * - EntityFilters (com botão "Criar Novo")
 * - EntityTable (com ações de visualizar, editar, excluir)
 * - EntityForm (para criar, visualizar e editar)
 *
 * Toda a configuração vem do metadata do backend carregado
 * no início da aplicação pelo MetadataContext.
 */
const OrganizationCRUDPage: React.FC = () => {
  return (
    <EntityCRUD
      entityName="organization"
      hideArrayFields={true}
      pageTitle="Organização"
      pageDescription="Gerencie a organização da plataforma"
    />
  );
};

export default OrganizationCRUDPage;
