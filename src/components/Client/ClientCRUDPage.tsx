import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";

/**
 * Página de CRUD para Clientes (estabelecimentos).
 * Filtra usuários com role = CLIENT.
 *
 * Nota (2026-05-07): botão "Gerenciar Conta Bancária" removido — repasses
 * agora saem 100% via PIX-out. Chave PIX é editada nos campos pixKey/pixKeyType
 * do próprio formulário do estabelecimento.
 */
const ClientCRUDPage: React.FC = () => {
  return (
    <EntityCRUD
      entityName="user"
      hideArrayFields={false}
      hideFields={["employmentContracts", "employmentContract", "vehicles", "storeProfile"]}
      hiddenFields={["employmentContracts", "employmentContract", "vehicles", "clientContracts", "bankAccount"]}
      pageTitle="Clientes"
      pageDescription="Gerencie os clientes cadastrados na plataforma"
      initialFilters={{ role: "CLIENT" }}
    />
  );
};

export default ClientCRUDPage;
