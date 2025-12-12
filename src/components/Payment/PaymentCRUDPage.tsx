import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";
import { getUserRole } from "../../utils/auth";

/**
 * Página CRUD de Pagamentos
 *
 * Exibe lista de pagamentos com filtros
 * Roles permitidas: ADMIN, ORGANIZER, COURIER
 * Modos: LIST e VIEW (sem criar/editar)
 */
const PaymentCRUDPage: React.FC = () => {
  const userRole = getUserRole();
  
  // Verifica se o usuário tem permissão
  const allowedRoles = ["ROLE_ADMIN", "ROLE_ORGANIZER", "ROLE_COURIER"];
  const hasAccess = allowedRoles.includes(userRole || "");

  if (!hasAccess) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Acesso negado. Apenas ADMIN, ORGANIZER ou COURIER podem visualizar pagamentos.</p>
      </div>
    );
  }

  return (
    <EntityCRUD
      entityName="payment"
      pageTitle="Pagamentos"
      pageDescription="Visualize e gerencie os pagamentos da plataforma"
      disableCreate={true}
      disableDelete={true}
      hideArrayFields={true}
    />
  );
};

export default PaymentCRUDPage;
