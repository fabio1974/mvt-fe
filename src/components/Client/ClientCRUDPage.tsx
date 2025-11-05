import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";

/**
 * Página de CRUD para Estabelecimentos (Clientes)
 * Filtra usuários com role = CLIENT
 */
const ClientCRUDPage: React.FC = () => {
  return (
    <EntityCRUD
      entityName="user"
      hideArrayFields={false}
      pageTitle="Estabelecimentos"
      pageDescription="Gerencie os estabelecimentos cadastrados na plataforma"
      initialFilters={{ role: "CLIENT" }}
    />
  );
};

export default ClientCRUDPage;
