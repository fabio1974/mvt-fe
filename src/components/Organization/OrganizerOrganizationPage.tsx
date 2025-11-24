import React, { useEffect, useState } from "react";
import EntityCRUD from "../Generic/EntityCRUD";
import { getUserId } from "../../utils/auth";

/**
 * Página de CRUD de Organização para o perfil ORGANIZER
 * 
 * Mostra apenas a organização onde o usuário logado é o owner (gerente).
 * Usa o mesmo componente EntityCRUD que o ADMIN, mas com pré-filtro aplicado.
 */
const OrganizerOrganizationPage: React.FC = () => {
  const [ownerId, setOwnerId] = useState<string>("");

  useEffect(() => {
    // Obter o ID do usuário logado para usar como filtro de owner
    const userId = getUserId();
    if (userId) {
      setOwnerId(userId);
    }
  }, []);

  // Não renderiza até ter o ownerId carregado
  if (!ownerId) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Carregando...
      </div>
    );
  }

  return (
    <EntityCRUD
      entityName="organization"
      hideArrayFields={false}
      pageTitle="Meu Grupo"
      pageDescription="Visualize e gerencie seu grupo"
      // Pré-filtro: apenas organizações onde o owner é o usuário logado
      initialFilters={{
        owner: ownerId,
      }}
      // Esconde os filtros da tabela
      hideFilters={true}
      // Desabilita operações de create e delete
      disableCreate={true}
      disableDelete={true}
    />
  );
};

export default OrganizerOrganizationPage;
