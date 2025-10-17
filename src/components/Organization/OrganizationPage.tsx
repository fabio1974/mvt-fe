import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";
import { useOrganization } from "../../hooks/useOrganization";

/**
 * Página de Organização do Usuário
 *
 * Usa o componente genérico EntityCRUD em modo view/edit:
 * - Se tem organização: inicia em modo VIEW (campos desabilitados)
 * - Se não tem organização: inicia em modo CREATE
 * - Botão "Editar" habilita os campos (modo EDIT)
 * - Após salvar, volta para VIEW
 * - Breadcrumb no topo
 */
const OrganizationPage: React.FC = () => {
  const { organizationId } = useOrganization();

  // Se não tem organizationId, inicia em modo create
  if (!organizationId) {
    return (
      <EntityCRUD
        entityName="organization"
        initialMode="create"
        hideTable={true}
        hideArrayFields={true}
        pageTitle="Criar Organização"
        pageDescription="Cadastre sua organização para criar eventos"
      />
    );
  }

  // Se tem organizationId, inicia em modo view
  return (
    <EntityCRUD
      entityName="organization"
      entityId={organizationId}
      initialMode="view"
      hideTable={true}
      showEditButton={true}
      hideArrayFields={true}
      pageTitle="Minha Organização"
      pageDescription="Visualize e edite os dados da sua organização"
    />
  );
};

export default OrganizationPage;
