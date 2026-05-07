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
 *
 * Nota (2026-05-07): botão "Gerenciar Conta Bancária" removido — repasses
 * agora saem 100% via PIX-out (PagarmeTransfer). Chave PIX é editada no
 * formulário do próprio usuário (campos pixKey/pixKeyType). BankAccountModal
 * permanece no repo se admin precisar acessar via outra via.
 */
const CourierCRUDPage: React.FC = () => {
  return (
    <EntityCRUD
      entityName="user"
      hideArrayFields={false}
      hideFields={["clientContracts", "clientContract", "storeProfile"]}
      hiddenFields={["clientContracts", "clientContract", "storeProfile"]}
      pageTitle="Motoboys"
      pageDescription="Gerencie os motoboys da plataforma"
      initialFilters={{ role: "COURIER" }}
    />
  );
};

export default CourierCRUDPage;
