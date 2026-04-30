import React, { useState } from "react";
import EntityCRUD from "../Generic/EntityCRUD";
import { getUserRole } from "../../utils/auth";

/**
 * Página "Dados do Estabelecimento" — só pra CLIENT.
 *
 * Edita o StoreProfile do CLIENT logado via /api/store-profile/me.
 * Mesmo padrão de PersonalDataPage (EntityCRUD em modo view/edit).
 *
 * Campos editáveis (do StoreProfile):
 *   - tradeName (nome fantasia)
 *   - cnpj (CNPJ — separado do User.documentNumber que é CPF do dono)
 *   - logoUrl (logo que aparece no recibo térmico)
 *   - description, openingHours, etc.
 *
 * Pagar.me / dados pessoais ficam em "Dados Pessoais" (User).
 */
const StoreProfilePage: React.FC = () => {
  const userRole = getUserRole();
  const isClient = userRole === "ROLE_CLIENT" || userRole === "CLIENT";
  const [, setCurrentMode] = useState<"view" | "edit">("view");

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
      showEditButton={true}
      pageTitle="Dados do Estabelecimento"
      pageDescription="Logo, CNPJ, nome fantasia e configurações do seu estabelecimento (aparecem no recibo térmico)"
      hiddenFields={["user", "createdAt", "updatedAt", "tableOrdersEnabledAt"]}
      onModeChange={(mode) => {
        if (mode === "view" || mode === "edit") setCurrentMode(mode);
      }}
    />
  );
};

export default StoreProfilePage;
