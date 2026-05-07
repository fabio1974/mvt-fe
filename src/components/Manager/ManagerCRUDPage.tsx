import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";

/**
 * Página de CRUD completo para Gerentes (ORGANIZER)
 *
 * Filtra usuários com role = ORGANIZER.
 * Nota (2026-05-07): botão "Gerenciar Conta Bancária" removido — repasses
 * agora saem 100% via PIX-out. Chave PIX é editada nos campos pixKey/pixKeyType
 * do formulário do próprio gerente.
 */
const ManagerCRUDPage: React.FC = () => {
  return (
    <EntityCRUD
      entityName="user"
      hideArrayFields={false}
      hideFields={["clientContracts", "employmentContracts", "vehicles", "storeProfile"]}
      hiddenFields={["clientContracts", "employmentContracts", "vehicles", "storeProfile"]}
      pageTitle="Gerentes"
      pageDescription="Gerencie os gerentes (organizadores) cadastrados na plataforma"
      initialFilters={{ role: "ORGANIZER" }}
    />
  );
};

export default ManagerCRUDPage;
