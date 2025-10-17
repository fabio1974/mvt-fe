import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";
import { getUserId } from "../../utils/auth";

/**
 * Página de Dados Pessoais do Usuário
 *
 * Usa o componente genérico EntityCRUD em modo view/edit:
 * - Carrega dados do usuário logado automaticamente
 * - Inicia em modo VIEW (campos desabilitados)
 * - Botão "Editar" habilita os campos (modo EDIT)
 * - Após salvar, volta para VIEW
 * - Breadcrumb no topo
 */
const PersonalDataPage: React.FC = () => {
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
      entityName="user"
      entityId={userId}
      initialMode="view"
      hideTable={true}
      showEditButton={true}
      pageTitle="Meus Dados Pessoais"
      pageDescription="Visualize e edite suas informações pessoais"
    />
  );
};

export default PersonalDataPage;
