import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";
import { getUserId } from "../../utils/auth";

/**
 * Página de Dados Bancários do Usuário
 *
 * Usa o componente genérico EntityCRUD em modo view/edit:
 * - Carrega dados bancários do usuário logado automaticamente
 * - Inicia em modo VIEW (campos desabilitados)
 * - Botão "Editar" habilita os campos (modo EDIT)
 * - Após salvar, volta para VIEW
 * - Breadcrumb no topo
 */
const BankAccountPage: React.FC = () => {
  const userId = getUserId();

  if (!userId) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Erro: Usuário não autenticado</p>
      </div>
    );
  }

  return (
    <EntityCRUD
      entityName="bankAccount"
      entityId={userId}
      initialMode="view"
      hideTable={true}
      showEditButton={true}
      pageTitle="Meus Dados Bancários"
      pageDescription="Visualize e edite suas informações bancárias"
    />
  );
};

export default BankAccountPage;
