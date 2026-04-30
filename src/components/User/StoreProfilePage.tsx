import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";
import { getUserRole } from "../../utils/auth";

/**
 * Página "Dados do Estabelecimento" — APENAS LEITURA pra CLIENT.
 *
 * Mostra o StoreProfile do CLIENT logado via /api/store-profile/me em modo view.
 * Edição é feita pelo ADMIN via tabela /clientes (action button → AdminStoreProfilePage).
 */
const StoreProfilePage: React.FC = () => {
  const userRole = getUserRole();
  const isClient = userRole === "ROLE_CLIENT" || userRole === "CLIENT";

  if (!isClient) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
        <p>Esta página é exclusiva para estabelecimentos (CLIENT).</p>
      </div>
    );
  }

  return (
    <EntityCRUD
      entityName="storeProfile"
      entityId="me"
      apiEndpoint="/api/store-profile"
      initialMode="view"
      hideTable={true}
      showEditButton={false}
      pageTitle="Dados do Estabelecimento"
      pageDescription="Visualização do seu perfil de estabelecimento. Para alterações, contate o suporte."
      hiddenFields={["user", "createdAt", "updatedAt", "tableOrdersEnabledAt"]}
    />
  );
};

export default StoreProfilePage;
