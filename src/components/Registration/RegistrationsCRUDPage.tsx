import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";

/**
 * Página de CRUD completo para Inscrições
 *
 * Usa o componente genérico EntityCRUD que integra:
 * - EntityFilters (com botão "Criar Novo")
 * - EntityTable (com ações de visualizar, editar, excluir)
 * - EntityForm (para criar, visualizar e editar)
 *
 * Props:
 * - hideArrayFields={true}: Esconde relacionamentos 1:N
 *   (evita mostrar listas de pagamentos, etc dentro do formulário)
 *
 * Toda a configuração vem do metadata do backend carregado
 * no início da aplicação pelo MetadataContext.
 */
const RegistrationsCRUDPage: React.FC = () => {
  return (
    <EntityCRUD
      entityName="registration"
      hideArrayFields={true}
      pageTitle="Gerenciar Inscrições"
      pageDescription="Gerencie todas as inscrições da plataforma"
    />
  );
};

export default RegistrationsCRUDPage;
