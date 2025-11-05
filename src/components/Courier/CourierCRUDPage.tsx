import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";

/**
 * Página de CRUD completo para Motoboys
 *
 * Usa o componente genérico EntityCRUD que integra:
 * - EntityFilters (com botão "Criar Novo")
 * - EntityTable (com ações de visualizar, editar, excluir)
 * - EntityForm (para criar, visualizar e editar)
 *
 * Toda a configuração vem do metadata do backend carregado
 * no início da aplicação pelo MetadataContext.
 */
const CourierCRUDPage: React.FC = () => {
  return (
    <EntityCRUD
      entityName="user"
      hideArrayFields={false}
      pageTitle="Motoboys"
      pageDescription="Gerencie os motoboys da plataforma"
      initialFilters={{ role: "COURIER" }}
    />
  );
};

export default CourierCRUDPage;
