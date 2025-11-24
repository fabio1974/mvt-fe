import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";

/**
 * Página de CRUD para Clientes
 * Filtra usuários com role = CLIENT
 */
const ClientCRUDPage: React.FC = () => {
  return (
    <EntityCRUD
      entityName="user"
      hideArrayFields={false}
      hideFields={["employmentContracts", "employmentContract"]} // Esconde na tabela
      hiddenFields={["employmentContracts", "employmentContract"]} // Esconde no formulário
      pageTitle="Clientes"
      pageDescription="Gerencie os clientes cadastrados na plataforma"
      initialFilters={{ role: "CLIENT" }}
    />
  );
};

export default ClientCRUDPage;
