import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import EntityCRUD from "../Generic/EntityCRUD";
import { isAdmin } from "../../utils/auth";

/**
 * Página administrativa pra editar o StoreProfile de um CLIENT específico.
 * Acessada via action button na tabela /clientes pelo ADMIN.
 *
 * URL: /admin/dados-estabelecimento/:userId
 * BE:  /api/store-profile/by-user/{userId}  (ADMIN-only no BE)
 */
const AdminStoreProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  if (!isAdmin()) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#dc2626" }}>
        <p>Acesso restrito a administradores.</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: 12 }}>Voltar</button>
      </div>
    );
  }

  if (!userId) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
        <p>userId não informado na URL.</p>
      </div>
    );
  }

  return (
    <EntityCRUD
      entityName="storeProfile"
      entityId={userId}
      apiEndpoint="/api/store-profile/by-user"
      initialMode="edit"
      hideTable={true}
      showEditButton={false}
      pageTitle="Editar Estabelecimento (Admin)"
      pageDescription="Edição administrativa do StoreProfile do CLIENT selecionado."
      hiddenFields={["user", "createdAt", "updatedAt", "tableOrdersEnabledAt"]}
    />
  );
};

export default AdminStoreProfilePage;
